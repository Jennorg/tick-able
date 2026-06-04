"use client";

import { AlertCircle, CheckCircle2, User, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase-client";

export function AgentActions({
  ticketId,
  currentStatus,
  currentAssignedTo,
}: {
  ticketId: string;
  currentStatus: string;
  currentAssignedTo: string | null;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });

    fetch("/api/users")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch users");
        const text = await res.text();
        return text ? JSON.parse(text) : [];
      })
      .then((data) => {
        if (Array.isArray(data)) {
          // Filter to only show agents and admins
          setAgents(
            data.filter((u) => u.role === "agent" || u.role === "admin"),
          );
        }
      })
      .catch((err) => console.error("Error loading agents:", err));
  }, []);

  async function handleUpdate(updates: any, actionName: string) {
    setLoading(actionName);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider flex items-center gap-1">
          <Users className="h-3 w-3" /> Asignar Agente
        </label>
        <select
          className="w-full text-xs border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={currentAssignedTo || ""}
          onChange={(e) =>
            handleUpdate({ assigned_to: e.target.value }, "assign-other")
          }
          disabled={loading === "assign-other"}
        >
          <option value="">Sin asignar</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.full_name} ({agent.role})
            </option>
          ))}
        </select>
      </div>

      <div className="pt-2 space-y-2">
        {currentAssignedTo !== currentUserId && (
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() =>
              handleUpdate(
                { assigned_to: currentUserId, status: "in_progress" },
                "assign",
              )
            }
            isLoading={loading === "assign"}
          >
            <User className="h-4 w-4" /> Asignarme a mí
          </Button>
        )}

        {currentStatus !== "resolved" && (
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => handleUpdate({ status: "resolved" }, "resolve")}
            isLoading={loading === "resolve"}
          >
            <CheckCircle2 className="h-4 w-4" /> Resolver ticket
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-red-600 hover:bg-red-50"
          onClick={() => handleUpdate({ priority: "urgent" }, "escalate")}
          isLoading={loading === "escalate"}
        >
          <AlertCircle className="h-4 w-4" /> Escalar ticket
        </Button>
      </div>
    </div>
  );
}
