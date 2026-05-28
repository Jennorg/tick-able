"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function CommentForm({ ticketId }: { ticketId: string }) {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const router = useRouter();

  useEffect(() => {
    const handleIaSuggestion = (e: any) => {
      if (e.detail && e.detail.suggestion) {
        setContent(e.detail.suggestion);
      }
    };

    window.addEventListener("ia-apply-suggestion", handleIaSuggestion);
    return () => {
      window.removeEventListener("ia-apply-suggestion", handleIaSuggestion);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      content: formData.get("content"),
      is_internal: formData.get("isInternal") === "on",
    };

    try {
      const res = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setContent("");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
      <textarea
        name="content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Escribe un comentario..."
        required
        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow resize-none min-h-[100px]"
      ></textarea>
      <div className="flex justify-between items-center mt-3">
        <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
          <input type="checkbox" name="isInternal" className="rounded" />{" "}
          Comentario interno
        </label>
        <Button type="submit" size="sm" isLoading={loading}>
          Enviar respuesta
        </Button>
      </div>
    </form>
  );
}
