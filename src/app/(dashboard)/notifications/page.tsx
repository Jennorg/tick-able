import { Bell } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase-server";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
        <p className="text-gray-500">Historial completo de tus alertas.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {notifications?.map((n) => (
              <Link
                key={n.id}
                href={n.ticket_id ? `/tickets/${n.ticket_id}` : "#"}
                className={`block p-6 hover:bg-gray-50 transition-colors ${!n.read ? "bg-blue-50/20" : ""}`}
              >
                <div className="flex gap-4">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${!n.read ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}
                  >
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p
                      className={`text-sm ${!n.read ? "font-semibold text-gray-900" : "text-gray-600"}`}
                    >
                      {n.message}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
            {(!notifications || notifications.length === 0) && (
              <div className="text-center py-20 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-10" />
                <p>No tienes notificaciones aún.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
