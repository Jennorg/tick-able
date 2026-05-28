import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { triggerHighPriorityAlert } from "@/lib/n8n";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { id } = await params;
  const { data, error } = await supabase
    .from("tickets")
    .select(
      "*, profiles!created_by(full_name, avatar_url), categories(name), assigned_to_profile:profiles!assigned_to(full_name)",
    )
    .eq("id", id)
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { id } = await params;

  // Check role
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role;
  if (role !== "admin" && role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { status, assigned_to, priority } = body;

  // Fetch current ticket to compare and get creator
  const { data: currentTicket } = await supabase
    .from("tickets")
    .select("status, assigned_to, created_by, title, priority")
    .eq("id", id)
    .single();

  if (!currentTicket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const { data: updatedTicket, error } = await supabase
    .from("tickets")
    .update({
      status,
      assigned_to,
      priority,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Notifications Logic
  const notifications = [];

  // Notify creator of status change
  if (status && status !== currentTicket.status) {
    notifications.push({
      user_id: currentTicket.created_by,
      ticket_id: id,
      message: `Tu ticket "${currentTicket.title}" ha cambiado a estado: ${status}`,
    });
  }

  // Notify new assigned agent
  if (assigned_to && assigned_to !== currentTicket.assigned_to) {
    notifications.push({
      user_id: assigned_to,
      ticket_id: id,
      message: `Se te ha asignado el ticket: "${currentTicket.title}"`,
    });
  }

  // Notify creator of priority change (Escalation)
  if (priority === "urgent" && currentTicket.priority !== "urgent") {
    notifications.push({
      user_id: currentTicket.created_by,
      ticket_id: id,
      message: `Tu ticket "${currentTicket.title}" ha sido escalado a prioridad URGENTE.`,
    });
  }

  // Trigger n8n Slack alert if priority is updated to high or urgent
  if (
    (priority === "high" || priority === "urgent") &&
    priority !== currentTicket.priority
  ) {
    await triggerHighPriorityAlert({
      id: id,
      title: currentTicket.title,
      priority: priority,
    });
  }

  if (notifications.length > 0) {
    await supabase.from("notifications").insert(notifications);
  }

  return NextResponse.json(updatedTicket);
}
