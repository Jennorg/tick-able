import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createClient();

  // Check role (staff only: agent or admin)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role;
  if (role !== "admin" && role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Tickets by status
  const { data: statusData } = await supabase.from("tickets").select("status");

  const statusCounts = (statusData || []).reduce((acc: any, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {});

  // Tickets by priority
  const { data: priorityData } = await supabase
    .from("tickets")
    .select("priority");

  const priorityCounts = (priorityData || []).reduce((acc: any, curr) => {
    acc[curr.priority] = (acc[curr.priority] || 0) + 1;
    return acc;
  }, {});

  // IA Tokens usage
  const { data: iaData } = await supabase
    .from("ia_audit_log")
    .select("tokens_used");

  const totalTokens = (iaData || []).reduce(
    (acc, curr) => acc + (curr.tokens_used || 0),
    0,
  );

  // Agent Performance
  const { data: agents } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("role", ["agent", "admin"]);

  const { data: agentTickets } = await supabase
    .from("tickets")
    .select("assigned_to, status")
    .not("assigned_to", "is", null);

  const agentStats = (agents || []).map((agent) => {
    const tickets = (agentTickets || []).filter(
      (t) => t.assigned_to === agent.id,
    );
    return {
      name: agent.full_name,
      assigned: tickets.length,
      closed: tickets.filter((t) => t.status === "resolved").length,
      satisfaction: (Math.random() * 2 + 3).toFixed(1), // Random 3.0 - 5.0
    };
  });

  return NextResponse.json({
    status: statusCounts,
    priority: priorityCounts,
    totalTokens,
    estimatedCost: (totalTokens / 1000000) * 1.25, // Estimate for Gemini 1.5 Pro (higher cost/accuracy)
    agentStats,
  });
}
