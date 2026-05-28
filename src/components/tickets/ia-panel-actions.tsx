"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase-client";

export function IaPanelActions({
  ticketId,
  suggestion,
}: {
  ticketId: string;
  suggestion: string;
}) {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<string>("user");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function getRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setRole(user.user_metadata?.role || "user");
    }
    getRole();
  }, []);

  async function handleApply() {
    if (!confirm("¿Agregar esta respuesta como comentario?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: suggestion, is_internal: false }),
      });
      if (res.ok) {
        router.refresh();
        alert("Respuesta agregada con éxito");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (role === "user") return null;

  return (
    <Button
      variant="primary"
      size="sm"
      className="w-full mt-2 text-xs"
      onClick={handleApply}
      isLoading={loading}
    >
      Aplicar sugerencia
    </Button>
  );
}
