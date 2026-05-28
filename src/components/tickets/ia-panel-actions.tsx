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

  function handleApply() {
    // Despachar evento personalizado para que el formulario de comentarios lo escuche
    const event = new CustomEvent("ia-apply-suggestion", {
      detail: { suggestion },
    });
    window.dispatchEvent(event);
    
    // Opcional: Pequeño feedback visual o scroll al formulario
    const commentArea = document.querySelector('textarea[name="content"]');
    if (commentArea) {
      commentArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  if (role === "user") return null;

  return (
    <Button
      variant="primary"
      size="sm"
      className="w-full mt-2 text-xs"
      onClick={handleApply}
    >
      Usar sugerencia
    </Button>
  );
}
