"use client";

import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
}

export function PortalForm({
  organization,
  categories,
  template,
}: {
  organization: Organization;
  categories: Category[];
  template?: {
    title: string;
    description: string;
    priority: string;
    categoryId: string;
  };
}) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      organization_id: organization.id,
      customer_name: formData.get("customerName"),
      customer_email: formData.get("customerEmail"),
    };

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Ocurrió un error al enviar tu solicitud");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <Card className="border-green-100 bg-green-50/30 text-center py-12 px-6">
        <CardContent className="space-y-4">
          <div className="bg-green-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto text-green-600 mb-4">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">¡Ticket Recibido!</h2>
          <p className="text-gray-600">
            Tu solicitud ha sido enviada correctamente a <span className="font-bold">{organization.name}</span>. 
            Te hemos enviado un correo de confirmación.
          </p>
          <Button 
            className="mt-6" 
            variant="secondary"
            onClick={() => window.location.reload()}
          >
            Enviar otra solicitud
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden">
      <CardHeader className="bg-[#2b2d42] text-white p-8">
        <CardTitle className="text-xl font-bold">Nueva Solicitud de Soporte</CardTitle>
        <p className="text-blue-100/70 text-sm mt-1">Completa el formulario y nos pondremos en contacto contigo pronto.</p>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              name="customerName"
              label="Tu Nombre"
              placeholder="Ej: Juan Pérez"
              required
            />
            <Input
              name="customerEmail"
              label="Correo Electrónico"
              type="email"
              placeholder="juan@ejemplo.com"
              required
            />
          </div>

          <Input
            name="title"
            label="Asunto / Título"
            placeholder="Ej: No puedo acceder a mi cuenta"
            required
            minLength={10}
            defaultValue={template?.title}
          />

          <Textarea
            name="description"
            label="Descripción del problema"
            placeholder="Describe detalladamente qué está pasando..."
            required
            minLength={20}
            className="min-h-[120px]"
            defaultValue={template?.description}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              name="priority"
              label="Prioridad"
              options={[
                { label: "Baja", value: "low" },
                { label: "Media", value: "medium" },
                { label: "Alta", value: "high" },
                { label: "Urgente", value: "urgent" },
              ]}
              defaultValue={template?.priority || "medium"}
            />
            <Select
              name="categoryId"
              label="Categoría"
              options={[
                { label: "Seleccionar categoría...", value: "" },
                ...categories.map(c => ({ label: c.name, value: c.id }))
              ]}
              defaultValue={template?.categoryId}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-[#ef233c] hover:bg-red-700 h-12 rounded-xl text-sm font-bold shadow-lg shadow-red-600/20"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {loading ? "Enviando..." : "Enviar Solicitud"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
