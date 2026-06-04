"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Ticket,
  TrendingUp,
  Zap,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Button, cn } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardClientProps {
  user: any;
  role: string;
  tickets: any[];
  categories: any[];
}

export function DashboardClient({
  user,
  role,
  tickets = [],
  categories = [],
}: DashboardClientProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const isSuperAdmin = role === "superadmin" || user?.user_metadata?.is_superadmin === true;

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const diff = currentDay === 0 ? -6 : 1 - currentDay; // Adjust to Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    return monday;
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate stats
  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved").length;

  // Calculate real trends
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfWeek.getDate() - 7);
  const endOfLastWeek = new Date(startOfWeek);
  endOfLastWeek.setMilliseconds(-1);

  const ticketsThisMonth = tickets.filter(t => new Date(t.created_at) >= startOfMonth).length;
  const ticketsLastMonth = tickets.filter(t => {
    const d = new Date(t.created_at);
    return d >= startOfLastMonth && d <= endOfLastMonth;
  }).length;

  const monthTrend = ticketsLastMonth === 0 
    ? (ticketsThisMonth > 0 ? "+100%" : "0%") 
    : `${(((ticketsThisMonth - ticketsLastMonth) / ticketsLastMonth) * 100).toFixed(1)}%`;

  const ticketsThisWeek = tickets.filter(t => new Date(t.created_at) >= startOfWeek).length;
  const ticketsLastWeek = tickets.filter(t => {
    const d = new Date(t.created_at);
    return d >= startOfLastWeek && d <= endOfLastWeek;
  }).length;

  const weekTrend = ticketsLastWeek === 0 
    ? (ticketsThisWeek > 0 ? "+100%" : "0%") 
    : `${(((ticketsThisWeek - ticketsLastWeek) / ticketsLastWeek) * 100).toFixed(1)}%`;

  const historicalAverage = tickets.length / (Math.max(1, (now.getTime() - new Date(tickets[tickets.length - 1]?.created_at || now).getTime()) / (1000 * 60 * 60 * 24 * 30)));
  const currentMonthVolume = ticketsThisMonth;
  const historicalTrend = historicalAverage === 0 
    ? "0%" 
    : `${(((currentMonthVolume - historicalAverage) / historicalAverage) * 100).toFixed(1)}%`;

  const urgentTickets = tickets.filter(
    (t) => t.priority === "urgent" || t.priority === "high"
  );
  
  // Stats array for rendering
  const stats = [
    {
      label: "Tickets Abiertos",
      value: openCount,
      icon: Ticket,
      trend: `${monthTrend} este mes`,
      bg: "bg-white",
      textColor: "text-gray-900",
      labelColor: "text-gray-500",
      iconContainer: "border border-blue-200 text-[#ef233c] bg-blue-50/50",
    },
    {
      label: "En Progreso",
      value: inProgressCount,
      icon: Clock,
      trend: `${weekTrend} esta semana`,
      bg: "bg-white",
      textColor: "text-gray-900",
      labelColor: "text-gray-500",
      iconContainer: "border border-amber-200 text-amber-600 bg-amber-50/50",
    },
    {
      label: "Tickets Resueltos",
      value: resolvedCount,
      icon: CheckCircle,
      trend: `${historicalTrend} vs histórico`,
      bg: "bg-[#ef233c]",
      textColor: "text-white",
      labelColor: "text-blue-100",
      iconContainer: "border border-white/20 text-white bg-white/10",
    },
  ];

  // Calendar: Generate days for current selected week
  const getDaysOfWeek = (monday: Date) => {
    const days = [];
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      days.push({
        name: dayNames[i],
        dateNum: date.getDate(),
        fullDate: date,
        isToday: date.toDateString() === new Date().toDateString(),
        isSelected: date.toDateString() === selectedDate.toDateString(),
      });
    }
    return days;
  };

  const days = getDaysOfWeek(currentWeekStart);

  const handlePrevWeek = () => {
    const newMonday = new Date(currentWeekStart);
    newMonday.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newMonday);
  };

  const handleNextWeek = () => {
    const newMonday = new Date(currentWeekStart);
    newMonday.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newMonday);
  };

  // Filter tickets for the selected calendar date
  const ticketsOnSelectedDate = tickets.filter((t) => {
    const ticketDate = new Date(t.created_at);
    return ticketDate.toDateString() === selectedDate.toDateString();
  });

  // Recharts: Area Chart Data (Support Trend)
  const monthsList = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonthIdx = new Date().getMonth();
  const areaChartData = [];
  
  for (let i = 8; i >= 0; i--) {
    const d = new Date();
    d.setMonth(currentMonthIdx - i);
    const monthName = monthsList[d.getMonth()];
    
    const realCount = tickets.filter((t) => {
      const tDate = new Date(t.created_at);
      return tDate.getMonth() === d.getMonth() && tDate.getFullYear() === d.getFullYear();
    }).length;

    areaChartData.push({
      name: monthName,
      Tickets: realCount,
    });
  }

  // Recharts: Donut Chart Data (Tickets by Priority)
  const priorityCounts = {
    urgent: tickets.filter((t) => t.priority === "urgent").length,
    high: tickets.filter((t) => t.priority === "high").length,
    medium: tickets.filter((t) => t.priority === "medium").length,
    low: tickets.filter((t) => t.priority === "low").length,
  };

  const priorityColors: { [key: string]: string } = {
    Urgente: "#EF4444",
    Alta: "#F97316",
    Media: "#ef233c",
    Baja: "#9CA3AF",
  };

  const donutData = [
    { name: "Urgente", value: priorityCounts.urgent },
    { name: "Alta", value: priorityCounts.high },
    { name: "Media", value: priorityCounts.medium },
    { name: "Baja", value: priorityCounts.low },
  ];

  // Recharts: Traffic Source
  const categoryCounts = categories.map((cat) => {
    const count = tickets.filter((t) => t.category_id === cat.id).length;
    return {
      name: cat.name,
      count: count,
    };
  });

  const sortedCategories = categoryCounts.sort((a, b) => b.count - a.count).slice(0, 3);
  const totalCategoriesCount = sortedCategories.reduce((sum, c) => sum + c.count, 0);
  const progressBars = sortedCategories.map((c) => {
    const percentage = totalCategoriesCount > 0 ? Math.round((c.count / totalCategoriesCount) * 100) : 0;
    return {
      name: c.name,
      percentage: percentage,
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Bienvenido, <span className="font-semibold text-gray-700">{user?.user_metadata?.full_name || user?.email}</span> ({role.toUpperCase()})
          </p>
        </div>
        
        {role === "user" && (
          <Link href="/tickets/new">
            <Button className="flex items-center gap-2 bg-[#ef233c] hover:bg-blue-700 h-11 px-6 rounded-full text-sm font-bold shadow-lg shadow-red-600/25 transition-all duration-200 hover:scale-[1.02]">
              <Plus className="h-4 w-4" /> Crear Ticket
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className={cn(
                "border border-gray-100 shadow-sm rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md",
                stat.bg
              )}
            >
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-2">
                  <p className={cn("text-xs font-bold uppercase tracking-wider", stat.labelColor)}>
                    {stat.label}
                  </p>
                  <p className={cn("text-4xl font-extrabold tracking-tight", stat.textColor)}>
                    {stat.value}
                  </p>
                  <p className={cn("text-[10px] font-semibold flex items-center gap-1", stat.labelColor)}>
                    <TrendingUp className="h-3 w-3" />
                    <span>{stat.trend}</span>
                  </p>
                </div>
                <div className={cn("p-4 rounded-2xl transition-transform duration-200 hover:scale-105", stat.iconContainer)}>
                  <Icon className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Tendencia de Soporte</h3>
                <p className="text-xs text-gray-400 mt-0.5">Volumen mensual de incidencias registradas</p>
              </div>
              
              <div className={cn(
                "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1",
                monthTrend.startsWith("+") ? "bg-green-50 border border-green-100 text-green-600" : "bg-red-50 border border-red-100 text-red-600"
              )}>
                <span>{monthTrend}</span>
              </div>
            </div>

            <div className="h-64 w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef233c" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#ef233c" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 11, fontWeight: 500 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 11, fontWeight: 500 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)" }} labelStyle={{ fontWeight: "bold", color: "#111827" }} />
                    <Area type="monotone" dataKey="Tickets" stroke="#ef233c" strokeWidth={3} fillOpacity={1} fill="url(#colorTickets)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full bg-gray-50 animate-pulse rounded-xl flex items-center justify-center text-xs text-gray-400">
                  Cargando gráfico...
                </div>
              )}
            </div>
          </Card>

          <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Calendario de Soporte</h3>
                <p className="text-xs text-gray-400 mt-0.5">Tickets por fecha de creación</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-800">{currentWeekStart.toLocaleString("default", { month: "long", year: "numeric" })}</span>
                <div className="flex items-center gap-1 border border-gray-100 rounded-full p-1 bg-gray-50/50">
                  <button onClick={handlePrevWeek} className="p-1 hover:bg-white rounded-full transition-all text-gray-600" type="button"><ChevronLeft className="h-4 w-4" /></button>
                  <button onClick={handleNextWeek} className="p-1 hover:bg-white rounded-full transition-all text-gray-600" type="button"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center mb-6">
              {days.map((day) => (
                <button key={day.fullDate.toDateString()} onClick={() => setSelectedDate(day.fullDate)} className="flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 border-0 outline-none" type="button">
                  <span className="text-xs text-gray-400 font-bold mb-1.5">{day.name}</span>
                  <div className={cn("h-10 w-10 flex items-center justify-center rounded-full text-sm font-extrabold transition-all", day.isSelected ? "bg-[#ef233c] text-white shadow-lg shadow-red-600/35" : day.isToday ? "bg-red-50 text-[#ef233c] border border-[#ef233c]/20" : "text-gray-800 hover:bg-gray-100")}>{day.dateNum}</div>
                </button>
              ))}
            </div>

            <div className="border-t border-gray-50 pt-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-gray-900">Tickets creados el {selectedDate.toLocaleDateString()}</h4>
                <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-[11px] font-bold">{ticketsOnSelectedDate.length}</span>
              </div>

              {ticketsOnSelectedDate.length > 0 ? (
                <div className="space-y-3">
                  {ticketsOnSelectedDate.map((t) => (
                    <Link key={t.id} href={`/tickets/${t.id}`} className="flex items-center justify-between p-3.5 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-xl transition-all duration-200 group">
                      <div className="flex items-center gap-3">
                        <div className={cn("h-2.5 w-2.5 rounded-full", t.priority === "urgent" ? "bg-red-500 animate-pulse" : t.priority === "high" ? "bg-orange-500" : t.priority === "medium" ? "bg-blue-500" : "bg-gray-400")} />
                        <div>
                          <p className="text-sm font-semibold text-gray-800 line-clamp-1 group-hover:text-[#ef233c] transition-colors">{t.title}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">#{t.id.split("-")[0]}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", t.status === "open" ? "bg-blue-100 text-blue-800" : t.status === "in_progress" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800")}>{t.status}</span>
                        <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-gray-600 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">No se registraron tickets para esta fecha.</div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          {role !== "user" && urgentTickets.length > 0 && (
            <Card className="border border-red-200 bg-red-50/30 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h4 className="text-red-900 font-bold text-sm">Alta Prioridad & Urgentes</h4>
              </div>
              <div className="space-y-2">
                {urgentTickets.slice(0, 3).map((t) => (
                  <Link key={t.id} href={`/tickets/${t.id}`} className="flex items-center justify-between p-3 bg-white hover:bg-red-50/50 border border-red-100 rounded-xl transition-all shadow-sm">
                    <span className="font-semibold text-xs text-gray-900 line-clamp-1 max-w-[150px]">{t.title}</span>
                    <span className="text-[10px] font-bold uppercase text-red-600 px-2 py-0.5 bg-red-100/50 rounded-full">{t.priority}</span>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white p-6 flex flex-col">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Tickets por Prioridad</h3>
              <p className="text-xs text-gray-400 mt-0.5">Distribución según nivel de urgencia</p>
            </div>
            <div className="h-52 w-full flex items-center justify-center mt-4 relative">
              {mounted ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="value">
                        {donutData.map((entry, index) => <Cell key={`cell-${index}`} fill={priorityColors[entry.name]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-gray-900">{totalCount}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Tickets</span>
                  </div>
                </>
              ) : <div className="h-full w-full bg-gray-50 animate-pulse rounded-full flex items-center justify-center text-xs text-gray-400">Cargando...</div>}
            </div>
            <div className="mt-4 space-y-2">
              {donutData.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: priorityColors[entry.name] }} />
                    <span className="font-semibold text-gray-600">{entry.name}</span>
                  </div>
                  <span className="font-bold text-gray-900">{entry.value} ({totalCount > 0 ? Math.round((entry.value / totalCount) * 100) : 0}%)</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white p-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Categorías Populares</h3>
              <p className="text-xs text-gray-400 mt-0.5">Clasificación más frecuente de incidencias</p>
            </div>
            <div className="mt-6 space-y-4">
              {progressBars.map((item, index) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-600 max-w-[170px] truncate">{item.name}</span>
                    <span className="font-bold text-gray-900">{item.percentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-500", index === 0 ? "bg-[#ef233c]" : index === 1 ? "bg-gray-800" : "bg-gray-400")} style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white p-6">
            <h3 className="text-sm font-extrabold text-gray-900 mb-4 tracking-wider uppercase">Accesos Rápidos</h3>
            <div className="grid grid-cols-2 gap-3">
              {!isSuperAdmin && (
                <Link href="/tickets" className="p-3 bg-gray-50 hover:bg-blue-50 border border-gray-100 rounded-xl transition-all text-center space-y-1 group">
                  <Ticket className="h-5 w-5 mx-auto text-[#ef233c]" />
                  <span className="text-[10px] font-extrabold text-gray-600 group-hover:text-[#ef233c]">LISTADO TICKETS</span>
                </Link>
              )}
              {(role === "admin" || isSuperAdmin) && (
                <Link href="/admin/users" className="p-3 bg-gray-50 hover:bg-blue-50 border border-gray-100 rounded-xl transition-all text-center space-y-1 group">
                  <Zap className="h-5 w-5 mx-auto text-amber-500" />
                  <span className="text-[10px] font-extrabold text-gray-600 group-hover:text-amber-600">USUARIOS</span>
                </Link>
              )}
              {role !== "user" && (
                <Link href="/metrics" className="p-3 bg-gray-50 hover:bg-blue-50 border border-gray-100 rounded-xl transition-all text-center space-y-1 group">
                  <TrendingUp className="h-5 w-5 mx-auto text-emerald-500" />
                  <span className="text-[10px] font-extrabold text-gray-600 group-hover:text-emerald-600">MÉTRICAS</span>
                </Link>
              )}
              <Link href="/notifications" className="p-3 bg-gray-50 hover:bg-blue-50 border border-gray-100 rounded-xl transition-all text-center space-y-1 group">
                <Plus className="h-5 w-5 mx-auto text-purple-500" />
                <span className="text-[10px] font-extrabold text-gray-600 group-hover:text-purple-600">ALERTAS</span>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
