"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
}

export function TicketFilters({ 
  categories, 
  viewMode = "list" 
}: { 
  categories: Category[],
  viewMode?: "board" | "list"
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = searchParams.get("status") || "";
  const priority = searchParams.get("priority") || "";
  const category = searchParams.get("category") || "";
  const q = searchParams.get("q") || "";

  function updateFilters(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.push(`/tickets?${params.toString()}`);
  }

  return (
    <div className="bg-white p-4 rounded-xl border shadow-sm sticky top-20 z-20 transition-all">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8d99ae]" />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              updateFilters({ q: formData.get("q") as string });
            }}
          >
            <input
              name="q"
              type="text"
              placeholder="Buscar por título..."
              defaultValue={q}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow text-sm text-[#2b2d42] placeholder:text-[#8d99ae] bg-white"
            />
          </form>
        </div>
        
        {viewMode === "list" && (
          <div className="flex flex-wrap gap-2">
            <select
              className="text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white text-[#2b2d42]"
              value={status}
              onChange={(e) => updateFilters({ status: e.target.value })}
            >
              <option value="">Estado: Todos</option>
              <option value="open">Abierto</option>
              <option value="in_progress">En Progreso</option>
              <option value="resolved">Resuelto</option>
            </select>

            <select
              className="text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white text-[#2b2d42]"
              value={priority}
              onChange={(e) => updateFilters({ priority: e.target.value })}
            >
              <option value="">Prioridad: Todas</option>
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>

            <select
              className="text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white text-[#2b2d42]"
              value={category}
              onChange={(e) => updateFilters({ category: e.target.value })}
            >
              <option value="">Categoría: Todas</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {(status || priority || category || q) && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => router.push("/tickets")}
              >
                <X className="h-4 w-4 mr-1" /> Limpiar filtros
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
