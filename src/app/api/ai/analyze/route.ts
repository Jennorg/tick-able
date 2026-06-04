import { NextResponse } from "next/server";
import { analyzeTicket, selectBestAgent } from "@/lib/gemini";
import { createServiceClient } from "@/lib/supabase-service";

export async function POST(request: Request) {
  const body = await request.json();
  const { ticketId, title, description } = body;

  if (!ticketId || !title || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createServiceClient();

  try {
    const { data: iaData, latency: iaLatency, tokensUsed: iaTokens, prompt } = await analyzeTicket(title, description);

    // 0. Get ticket organization
    const { data: ticket } = await supabase
      .from("tickets")
      .select("organization_id")
      .eq("id", ticketId)
      .single();

    const orgId = ticket?.organization_id;

    // AI Assignment Logic
    // 1. Fetch agents from the SAME organization
    let agentsQuery = supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("role", ["agent", "admin"]);
    
    if (orgId) {
      agentsQuery = agentsQuery.eq("organization_id", orgId);
    }

    const { data: agents } = await agentsQuery;

    let ticketQuery = supabase
      .from("tickets")
      .select("assigned_to, status, created_at")
      .not("assigned_to", "is", null);
    
    if (orgId) {
      ticketQuery = ticketQuery.eq("organization_id", orgId);
    }

    const { data: allAgentTickets } = await ticketQuery;

    // 2. Calculate daily resolution average for each agent
    const agentsPerformance = (agents || []).map(agent => {
      const agentTickets = (allAgentTickets || []).filter(t => t.assigned_to === agent.id);
      const resolvedTickets = agentTickets.filter(t => t.status === "resolved");
      
      const firstTicketDate = agentTickets.length > 0 
        ? new Date(Math.min(...agentTickets.map(t => new Date(t.created_at).getTime())))
        : new Date();
      const daysActive = Math.max(1, Math.ceil((Date.now() - firstTicketDate.getTime()) / (1000 * 60 * 60 * 24)));
      
      return {
        id: agent.id,
        name: agent.full_name,
        dailyAverage: (resolvedTickets.length / daysActive).toFixed(2),
        currentLoad: agentTickets.filter(t => t.status !== "resolved").length
      };
    });

    // 3. Select best agent via AI (only from agents in this org)
    let selectedAgentId = null;
    let reasoning = "No hay agentes disponibles en esta organización.";
    let assignTokens = 0;

    if (agents && agents.length > 0) {
      const selectionResult = await selectBestAgent(title, agentsPerformance);
      selectedAgentId = selectionResult.selectedAgentId;
      reasoning = selectionResult.reasoning;
      assignTokens = selectionResult.tokensUsed;
    }

    // Update ticket with IA results and Assignment
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        ia_summary: iaData.summary,
        ia_classification: iaData.classification,
        ia_suggestions: iaData.suggestions,
        ia_risk_level: (iaData.riskLevel || "low").toLowerCase(),
        ia_raw_json: iaData,
        ia_prompt: prompt,
        ia_model: "gemini-2.0-flash",
        ia_latency_ms: iaLatency,
        ia_tokens_used: iaTokens + assignTokens,
        assigned_to: selectedAgentId,
        ia_assignment_reasoning: reasoning
      })
      .eq("id", ticketId);

    if (updateError) {
      console.error("[AI Analyze] Supabase update error:", updateError);
    }

    // Audit log
    await supabase.from("ia_audit_log").insert({
      ticket_id: ticketId,
      organization_id: orgId, // Log the organization
      prompt: `Analysis + Assignment: ${reasoning}`,
      model: "gemini-2.0-flash",
      latency_ms: iaLatency,
      tokens_used: iaTokens + assignTokens,
      result: { analysis: iaData, assignment: { selectedAgentId, reasoning } },
    });

    // Notification
    if (selectedAgentId) {
      await supabase.from("notifications").insert([{
        user_id: selectedAgentId,
        ticket_id: ticketId,
        message: `🤖 IA te ha asignado el ticket: "${title}" basado en tu alto rendimiento.`,
      }]);
    }

    console.log(`[AI Analyze] ✓ ticket ${ticketId} processed and assigned to ${selectedAgentId}`);
    return NextResponse.json({ success: true, latency: iaLatency, tokensUsed: iaTokens + assignTokens });
  } catch (error) {
    console.error("[AI Analyze] Failed:", error);
    return NextResponse.json({ error: "AI analysis failed" }, { status: 500 });
  }
}
