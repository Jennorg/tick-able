"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function NewTicketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<
    { label: string; value: string }[]
  >([]);

  useEffect(() => {
    fetch("/api/categories")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch categories");
        const text = await res.text();
        return text ? JSON.parse(text) : [];
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data.map((c: any) => ({ label: c.name, value: c.id })));
        }
      })
      .catch((err) => console.error("Error loading categories:", err));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const body = {
      title: formData.get("title"),
      description: formData.get("description"),
      priority: formData.get("priority"),
      category_id: formData.get("categoryId") || null,
    };

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      let data: any = {};
      const text = await res.text();
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error("Failed to parse response JSON:", text);
        }
      }

      if (!res.ok) {
        throw new Error(data.error || "Ocurrió un error al crear el ticket");
      }

      router.push(`/tickets/${data.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  const priorityOptions = [
    { label: "Baja", value: "low" },
    { label: "Media", value: "medium" },
    { label: "Alta", value: "high" },
    { label: "Urgente", value: "urgent" },
  ];

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Crear Nuevo Ticket</CardTitle>
          <p className="text-[#8d99ae]">
            Describe tu problema detalladamente para que podamos ayudarte.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              name="title"
              label="Título"
              placeholder="Ej: Problema con el acceso al servidor"
              required
              minLength={10}
            />
            <Textarea
              name="description"
              label="Descripción"
              placeholder="Proporciona todos los detalles relevantes..."
              required
              minLength={20}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                name="priority"
                label="Prioridad"
                options={priorityOptions}
                defaultValue="medium"
              />
              <Select
                name="categoryId"
                label="Categoría (Opcional)"
                options={[
                  { label: "Seleccionar...", value: "" },
                  ...categories,
                ]}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-100">
                {error}
              </p>
            )}

            <div className="flex gap-4 justify-end pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
              <Button type="submit" isLoading={loading}>
                Crear Ticket
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
