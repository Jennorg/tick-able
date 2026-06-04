"use client";

import {
  AlertTriangle,
  LayoutGrid,
  List,
  Plus,
  Ticket as TicketIcon,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TicketBoard } from "./ticket-board";
import { TicketFilters } from "./ticket-filters";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category_id: string | null;
  created_by: string;
  assigned_to: string | null;
  ia_risk_level: string | null;
  created_at: string;
  profiles?: { full_name: string } | null;
  categories?: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

interface TicketsViewProps {
  tickets: Ticket[];
  categories: Category[];
  role?: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-50 text-blue-700 border-blue-100",
  in_progress: "bg-amber-50 text-amber-700 border-amber-100",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

export function TicketsView({ tickets, categories, role }: TicketsViewProps) {
  const [viewMode, setViewMode] = React.useState<"board" | "list">("board");

  // Load selection from localStorage on client side mount
  React.useEffect(() => {
    const saved = localStorage.getItem("tickets-view-mode");
    if (saved === "board" || saved === "list") {
      setViewMode(saved);
    }
  }, []);

  const handleViewChange = (mode: "board" | "list") => {
    setViewMode(mode);
    localStorage.setItem("tickets-view-mode", mode);
  };

  return (
    <div className="space-y-6">
      {/* Header section with toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2b2d42]">Tickets</h1>
          <p className="text-[#8d99ae] text-sm">
            Gestiona y realiza seguimiento a tus solicitudes.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Toggle Button Group */}
          <div className="inline-flex p-1 bg-gray-100 rounded-lg text-xs font-semibold select-none border border-gray-200/50">
            <button
              type="button"
              onClick={() => handleViewChange("board")}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "board"
                  ? "bg-white text-[#2b2d42] shadow-sm"
                  : "text-[#8d99ae] hover:text-[#2b2d42]"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Tablero
            </button>
            <button
              type="button"
              onClick={() => handleViewChange("list")}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-white text-[#2b2d42] shadow-sm"
                  : "text-[#8d99ae] hover:text-[#2b2d42]"
              }`}
            >
              <List className="h-3.5 w-3.5" /> Lista
            </button>
          </div>

          {role === "user" && (
            <Link href="/tickets/new">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Nuevo Ticket
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Suspense fallback={null}>
        <TicketFilters categories={categories} viewMode={viewMode} />
      </Suspense>

      {!tickets || tickets.length === 0 ? (
        <Card className="text-center py-20 border-dashed">
          <CardContent>
            <div className="bg-gray-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4 border">
              <TicketIcon className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-[#2b2d42]">
              No se encontraron tickets
            </h3>
            <p className="text-[#8d99ae] max-w-xs mx-auto mt-2 text-sm">
              {role === "user"
                ? "Comienza creando tu primera solicitud de soporte."
                : "No hay solicitudes pendientes en este momento."}
            </p>
            {role === "user" && (
              <Link href="/tickets/new" className="mt-6 inline-block">
                <Button variant="primary">Crear mi primer ticket</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "board" ? (
        <TicketBoard initialTickets={tickets} />
      ) : (
        <div className="grid gap-4">
          {/* Desktop Table Header */}
          <div className="hidden lg:grid grid-cols-6 gap-4 px-6 py-3 bg-gray-50 rounded-lg text-sm font-semibold text-[#8d99ae] uppercase tracking-wider border border-gray-100">
            <div className="col-span-2">Ticket</div>
            <div>Prioridad</div>
            <div>Estado</div>
            <div>Fecha</div>
            <div>Riesgo IA</div>
          </div>

          {tickets.map((ticket) => (
            <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden border border-gray-150/60 border-l-4 group relative">
                {ticket.ia_risk_level === "critical" && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600"></div>
                )}
                <CardContent className="p-0">
                  <div className="lg:grid lg:grid-cols-6 lg:items-center gap-4 p-4 md:p-6">
                    <div className="lg:col-span-2 space-y-1">
                      <h4 className="font-semibold text-[#2b2d42] group-hover:text-blue-600 transition-colors line-clamp-1 text-sm">
                        {ticket.title}
                      </h4>
                      <p className="text-[10px] text-[#8d99ae] font-mono">
                        ID: #{ticket.id.split("-")[0]}
                      </p>
                    </div>

                    <div className="mt-2 lg:mt-0">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          PRIORITY_COLORS[ticket.priority] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {ticket.priority}
                      </span>
                    </div>

                    <div className="mt-2 lg:mt-0">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          STATUS_COLORS[ticket.status] ||
                          "bg-gray-50 text-gray-700"
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>

                    <div className="mt-2 lg:mt-0 text-xs text-[#8d99ae]">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </div>

                    <div className="mt-2 lg:mt-0">
                      {ticket.ia_risk_level && (
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              ticket.ia_risk_level === "critical"
                                ? "bg-red-600 animate-pulse"
                                : ticket.ia_risk_level === "high"
                                  ? "bg-orange-500"
                                  : ticket.ia_risk_level === "medium"
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                            }`}
                          ></span>
                          <span className="text-xs font-medium capitalize">
                            {ticket.ia_risk_level}
                          </span>
                          {(ticket.ia_risk_level === "critical" ||
                            ticket.ia_risk_level === "high") && (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
