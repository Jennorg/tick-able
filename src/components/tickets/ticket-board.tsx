"use client";

import { AlertTriangle, Tag, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { cn } from "@/components/ui/button";

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

interface TicketBoardProps {
  initialTickets: Ticket[];
}

const PRIORITIES = [
  {
    id: "low",
    name: "Baja",
    color: "border-t-gray-400 bg-gray-50",
    text: "text-gray-700",
    dot: "bg-gray-400",
  },
  {
    id: "medium",
    name: "Media",
    color: "border-t-blue-400 bg-blue-50/40",
    text: "text-blue-700",
    dot: "bg-blue-400",
  },
  {
    id: "high",
    name: "Alta",
    color: "border-t-orange-400 bg-orange-50/40",
    text: "text-orange-700",
    dot: "bg-orange-400",
  },
  {
    id: "urgent",
    name: "Urgente",
    color: "border-t-red-500 bg-red-50/40",
    text: "text-red-600",
    dot: "bg-red-500",
  },
  {
    id: "resolved",
    name: "Resueltos",
    color: "border-t-emerald-500 bg-emerald-50/40",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
];

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-50 text-blue-700 border-blue-100",
  in_progress: "bg-amber-50 text-amber-700 border-amber-100",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

export function TicketBoard({ initialTickets }: TicketBoardProps) {
  const router = useRouter();
  const [tickets, setTickets] = React.useState<Ticket[]>(initialTickets);
  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = React.useState<string | null>(
    null,
  );
  const [toast, setToast] = React.useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [hoveredTicketId, setHoveredTicketId] = React.useState<string | null>(null);
  const [hoveredPosition, setHoveredPosition] = React.useState<"top" | "bottom" | null>(null);

  // Sync state if initialTickets change from filters
  React.useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);

  const gridRef = React.useRef<HTMLDivElement>(null);

  const handleGridMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only scroll if clicking directly on the grid container or empty/header spaces (not cards/links/buttons)
    const target = e.target as HTMLElement;
    if (target.closest("li[draggable]") || target.closest("a, button, input, select, textarea")) {
      return;
    }

    const gridContainer = e.currentTarget;
    const startX = e.clientX;
    const startY = e.clientY;
    const startScrollLeft = gridContainer.scrollLeft;
    const startScrollTop = window.scrollY || document.documentElement.scrollTop;
    
    gridContainer.style.cursor = "grabbing";
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      gridContainer.scrollLeft = startScrollLeft - deltaX;
      window.scrollTo(0, startScrollTop - deltaY);
    };

    const handleMouseUp = () => {
      gridContainer.style.cursor = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleColumnMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // If the click is on a card (li) or anything inside a card, don't scroll
    const target = e.target as HTMLElement;
    if (target.closest("li[draggable]") || target.closest("a, button, input, select, textarea")) {
      return;
    }

    const columnContainer = e.currentTarget;
    const gridContainer = gridRef.current;
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startScrollLeft = gridContainer ? gridContainer.scrollLeft : 0;
    const startScrollTop = window.scrollY || document.documentElement.scrollTop;
    
    columnContainer.style.cursor = "grabbing";
    if (gridContainer) gridContainer.style.cursor = "grabbing";
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      if (gridContainer) {
        gridContainer.scrollLeft = startScrollLeft - deltaX;
      }
      window.scrollTo(0, startScrollTop - deltaY);
    };

    const handleMouseUp = () => {
      columnContainer.style.cursor = "";
      if (gridContainer) gridContainer.style.cursor = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverColumn(null);
    setHoveredTicketId(null);
    setHoveredPosition(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
    if (e.target === e.currentTarget) {
      setHoveredTicketId(null);
      setHoveredPosition(null);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
    setHoveredTicketId(null);
    setHoveredPosition(null);
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    setDragOverColumn(null);

    const ticketId = e.dataTransfer.getData("text/plain") || draggedId;
    
    // Capture hovered values before clearing state
    const currentHoveredId = hoveredTicketId;
    const currentHoveredPos = hoveredPosition;

    setDraggedId(null);
    setHoveredTicketId(null);
    setHoveredPosition(null);

    if (!ticketId) return;

    const ticketToUpdate = tickets.find((t) => t.id === ticketId);
    if (!ticketToUpdate) return;

    // Check if there is an actual change
    const isTargetResolved = targetColumnId === "resolved";
    const currentIsResolved = ticketToUpdate.status === "resolved";

    if (isTargetResolved && currentIsResolved) return;
    if (
      !isTargetResolved &&
      ticketToUpdate.priority === targetColumnId &&
      !currentIsResolved
    )
      return;

    // Save previous state for reverting in case of API failure
    const previousTickets = [...tickets];

    // Build the updates
    const updates: Record<string, string> = {};
    if (isTargetResolved) {
      updates.status = "resolved";
    } else {
      updates.priority = targetColumnId;
      if (currentIsResolved) {
        updates.status = "in_progress";
      }
    }

    // Optimistically update UI with reordering support
    setTickets((prev) => {
      const otherTickets = prev.filter((t) => t.id !== ticketId);
      const updatedTicket = { ...ticketToUpdate, ...updates };

      if (currentHoveredId) {
        const targetIndex = otherTickets.findIndex((t) => t.id === currentHoveredId);
        if (targetIndex !== -1) {
          const insertAt = currentHoveredPos === "top" ? targetIndex : targetIndex + 1;
          const reordered = [...otherTickets];
          reordered.splice(insertAt, 0, updatedTicket);
          return reordered;
        }
      }
      return [...otherTickets, updatedTicket];
    });

    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        throw new Error("Failed to update ticket");
      }

      const statusMsg = isTargetResolved
        ? "Ticket marcado como RESUELTO."
        : `Ticket movido a prioridad ${targetColumnId.toUpperCase()}${
            currentIsResolved ? " y reabierto" : ""
          }.`;
      showToast(statusMsg);
      router.refresh();
    } catch {
      // Revert to previous state
      setTickets(previousTickets);
      showToast("Error al actualizar el ticket. Inténtalo de nuevo.", "error");
    }
  };

  return (
    <div className="relative">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all duration-300 transform translate-y-0 ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-100 text-emerald-800"
              : "bg-red-50 border-red-100 text-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <svg
              className="w-5 h-5 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              role="img"
              aria-label="Operación exitosa"
            >
              <title>Éxito</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              role="img"
              aria-label="Operación fallida"
            >
              <title>Error</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          )}
          {toast.message}
        </div>
      )}

      {/* Kanban Grid */}
      <div
        ref={gridRef}
        onMouseDown={handleGridMouseDown}
        className="flex flex-col lg:flex-row gap-4 overflow-x-auto pb-4 items-start select-none no-scrollbar cursor-grab active:cursor-grabbing"
      >
        {PRIORITIES.map((column) => {
          const columnTickets = tickets.filter((t) => {
            if (column.id === "resolved") {
              return t.status === "resolved";
            }
            return t.priority === column.id && t.status !== "resolved";
          });
          const isOver = dragOverColumn === column.id;

          return (
            <ul
              key={column.id}
              aria-label={`Prioridad ${column.name}`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
              className={`flex-1 min-w-[280px] w-full bg-gray-50/50 rounded-2xl p-4 border transition-all duration-300 flex flex-col ${
                isOver
                  ? "border-[#de5648] bg-[#de5648]/5 shadow-inner"
                  : "border-gray-100/80"
              }`}
            >
              {/* Column Header */}
              <div
                className={`flex items-center justify-between pb-2 border-b border-gray-100 border-t-4 pt-1 rounded-t-sm ${column.color}`}
              >
                <div className="flex items-center gap-2 pl-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${column.dot}`}
                  ></span>
                  <h3 className="font-bold text-[#2b2d42] text-sm">
                    {column.name}
                  </h3>
                </div>
                <span className="text-xs bg-white border border-gray-150 px-2 py-0.5 rounded-full text-[#8d99ae] font-semibold shadow-sm">
                  {columnTickets.length}
                </span>
              </div>

              {/* Cards Container */}
              <div
                onMouseDown={handleColumnMouseDown}
                className="flex-1 flex flex-col gap-3 min-h-[350px] mt-3 py-1 px-0.5 transition-all duration-300 cursor-grab active:cursor-grabbing"
              >
                {(() => {
                  const visibleTickets = columnTickets;
                  const isHoveredColumn = visibleTickets.some((t) => t.id === hoveredTicketId);
                  const itemsToRender = [...visibleTickets];

                  if (draggedId) {
                    if (isHoveredColumn) {
                      const hoveredIndex = visibleTickets.findIndex((t) => t.id === hoveredTicketId);
                      const insertionIndex = hoveredPosition === "top" ? hoveredIndex : hoveredIndex + 1;
                      itemsToRender.splice(insertionIndex, 0, { id: "placeholder-item" } as any);
                    } else if (dragOverColumn === column.id) {
                      itemsToRender.push({ id: "placeholder-item" } as any);
                    }
                  }

                  return (
                    <>
                      {itemsToRender.map((ticket, idx) => {
                        if (ticket.id === "placeholder-item") {
                          return (
                            <div
                              key="placeholder-item"
                              className="border-2 border-dashed border-[#8d99ae]/60 rounded-xl bg-[#edf2f4]/50 animate-slide-open flex-shrink-0"
                            />
                          );
                        }

                        const isCritical =
                          ticket.ia_risk_level === "critical" ||
                          ticket.ia_risk_level === "high";
                        const isBeingDragged = draggedId === ticket.id;

                        return (
                          <li
                            key={ticket.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, ticket.id)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => {
                              if (draggedId === ticket.id) return;
                              e.preventDefault();
                              e.stopPropagation();
                              
                              const rect = e.currentTarget.getBoundingClientRect();
                              const relativeY = e.clientY - rect.top;
                              const isTop = relativeY < rect.height / 2;
                              
                              setHoveredTicketId(ticket.id);
                              setHoveredPosition(isTop ? "top" : "bottom");
                            }}
                            className={cn(
                              "bg-white rounded-xl shadow-sm p-4 border border-gray-150/60 hover:shadow-md hover:border-gray-200 cursor-grab active:cursor-grabbing relative overflow-hidden flex-shrink-0 transition-all duration-250 ease-out",
                              isCritical && "border-l-4 border-l-orange-500",
                              isBeingDragged && "opacity-30 scale-95 border-dashed border-gray-300 shadow-none pointer-events-none"
                            )}
                          >
                            {ticket.ia_risk_level === "critical" && (
                              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-600 animate-pulse"></div>
                            )}

                            <div className="space-y-3">
                              {/* Header Details */}
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-[10px] text-[#8d99ae] font-mono tracking-tight">
                                  #{ticket.id.split("-")[0]}
                                </span>
                                {ticket.categories && (
                                  <span className="text-[9px] font-semibold bg-gray-100 text-[#2b2d42] px-2 py-0.5 rounded flex items-center gap-1">
                                    <Tag className="w-2.5 h-2.5" />
                                    {ticket.categories.name}
                                  </span>
                                )}
                              </div>

                              {/* Title (Clickable to Details) */}
                              <Link
                                href={`/tickets/${ticket.id}`}
                                className="block group"
                              >
                                <h4 className="font-semibold text-[#2b2d42] group-hover:text-blue-600 text-sm leading-tight transition-colors line-clamp-2">
                                  {ticket.title}
                                </h4>
                              </Link>

                              {/* Footer Details */}
                              <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-xs">
                                {/* Assignee / Solicitor */}
                                <div className="flex items-center gap-1 text-[#8d99ae] max-w-[130px]">
                                  <User className="w-3.5 h-3.5 text-[#8d99ae] shrink-0" />
                                  <span className="truncate">
                                    {ticket.profiles?.full_name || "Sin asignar"}
                                  </span>
                                </div>

                                {/* Status Badge */}
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                    STATUS_COLORS[ticket.status] ||
                                    "bg-gray-100 text-[#8d99ae]"
                                  }`}
                                >
                                  {ticket.status.toUpperCase()}
                                </span>
                              </div>

                              {/* IA Risk Level Indicator (Warning Icon) */}
                              {ticket.ia_risk_level && (
                                <div className="flex items-center gap-1.5 pt-1.5 border-t border-dashed border-gray-50">
                                  <span
                                    className={`h-2 w-2 rounded-full ${
                                      ticket.ia_risk_level === "critical"
                                        ? "bg-red-600 animate-pulse"
                                        : ticket.ia_risk_level === "high"
                                          ? "bg-orange-500"
                                          : ticket.ia_risk_level === "medium"
                                            ? "bg-yellow-500"
                                            : "bg-green-500"
                                    }`}
                                  ></span>
                                   <span className="text-[10px] text-[#8d99ae] font-medium capitalize">
                                    Riesgo IA: {ticket.ia_risk_level}
                                  </span>
                                  {isCritical && (
                                    <AlertTriangle className="h-3 w-3 text-orange-500 ml-auto" />
                                  )}
                                </div>
                              )}
                            </div>
                          </li>
                        );
                      })}

                      {visibleTickets.length === 0 && (!draggedId || dragOverColumn !== column.id) && (
                        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-[#8d99ae]/80 text-xs">
                          Suelta un ticket aquí
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </ul>
          );
        })}
      </div>
    </div>
  );
}
