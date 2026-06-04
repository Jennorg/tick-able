import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createClient();

  // Check role (staff only: agent or admin)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role;
  const isSuperAdmin = user?.user_metadata?.is_superadmin === true || role === "superadmin";

  if (role !== "admin" && role !== "agent" && role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Get user's organization_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user?.id)
    .single();

  const orgId = profile?.organization_id;

  // Tickets by status
  let ticketsQuery = supabase.from("tickets").select("status");
  if (!isSuperAdmin && orgId) {
    ticketsQuery = ticketsQuery.eq("organization_id", orgId);
  }
  const { data: statusData } = await ticketsQuery;

  const statusCounts = (statusData || []).reduce((acc: any, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {});

  // Tickets by priority
  let priorityQuery = supabase.from("tickets").select("priority");
  if (!isSuperAdmin && orgId) {
    priorityQuery = priorityQuery.eq("organization_id", orgId);
  }
  const { data: priorityData } = await priorityQuery;

  const priorityCounts = (priorityData || []).reduce((acc: any, curr) => {
    acc[curr.priority] = (acc[curr.priority] || 0) + 1;
    return acc;
  }, {});

  // IA Tokens usage - usage_stats is global or by org? 
  // If we don't have org in usage_stats, we use ia_audit_log which HAS organization_id
  
  let totalTokens = 0;
  const dailyStatsMap: Record<
    string,
    { tokens: number; requests: number }
  > = {};

  // IA Audit Logs (filtered by org)
  let iaQuery = supabase
    .from("ia_audit_log")
    .select("tokens_used, created_at");
  
  if (!isSuperAdmin && orgId) {
    iaQuery = iaQuery.eq("organization_id", orgId);
  }

  const { data: iaData } = await iaQuery;

  if (iaData) {
    for (const row of iaData) {
      const tokens = row.tokens_used || 0;
      totalTokens += tokens;

      const dateStr = new Date(row.created_at).toISOString().split("T")[0];
      if (!dailyStatsMap[dateStr]) {
        dailyStatsMap[dateStr] = { tokens: 0, requests: 0 };
      }
      dailyStatsMap[dateStr].tokens += tokens;
      dailyStatsMap[dateStr].requests += 1;
    }
  }

  const dailyStats = Object.entries(dailyStatsMap)
    .map(([date, stats]) => ({
      date,
      ...stats,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Recent IA Audit Logs
  let recentLogsQuery = supabase
    .from("ia_audit_log")
    .select(
      "id, ticket_id, model, latency_ms, tokens_used, created_at, tickets(title)",
    );
  
  if (!isSuperAdmin && orgId) {
    recentLogsQuery = recentLogsQuery.eq("organization_id", orgId);
  }

  const { data: recentLogsData } = await recentLogsQuery
    .order("created_at", { ascending: false })
    .limit(10);

  const recentLogs = (recentLogsData || []).map((log: any) => {
    const ticketTitle = Array.isArray(log.tickets)
      ? log.tickets[0]?.title
      : log.tickets?.title;

    return {
      id: log.id,
      ticketId: log.ticket_id,
      ticketTitle: ticketTitle || "Ticket Eliminado",
      model: log.model || "gemini-2.0-flash",
      latencyMs: log.latency_ms || 0,
      tokensUsed: log.tokens_used || 0,
      createdAt: log.created_at,
    };
  });

  // Agent Performance
  let agentsQuery = supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("role", ["agent", "admin"]);
  
  if (!isSuperAdmin && orgId) {
    agentsQuery = agentsQuery.eq("organization_id", orgId);
  }
  const { data: agents } = await agentsQuery;

  let agentTicketsQuery = supabase
    .from("tickets")
    .select("assigned_to, status")
    .not("assigned_to", "is", null);
  
  if (!isSuperAdmin && orgId) {
    agentTicketsQuery = agentTicketsQuery.eq("organization_id", orgId);
  }
  const { data: agentTickets } = await agentTicketsQuery;

  const agentStats = (agents || []).map((agent) => {
    const tickets = (agentTickets || []).filter(
      (t) => t.assigned_to === agent.id,
    );
    const assigned = tickets.length;
    const closed = tickets.filter((t) => t.status === "resolved").length;
    
    // Calculate a "satisfaction" score based on resolution rate (scaled to 5.0)
    const resolutionRate = assigned > 0 ? closed / assigned : 0;
    const satisfaction = (3.0 + (resolutionRate * 2.0)).toFixed(1);

    return {
      name: agent.full_name,
      assigned,
      closed,
      satisfaction: assigned > 0 ? satisfaction : "-",
    };
  });

  // Calculate costs (approximate for Gemini 1.5 Flash: $0.075 per 1M tokens)
  const COST_PER_1M_TOKENS = 0.075;
  const calculateCost = (tokens: number) => (tokens / 1000000) * COST_PER_1M_TOKENS;

  const dailyStatsWithCost = dailyStats.map(s => ({
    ...s,
    cost: calculateCost(s.tokens)
  }));

  const recentLogsWithCost = recentLogs.map(l => ({
    ...l,
    estimatedCost: calculateCost(l.tokensUsed)
  }));

  return NextResponse.json({
    status: statusCounts,
    priority: priorityCounts,
    totalTokens,
    estimatedCost: calculateCost(totalTokens),
    dailyStats: dailyStatsWithCost,
    recentLogs: recentLogsWithCost,
    agentStats,
  });
}
