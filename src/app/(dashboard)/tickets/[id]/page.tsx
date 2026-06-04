import {
  AlertCircle,
  ArrowLeft,
  Brain,
  CheckCircle2,
  Clock,
  MessageSquare,
  ShieldAlert,
  User,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AgentActions } from "@/components/tickets/agent-actions";
import { CommentForm } from "@/components/tickets/comment-form";
import { IaPanelRealtime } from "@/components/tickets/ia-panel-realtime";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase-server";
import { cn } from "@/components/ui/button";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role || "user";
  const isSuperAdmin = user?.user_metadata?.is_superadmin === true || role === "superadmin";
  const isStaff = role === "admin" || role === "agent" || isSuperAdmin;

  // Get user's organization_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user?.id)
    .single();

  const orgId = profile?.organization_id;

  let query = supabase
    .from("tickets")
    .select(
      "*, profiles!created_by(full_name, avatar_url, role), assigned_to_profile:profiles!assigned_to(full_name)",
    )
    .eq("id", id);

  if (!isSuperAdmin) {
    if (orgId) {
      query = query.eq("organization_id", orgId);
    } else {
      query = query.eq("created_by", user?.id);
    }
  }

  const { data: ticket } = await query.single();

  if (!ticket) {
    notFound();
  }

  const { data: comments } = await supabase
    .from("comments")
    .select("*, profiles!author_id(full_name, avatar_url, role)")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  const priorityColors = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-blue-100 text-blue-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
  };

  const statusColors = {
    open: "bg-blue-50 text-blue-700 border-blue-100",
    in_progress: "bg-amber-50 text-amber-700 border-amber-100",
    resolved: "bg-emerald-50 text-emerald-700 border-emerald-100",
  };

  return (
    <div className="space-y-6 pb-20">
      <Link
        href="/tickets"
        className="inline-flex items-center gap-2 text-sm text-[#8d99ae] hover:text-[#ef233c] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a tickets
      </Link>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-[#2b2d42]">
                    {ticket.title}
                  </h1>
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                      statusColors[ticket.status as keyof typeof statusColors],
                    )}
                  >
                    {ticket.status}
                  </span>
                </div>
                <p className="text-sm text-[#8d99ae]">
                  ID: #{ticket.id.split("-")[0]} • Creado el{" "}
                  {new Date(ticket.created_at).toLocaleString()}
                </p>
              </div>
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-semibold",
                  priorityColors[
                    ticket.priority as keyof typeof priorityColors
                  ],
                )}
              >
                {ticket.priority.toUpperCase()}
              </span>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose max-w-none text-[#2b2d42]">
                <p className="whitespace-pre-wrap">{ticket.description}</p>
              </div>

              <div className="flex items-center gap-6 pt-6 border-t text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-[#2b2d42]">
                      {ticket.profiles?.full_name}
                    </p>
                    <p className="text-xs text-[#8d99ae]">Solicitante</p>
                  </div>
                </div>
                {ticket.assigned_to_profile && (
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <ShieldAlert className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-[#2b2d42]">
                        {ticket.assigned_to_profile.full_name}
                      </p>
                      <p className="text-xs text-[#8d99ae]">Agente asignado</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <section className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-[#2b2d42]">
              <MessageSquare className="h-5 w-5 text-[#8d99ae]" />
              Comentarios ({comments?.length || 0})
            </h3>

            <div className="space-y-4">
              {comments?.map((comment) => (
                <div
                  key={comment.id}
                  className={cn(
                    "flex gap-4 p-4 rounded-xl border",
                    comment.is_internal
                      ? "bg-gray-50 border-gray-200"
                      : "bg-white border-gray-100",
                  )}
                >
                  <div className="h-10 w-10 rounded-full bg-gray-250 flex-shrink-0 flex items-center justify-center">
                    <User className="h-6 w-6 text-[#8d99ae]" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#2b2d42]">
                          {comment.profiles?.full_name}
                        </span>
                        {comment.is_internal && (
                          <span className="px-1.5 py-0.5 rounded bg-gray-200 text-[10px] font-bold uppercase text-[#2b2d42] tracking-wider">
                            Interno
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#8d99ae]">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-[#2b2d42] whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}

              {(!comments || comments.length === 0) && (
                <div className="text-center py-10 bg-white border border-dashed rounded-xl text-[#8d99ae]">
                  <p>Aún no hay comentarios.</p>
                </div>
              )}
            </div>

            <Card>
              <CommentForm ticketId={ticket.id} />
            </Card>
          </section>
        </div>

        {/* Sidebar IA Panel & Actions */}
        <aside className="w-full lg:w-80 space-y-6">
          {isStaff && (
            <Card className="border-blue-200 bg-blue-50">
              <IaPanelRealtime ticket={ticket} />
            </Card>
          )}

          {isStaff && (
            <Card>
              <CardHeader className="pb-2 border-b">
                <CardTitle className="text-sm">Acciones de Agente</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <AgentActions
                  ticketId={ticket.id}
                  currentStatus={ticket.status}
                  currentAssignedTo={ticket.assigned_to}
                />
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
