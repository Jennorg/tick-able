import { NextResponse } from "next/server";
import { analyzeTicket } from "@/lib/gemini";
import { createClient } from "@/lib/supabase-server";
import { triggerTicketConfirmation, triggerHighPriorityAlert } from "@/lib/n8n";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const body = await request.json();
  const { 
    title, 
    description, 
    priority, 
    category_id, 
    organization_id,
    customer_email,
    customer_name
  } = body;

  if (!title || !description) {
    return NextResponse.json(
      { error: "Title and description are required" },
      { status: 400 },
    );
  }

  let finalOrgId = organization_id;
  let finalCreatedBy = user?.id;

  // If authenticated, get organization_id from profile if not provided
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();
    
    if (profile) {
      finalOrgId = profile.organization_id;
    }
  }

  // Ensure we have an organization_id
  if (!finalOrgId) {
    return NextResponse.json(
      { error: "Organization ID is required" },
      { status: 400 },
    );
  }

  // 1. Insert ticket initial state
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .insert([
      {
        title,
        description,
        priority: priority || "medium",
        category_id,
        created_by: finalCreatedBy,
        organization_id: finalOrgId,
        customer_email: customer_email || user?.email,
        customer_name: customer_name || user?.user_metadata?.full_name,
        status: "open",
      },
    ])
    .select()
    .single();

  if (ticketError)
    return NextResponse.json({ error: ticketError.message }, { status: 500 });

  // Trigger n8n confirmation email
  const emailToNotify = customer_email || user?.email;
  if (emailToNotify) {
    await triggerTicketConfirmation({
      id: ticket.id,
      title: ticket.title,
      email: emailToNotify,
      priority: ticket.priority,
    });
  }

  // Trigger n8n Slack alert if high priority or urgent
  if (ticket.priority === "high" || ticket.priority === "urgent") {
    await triggerHighPriorityAlert({
      id: ticket.id,
      title: ticket.title,
      priority: ticket.priority,
    });
  }

  // 2. Call Gemini IA Analysis
  try {
    const { data: iaResult, latency: iaLatency, tokensUsed: iaTokens, prompt: iaPrompt } = await analyzeTicket(title, description);

    // AI Assignment Logic based on performance
    // 1. Fetch agents and their ticket history
    const { data: agents } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("role", ["agent", "admin"]);

    const { data: allAgentTickets } = await supabase
      .from("tickets")
      .select("assigned_to, status, created_at, resolved_at")
      .not("assigned_to", "is", null);

    // 2. Calculate daily resolution average for each agent
    const agentsPerformance = (agents || []).map(agent => {
      const agentTickets = (allAgentTickets || []).filter(t => t.assigned_to === agent.id);
      const resolvedTickets = agentTickets.filter(t => t.status === "resolved");
      
      // Calculate active days (from first ticket to now)
      const firstTicketDate = agentTickets.length > 0 
        ? new Date(Math.min(...agentTickets.map(t => new Date(t.created_at).getTime())))
        : new Date();
      const daysActive = Math.max(1, Math.ceil((Date.now() - firstTicketDate.getTime()) / (1000 * 60 * 60 * 24)));
      
      return {
        id: agent.id,
        name: agent.full_name,
        dailyAverage: (resolvedTickets.length / daysActive).toFixed(2),
        currentLoad: agentTickets.filter(t => t.status !== "resolved").length,
        totalResolved: resolvedTickets.length
      };
    });

    // 3. Let AI select the best agent
    const { selectedAgentId, reasoning, tokensUsed: assignTokens } = await selectBestAgent(title, agentsPerformance);

    // 4. Update ticket with IA results and AI assignment
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        ia_summary: iaResult.summary,
        ia_classification: iaResult.classification,
        ia_suggestions: iaResult.suggestions,
        ia_risk_level: iaResult.riskLevel,
        ia_raw_json: iaResult,
        ia_prompt: iaPrompt,
        ia_model: "gemini-2.0-flash",
        ia_latency_ms: iaLatency,
        ia_tokens_used: iaTokens + assignTokens,
        assigned_to: selectedAgentId, // AI Assignment
        ia_assignment_reasoning: reasoning
      })
      .eq("id", ticket.id);

    // 5. Log to ia_audit_log
    await supabase.from("ia_audit_log").insert([
      {
        ticket_id: ticket.id,
        organization_id: finalOrgId,
        prompt: `Analysis + Assignment: ${reasoning}`,
        model: "gemini-2.0-flash",
        latency_ms: iaLatency,
        tokens_used: iaTokens + assignTokens,
        result: { analysis: iaResult, assignment: { selectedAgentId, reasoning } },
      },
    ]);

    if (updateError)
      console.error("Error updating ticket with IA:", updateError);

    // Notify assigned agent
    if (selectedAgentId) {
      await supabase.from("notifications").insert([{
        user_id: selectedAgentId,
        ticket_id: ticket.id,
        message: `🤖 IA te ha asignado el ticket: "${ticket.title}" basado en tu alto rendimiento.`,
      }]);
    }

    return NextResponse.json({ ...ticket, ia: iaResult, assigned_to: selectedAgentId });
  } catch (iaError) {
    console.error("IA Analysis/Assignment failed:", iaError);
    return NextResponse.json(ticket);
  }
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("tickets")
    .select("*, profiles!created_by(full_name), categories(name)");

  // If authenticated, RLS will handle organization filtering.
  // We just ensure we order it correctly.
  const { data, error } = await query.order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
