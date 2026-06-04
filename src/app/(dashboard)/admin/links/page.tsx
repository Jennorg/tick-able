"use client";

import { Copy, Link as LinkIcon, Sparkles, Loader2, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function LinkGeneratorPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [orgSlug, setOrgSlug] = useState("");
  const [orgName, setOrgName] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "",
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fetch categories and org info
    async function fetchData() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const text = await res.text();
          const data = text ? JSON.parse(text) : [];
          setCategories(data || []);
        }

        const profileRes = await fetch("/api/auth/me");
        if (profileRes.ok) {
          const text = await profileRes.text();
          const authData = text ? JSON.parse(text) : {};
          if (authData.organization?.slug) {
            setOrgSlug(authData.organization.slug);
            setOrgName(authData.organization.name || "");
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    }
    fetchData();
  }, []);

  // Compute the URL dynamically based on form data and fetched organization slug
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const params = new URLSearchParams();
  if (formData.title) params.set("title", formData.title);
  if (formData.description) params.set("description", formData.description);
  if (formData.priority) params.set("priority", formData.priority);
  if (formData.category) params.set("category", formData.category);

  const generatedUrl = orgSlug ? `${baseUrl}/portal/${orgSlug}?${params.toString()}` : "";

  const copyToClipboard = () => {
    if (!generatedUrl) return;
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
            <CardTitle className="text-lg text-[#2b2d42]">Configuración del Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Read-Only Organization Info */}
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Organización Activa</p>
                <p className="text-sm font-extrabold text-[#2b2d42]">{orgName || "Cargando..."}</p>
              </div>
              <span className="px-3 py-1 bg-red-50 text-[#ef233c] text-xs font-mono font-bold rounded-lg border border-red-100/50">
                {orgSlug || "cargando..."}
              </span>
            </div>
            
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
          </CardContent>
        </Card>
 
        <Card className="border-gray-100 shadow-sm rounded-2xl bg-gray-50/50 flex flex-col justify-between">
          <div>
            <CardHeader>
              <CardTitle className="text-lg text-[#2b2d42]">Enlace Generado en Tiempo Real</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {orgSlug ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Este enlace se actualiza automáticamente con tus cambios arriba. Cópialo para compartirlo:</p>
                  <div className="p-4 bg-white border border-gray-200 rounded-xl break-all font-mono text-sm text-blue-600 shadow-sm select-all">
                    {generatedUrl}
                  </div>
                  <Button 
                    className="w-full bg-[#ef233c] hover:bg-red-700 h-11 text-sm font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-white"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 animate-in zoom-in duration-200" />
                        ¡Enlace Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copiar Enlace
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-gray-400 space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin text-[#ef233c]" />
                  <p className="text-sm">Cargando datos de organización...</p>
                </div>
              )}
            </CardContent>
          </div>
          <div className="p-6 border-t bg-white rounded-b-2xl">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-xs text-blue-700 leading-relaxed">
                <strong>Tip:</strong> Puedes enviar este link por email, WhatsApp o código QR. El usuario que lo abra verá el formulario con los campos que configuraste ya listos para enviar.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
