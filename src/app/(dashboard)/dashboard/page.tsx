import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Ticket,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase-server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role || "user";

  // Fetch data based on role
  let ticketsQuery = supabase.from("tickets").select("*");

  if (role === "user") {
    ticketsQuery = ticketsQuery.eq("created_by", user?.id);
  }

  const { data: tickets } = await ticketsQuery.order("created_at", {
    ascending: false,
  });

  const stats = [
    {
      label: "Abiertos",
      value: (tickets || []).filter((t) => t.status === "open").length,
      icon: Ticket,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "En Progreso",
      value: (tickets || []).filter((t) => t.status === "in_progress").length,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Resueltos",
      value: (tickets || []).filter((t) => t.status === "resolved").length,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  const urgentTickets = (tickets || []).filter(
    (t) => t.priority === "urgent" || t.priority === "high",
  );
  const recentTickets = (tickets || []).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">
            Bienvenido, {user?.user_metadata?.full_name || user?.email} (
            {role.toUpperCase()})
          </p>
        </div>
        {role === "user" && (
          <Link href="/tickets/new">
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 h-12 px-6 text-lg font-semibold shadow-lg transition-all hover:scale-105">
              <Plus className="h-5 w-5" /> Crear Ticket
            </Button>
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="border-none shadow-sm overflow-hidden"
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`p-4 rounded-xl ${stat.bg} ${stat.color}`}>
                  <Icon className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Role Specific Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {role !== "user" && urgentTickets.length > 0 && (
            <Card className="border-red-100 bg-red-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-red-800 flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5" /> Alta Prioridad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {urgentTickets.slice(0, 3).map((t) => (
                    <Link
                      key={t.id}
                      href={`/tickets/${t.id}`}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-100 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-2 w-2 rounded-full ${t.priority === "urgent" ? "bg-red-600 animate-pulse" : "bg-orange-500"}`}
                        />
                        <span className="font-medium text-sm text-gray-900">
                          {t.title}
                        </span>
                      </div>
                      <span className="text-xs font-bold uppercase text-red-600">
                        {t.priority}
                      </span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-50 pb-4">
              <CardTitle className="text-lg font-bold">
                {role === "user"
                  ? "Mis Tickets Recientes"
                  : "Tickets Recientes"}
              </CardTitle>
              <Link
                href="/tickets"
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                Ver todos
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {recentTickets.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {recentTickets.map((t) => (
                    <Link
                      key={t.id}
                      href={`/tickets/${t.id}`}
                      className="block py-4 hover:bg-gray-50 transition-colors px-6"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900 line-clamp-1">
                            {t.title}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-2">
                            <span>#{t.id.split("-")[0]}</span>
                            <span>•</span>
                            <span>
                              {new Date(t.created_at).toLocaleDateString()}
                            </span>
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            t.status === "open"
                              ? "bg-blue-100 text-blue-700"
                              : t.status === "in_progress"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 text-gray-400">
                  <Ticket className="h-16 w-16 mx-auto mb-4 opacity-10" />
                  <p className="text-lg">No hay tickets para mostrar</p>
                  {role === "user" && (
                    <Link
                      href="/tickets/new"
                      className="mt-4 inline-block text-blue-600 hover:underline"
                    >
                      Crea tu primer ticket ahora
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6">
          {role === "admin" && (
            <Card className="border-none shadow-sm bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" /> Tendencia Semanal
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-8">
                <div className="h-32 flex items-end gap-2 px-2">
                  {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-white/20 rounded-t-sm transition-all hover:bg-white/40"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-[10px] font-medium text-blue-100 px-1">
                  <span>LUN</span>
                  <span>MAR</span>
                  <span>MIE</span>
                  <span>JUE</span>
                  <span>VIE</span>
                  <span>SAB</span>
                  <span>DOM</span>
                </div>
              </CardContent>
            </Card>
          )}

          {role === "agent" && (
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold">
                  Métricas Personales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Cerrados hoy</span>
                    <span className="font-bold text-gray-900">4</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[60%]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tiempo de respuesta</span>
                    <span className="font-bold text-gray-900">1.2h</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[80%]" />
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-50 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Racha de resolución</p>
                    <p className="text-sm font-bold text-gray-900">
                      5 días seguidos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Atajos</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Link
                href="/tickets"
                className="p-3 border rounded-xl hover:bg-gray-50 transition-colors text-center space-y-1"
              >
                <Ticket className="h-5 w-5 mx-auto text-blue-600" />
                <span className="text-[10px] font-bold text-gray-600">
                  LISTADO
                </span>
              </Link>
              {role === "admin" && (
                <Link
                  href="/admin/users"
                  className="p-3 border rounded-xl hover:bg-gray-50 transition-colors text-center space-y-1"
                >
                  <Zap className="h-5 w-5 mx-auto text-amber-600" />
                  <span className="text-[10px] font-bold text-gray-600">
                    USUARIOS
                  </span>
                </Link>
              )}
              {role !== "user" && (
                <Link
                  href="/metrics"
                  className="p-3 border rounded-xl hover:bg-gray-50 transition-colors text-center space-y-1"
                >
                  <TrendingUp className="h-5 w-5 mx-auto text-emerald-600" />
                  <span className="text-[10px] font-bold text-gray-600">
                    MÉTRICAS
                  </span>
                </Link>
              )}
              <Link
                href="/notifications"
                className="p-3 border rounded-xl hover:bg-gray-50 transition-colors text-center space-y-1"
              >
                <Plus className="h-5 w-5 mx-auto text-purple-600" />
                <span className="text-[10px] font-bold text-gray-600">
                  ALERTAS
                </span>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
