"use client";

import { DollarSign, Loader2, Ticket, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";

interface MetricsData {
  status: Record<string, number>;
  priority: Record<string, number>;
  totalTokens: number;
  estimatedCost: number;
  dailyStats: {
    date: string;
    tokens: number;
    cost: number;
    requests: number;
  }[];
  recentLogs: {
    id: string;
    ticketId: string;
    ticketTitle: string;
    model: string;
    latencyMs: number;
    tokensUsed: number;
    createdAt: string;
    estimatedCost: number;
  }[];
  agentStats: {
    name: string;
    assigned: number;
    closed: number;
    satisfaction: string;
  }[];
}

export default function MetricsPage() {
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/metrics")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );

  if (!data) return <div>Error al cargar métricas</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold text-[#2b2d42] tracking-tight">
          Métricas del Sistema
        </h1>
        <p className="text-[#8d99ae] text-sm mt-1">
          Visualiza el rendimiento general y el consumo detallado de
          Inteligencia Artificial.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-gray-100 shadow-sm rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              <Ticket className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#8d99ae] uppercase tracking-wider">
                Tickets Abiertos
              </p>
              <p className="text-3xl font-extrabold text-[#2b2d42] tracking-tight mt-1">
                {data.status.open || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-100 shadow-sm rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-green-50 text-green-600 border border-green-100">
              <Ticket className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#8d99ae] uppercase tracking-wider">
                Tickets Resueltos
              </p>
              <p className="text-3xl font-extrabold text-[#2b2d42] tracking-tight mt-1">
                {data.status.resolved || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-100 shadow-sm rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#8d99ae] uppercase tracking-wider">
                Tokens IA Consumidos
              </p>
              <p className="text-3xl font-extrabold text-[#2b2d42] tracking-tight mt-1">
                {data.totalTokens.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Token Chart & Tickets by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border border-gray-100 shadow-sm rounded-2xl bg-white p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900">
              Historial de Consumo de Tokens
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Tendencia del consumo de tokens de la IA
            </p>
          </div>

          <div className="h-64 w-full">
            {data.dailyStats && data.dailyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.dailyStats}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorTokens"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#8b5cf6"
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="95%"
                        stopColor="#8b5cf6"
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f3f4f6"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 11, fontWeight: 500 }}
                    tickFormatter={(val) => {
                      try {
                        const date = new Date(`${val}T00:00:00`);
                        return date.toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                        });
                      } catch {
                        return val;
                      }
                    }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 11, fontWeight: 500 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E5E7EB",
                      borderRadius: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)",
                    }}
                    labelFormatter={(label) => {
                      try {
                        const date = new Date(`${label}T00:00:00`);
                        return date.toLocaleDateString("es-ES", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        });
                      } catch {
                        return label;
                      }
                    }}
                    formatter={(value: any, name: any) => {
                      if (name === "tokens")
                        return [value.toLocaleString(), "Tokens"];
                      if (name === "cost")
                        return [`$${value.toFixed(4)}`, "Costo"];
                      if (name === "requests") return [value, "Consultas"];
                      return [value, name];
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="tokens"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorTokens)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-gray-50 rounded-xl flex items-center justify-center text-xs text-gray-400">
                No hay suficientes datos de IA acumulados aún.
              </div>
            )}
          </div>
        </Card>

        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900">
              Tickets por Estado
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Distribución del flujo de soporte
            </p>
          </div>
          <div className="space-y-5">
            {["open", "in_progress", "resolved"].map((status) => {
              const count = data.status[status] || 0;
              const total = Object.values(data.status).reduce(
                (a, b) => a + b,
                0,
              );
              const percentage = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={status} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="capitalize font-semibold text-gray-600">
                      {status === "in_progress"
                        ? "En Progreso"
                        : status === "open"
                          ? "Abierto"
                          : "Resuelto"}
                    </span>
                    <span className="font-bold text-gray-900">
                      {count} ({Math.round(percentage)}%)
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        status === "open"
                          ? "bg-blue-500"
                          : status === "in_progress"
                            ? "bg-amber-500"
                            : "bg-green-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Row 3: Agent Performance & Ticket Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border border-gray-100 shadow-sm rounded-2xl bg-white p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900">
              Rendimiento de Agentes
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Métricas operacionales del equipo de soporte
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-xs font-semibold text-[#8d99ae] uppercase">
                  <th className="py-3 px-4">Agente</th>
                  <th className="py-3 px-4 text-center">Asignados</th>
                  <th className="py-3 px-4 text-center">Cerrados</th>
                  <th className="py-3 px-4 text-center">Satisfacción</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.agentStats.map((agent) => (
                  <tr key={agent.name} className="text-xs hover:bg-gray-50/50">
                    <td className="py-4 px-4 font-semibold text-[#2b2d42]">
                      {agent.name}
                    </td>
                    <td className="py-4 px-4 text-center text-gray-600 font-mono">
                      {agent.assigned}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-md font-bold">
                        {agent.closed}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-amber-600">
                      ★ {agent.satisfaction}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900">
              Prioridad de Tickets
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Urgencia relativa de los casos abiertos
            </p>
          </div>
          <div className="space-y-4">
            {["low", "medium", "high", "urgent"].map((priority) => {
              const count = data.priority[priority] || 0;
              const total = Object.values(data.priority).reduce(
                (a, b) => a + b,
                0,
              );
              const percentage = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={priority} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="capitalize font-semibold text-gray-600">
                      {priority === "low"
                        ? "Baja"
                        : priority === "medium"
                          ? "Media"
                          : priority === "high"
                            ? "Alta"
                            : "Urgente"}
                    </span>
                    <span className="font-bold text-gray-900">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        priority === "urgent"
                          ? "bg-red-500"
                          : priority === "high"
                            ? "bg-orange-500"
                            : priority === "medium"
                              ? "bg-blue-500"
                              : "bg-gray-400"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Row 4: AI Audit Log Table */}
      <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white p-6">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900">
            Registro de Auditoría de IA
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Historial en tiempo real de consultas y costos generados por el
            modelo de IA
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-xs font-semibold text-[#8d99ae] uppercase">
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4 text-center">Modelo</th>
                <th className="py-3 px-4 text-center">Latencia</th>
                <th className="py-3 px-4 text-center">Tokens</th>
                <th className="py-3 px-4 text-right">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs">
              {data.recentLogs && data.recentLogs.length > 0 ? (
                data.recentLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-gray-800 max-w-[250px] truncate">
                      <a
                        href={`/tickets/${log.ticketId}`}
                        className="hover:text-blue-600 hover:underline"
                      >
                        {log.ticketTitle}
                      </a>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 rounded-full font-mono text-[10px] border border-purple-100">
                        {log.model}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-gray-600 font-mono">
                      {log.latencyMs} ms
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-gray-800">
                      {log.tokensUsed.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right text-gray-500">
                      {new Date(log.createdAt).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    Sin registros de auditoría de IA aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
