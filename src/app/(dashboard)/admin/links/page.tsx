"use client";

import { Copy, Link as LinkIcon, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function LinkGeneratorPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [orgSlug, setOrgSlug] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "",
  });
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fetch categories and org info
    async function fetchData() {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        setCategories(data || []);

        const profileRes = await fetch("/api/auth/me");
        if (profileRes.ok) {
          const authData = await profileRes.json();
          if (authData.organization?.slug) {
            setOrgSlug(authData.organization.slug);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    }
    fetchData();
  }, []);

  const generateLink = () => {
    // In a real app, we'd get the actual base URL
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const slug = orgSlug || "mi-empresa"; // Fallback or fetched
    
    const params = new URLSearchParams();
    if (formData.title) params.set("title", formData.title);
    if (formData.description) params.set("description", formData.description);
    if (formData.priority) params.set("priority", formData.priority);
    if (formData.category) params.set("category", formData.category);

    const url = `${baseUrl}/portal/${slug}?${params.toString()}`;
    setGeneratedUrl(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Generador de Links de Registro</h1>
        <p className="text-gray-500 text-sm mt-1">Crea enlaces pre-configurados para que cualquier persona registre tickets sin cuenta.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-gray-100 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Configuración del Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Slug de la Organización (ej: mi-empresa)"
              placeholder="mi-empresa"
              value={orgSlug}
              onChange={(e) => setOrgSlug(e.target.value)}
            />
            
            <div className="border-t pt-4 space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Campos Pre-llenados (Opcional)</p>
              <Input
                label="Título del Ticket"
                placeholder="Ej: Reporte de Falla de Red"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
              <Textarea
                label="Descripción Inicial"
                placeholder="Describe el problema predeterminado..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Prioridad"
                  options={[
                    { label: "Baja", value: "low" },
                    { label: "Media", value: "medium" },
                    { label: "Alta", value: "high" },
                    { label: "Urgente", value: "urgent" },
                  ]}
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                />
                <Select
                  label="Categoría"
                  options={[
                    { label: "Ninguna", value: "" },
                    ...categories.map(c => ({ label: c.name, value: c.id }))
                  ]}
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                />
              </div>
            </div>

            <Button 
              className="w-full bg-[#ef233c] hover:bg-red-700 h-11 rounded-xl font-bold"
              onClick={generateLink}
            >
              <Sparkles className="h-4 w-4 mr-2" /> Generar Enlace
            </Button>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm rounded-2xl bg-gray-50/50">
          <CardHeader>
            <CardTitle className="text-lg">Enlace Generado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {generatedUrl ? (
              <div className="space-y-4">
                <div className="p-4 bg-white border border-gray-200 rounded-xl break-all font-mono text-sm text-blue-600">
                  {generatedUrl}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full h-11 rounded-xl font-bold border-gray-200 hover:bg-white transition-all"
                  onClick={copyToClipboard}
                >
                  {copied ? "¡Copiado!" : <><Copy className="h-4 w-4 mr-2" /> Copiar Enlace</>}
                </Button>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-xs text-blue-700 leading-relaxed">
                    <strong>Tip:</strong> Puedes enviar este link por email, WhatsApp o código QR. El usuario que lo abra verá el formulario con los campos que configuraste ya listos para enviar.
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-gray-400 space-y-2">
                <LinkIcon className="h-12 w-12 opacity-20" />
                <p className="text-sm">Configura los campos y genera un link</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
