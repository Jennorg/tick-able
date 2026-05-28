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
import { IaPanelActions } from "@/components/tickets/ia-panel-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase-server";

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
  const isStaff = role === "admin" || role === "agent";

  const { data: ticket } = await supabase
    .from("tickets")
    .select(
      "*, profiles!created_by(full_name, avatar_url, role), assigned_to_profile:profiles!assigned_to(full_name)",
    )
    .eq("id", id)
    .single();

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
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a tickets
      </Link>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">
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
                <p className="text-sm text-gray-500">
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
              <div className="prose max-w-none text-gray-700">
                <p className="whitespace-pre-wrap">{ticket.description}</p>
              </div>

              <div className="flex items-center gap-6 pt-6 border-t text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {ticket.profiles?.full_name}
                    </p>
                    <p className="text-xs text-gray-500">Solicitante</p>
                  </div>
                </div>
                {ticket.assigned_to_profile && (
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <ShieldAlert className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {ticket.assigned_to_profile.full_name}
                      </p>
                      <p className="text-xs text-gray-500">Agente asignado</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <section className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-gray-400" />
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
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900">
                          {comment.profiles?.full_name}
                        </span>
                        {comment.is_internal && (
                          <span className="px-1.5 py-0.5 rounded bg-gray-200 text-[10px] font-bold uppercase text-gray-600 tracking-wider">
                            Interno
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}

              {(!comments || comments.length === 0) && (
                <div className="text-center py-10 bg-white border border-dashed rounded-xl text-gray-400">
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
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-2 border-b border-blue-100">
              <div className="flex items-center gap-2 text-blue-700">
                <Brain className="h-5 w-5" />
                <CardTitle className="text-base">Análisis de IA</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {ticket.ia_summary ? (
                <>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-blue-600 tracking-wider">
                      Resumen
                    </p>
                    <p className="text-sm text-gray-800 font-medium">
                      {ticket.ia_summary}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-blue-600 tracking-wider">
                      Clasificación
                    </p>
                    <p className="text-sm text-gray-800">
                      {ticket.ia_classification}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-blue-600 tracking-wider">
                      Nivel de Riesgo
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-3 w-3 rounded-full",
                          ticket.ia_risk_level === "critical"
                            ? "bg-red-600 animate-pulse"
                            : ticket.ia_risk_level === "high"
                              ? "bg-orange-500"
                              : ticket.ia_risk_level === "medium"
                                ? "bg-yellow-500"
                                : "bg-green-500",
                        )}
                      ></span>
                      <span className="text-sm font-semibold capitalize">
                        {ticket.ia_risk_level}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <p className="text-[10px] font-bold uppercase text-blue-600 tracking-wider">
                      Sugerencia de respuesta
                    </p>
                    <div className="p-3 bg-white border border-blue-200 rounded-lg text-xs text-gray-700 leading-relaxed italic">
                      "{ticket.ia_suggestions}"
                    </div>
                    <IaPanelActions
                      ticketId={ticket.id}
                      suggestion={ticket.ia_suggestions}
                    />
                  </div>

                  <div className="pt-2 border-t border-blue-100 flex items-center justify-between text-[10px] text-blue-400">
                    <span>Modelo: {ticket.ia_model}</span>
                    <span>Latencia: {ticket.ia_latency_ms}ms</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-blue-400 space-y-2">
                  <Clock className="h-8 w-8 mx-auto animate-spin opacity-50" />
                  <p className="text-xs">Procesando análisis de IA...</p>
                </div>
              )}
            </CardContent>
          </Card>

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

import { cn } from "@/components/ui/button";
