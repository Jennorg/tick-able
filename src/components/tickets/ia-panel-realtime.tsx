"use client";

import { Brain, Clock } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/components/ui/button";
import { IaPanelActions } from "./ia-panel-actions";

interface IaPanelProps {
  ticket: any;
}

export function IaPanelRealtime({ ticket: initialTicket }: IaPanelProps) {
  const [ticket, setTicket] = useState(initialTicket);
  const [pollCount, setPollCount] = useState(0);
  const supabase = createClient();

  // Polling fallback: fetch ticket data until IA analysis arrives
  const pollForIA = useCallback(async () => {
    if (ticket.ia_summary) return; // Already have it, stop polling
    const { data } = await supabase
      .from("tickets")
      .select("ia_summary, ia_classification, ia_suggestions, ia_risk_level, ia_model, ia_latency_ms, ia_tokens_used")
      .eq("id", ticket.id)
      .single();

    if (data?.ia_summary) {
      setTicket((prev: any) => ({ ...prev, ...data }));
    }
  }, [ticket.id, ticket.ia_summary, supabase]);

  // Poll every 4 seconds while IA is pending (max ~60s = 15 polls)
  useEffect(() => {
    if (ticket.ia_summary) return;
    if (pollCount >= 15) return; // Give up after 60s

    const timer = setTimeout(async () => {
      await pollForIA();
      setPollCount((c) => c + 1);
    }, 4000);

    return () => clearTimeout(timer);
  }, [ticket.ia_summary, pollCount, pollForIA]);

  // Supabase Realtime subscription (instant update when DB changes)
  useEffect(() => {
    if (ticket.ia_summary) return;

    const channel = supabase
      .channel(`ticket-ia-${ticket.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tickets",
          filter: `id=eq.${ticket.id}`,
        },
        (payload) => {
          if (payload.new.ia_summary) {
            setTicket((prev: any) => ({ ...prev, ...payload.new }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticket.id, ticket.ia_summary, supabase]);

  const riskColor = {
    critical: "bg-red-600 animate-pulse",
    high: "bg-orange-500",
    medium: "bg-yellow-500",
    low: "bg-green-500",
  }[ticket.ia_risk_level as string] ?? "bg-gray-400";

  return (
    <>
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
              <p className="text-sm text-gray-800">{ticket.ia_classification}</p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase text-blue-600 tracking-wider">
                Nivel de Riesgo
              </p>
              <div className="flex items-center gap-2">
                <span className={cn("h-3 w-3 rounded-full", riskColor)} />
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
                &ldquo;{ticket.ia_suggestions}&rdquo;
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
            <p className="text-xs font-medium">Procesando análisis de IA...</p>
            <p className="text-[10px] opacity-60">
              {pollCount > 0
                ? `Verificando... (${pollCount * 4}s)`
                : "Iniciando análisis"}
            </p>
          </div>
        )}
      </CardContent>
    </>
  );
}
