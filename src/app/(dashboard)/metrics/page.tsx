"use client";

import { DollarSign, Loader2, Ticket, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricsData {
  status: Record<string, number>;
  priority: Record<string, number>;
  totalTokens: number;
  estimatedCost: number;
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Métricas del Sistema
        </h1>
        <p className="text-gray-500">
          Visualiza el rendimiento y el uso de IA.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
              <Ticket className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Abiertos</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.status.open || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
              <Ticket className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Resueltos</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.status.resolved || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Tokens IA</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.totalTokens.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Costo Est. ($)
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {data.estimatedCost.toFixed(4)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tickets por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {["open", "in_progress", "resolved"].map((status) => {
                const count = data.status[status] || 0;
                const total = Object.values(data.status).reduce(
                  (a, b) => a + b,
                  0,
                );
                return (
                  <div
                    key={status}
                    className="flex justify-between items-center"
                  >
                    <span className="capitalize text-gray-600">
                      {status.replace("_", " ")}
                    </span>
                    <div className="flex items-center gap-4 flex-1 mx-4">
                      <div className="h-2 bg-gray-100 rounded-full flex-1 overflow-hidden">
                        <div
                          className="h-full bg-blue-600"
                          style={{
                            width: `${total > 0 ? (count / total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="font-bold w-8 text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prioridad de Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {["low", "medium", "high", "urgent"].map((priority) => {
                const count = data.priority[priority] || 0;
                const total = Object.values(data.priority).reduce(
                  (a, b) => a + b,
                  0,
                );
                return (
                  <div
                    key={priority}
                    className="flex justify-between items-center"
                  >
                    <span className="capitalize text-gray-600">{priority}</span>
                    <div className="flex items-center gap-4 flex-1 mx-4">
                      <div className="h-2 bg-gray-100 rounded-full flex-1 overflow-hidden">
                        <div
                          className={`h-full ${
                            priority === "urgent"
                              ? "bg-red-600"
                              : priority === "high"
                                ? "bg-orange-500"
                                : priority === "medium"
                                  ? "bg-blue-500"
                                  : "bg-gray-400"
                          }`}
                          style={{
                            width: `${total > 0 ? (count / total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="font-bold w-8 text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rendimiento de Agentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-sm font-semibold text-gray-500 uppercase">
                  <th className="py-3 px-4">Agente</th>
                  <th className="py-3 px-4 text-center">Asignados</th>
                  <th className="py-3 px-4 text-center">Cerrados</th>
                  <th className="py-3 px-4 text-center">Satisfacción</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.agentStats.map((agent) => (
                  <tr key={agent.name} className="text-sm">
                    <td className="py-4 px-4 font-medium text-gray-900">
                      {agent.name}
                    </td>
                    <td className="py-4 px-4 text-center">{agent.assigned}</td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-2 py-1 bg-green-50 text-green-700 rounded-md font-bold">
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
        </CardContent>
      </Card>
    </div>
  );
}
