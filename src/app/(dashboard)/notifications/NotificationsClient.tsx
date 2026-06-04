"use client";

import { Bell, Check, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase-client";

interface Notification {
  id: string;
  message: string;
  read: boolean;
  created_at: string;
  ticket_id: string | null;
}

export function NotificationsClient({
  initialNotifications,
  userId,
}: {
  initialNotifications: Notification[];
  userId: string;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const supabase = createClient();
  const router = useRouter();

  async function markAsRead(id: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      router.refresh();
    }
  }

  async function markAllAsRead() {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      router.refresh();
    }
  }

  async function deleteNotification(id: string) {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (!error) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2b2d42]">Notificaciones</h1>
          <p className="text-[#8d99ae]">Historial completo de tus alertas.</p>
        </div>
        {notifications.some((n) => !n.read) && (
          <Button
            variant="secondary"
            size="sm"
            onClick={markAllAsRead}
            className="text-xs"
          >
            <Check className="h-4 w-4 mr-2" /> Marcar todas como leídas
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-center justify-between p-6 hover:bg-gray-50 transition-colors ${!n.read ? "bg-blue-50/20" : ""}`}
              >
                <Link
                  href={n.ticket_id ? `/tickets/${n.ticket_id}` : "#"}
                  className="flex gap-4 flex-1"
                  onClick={() => !n.read && markAsRead(n.id)}
                >
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${!n.read ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-[#8d99ae]"}`}
                  >
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p
                      className={`text-sm ${!n.read ? "font-semibold text-[#2b2d42]" : "text-[#8d99ae]"}`}
                    >
                      {n.message}
                    </p>
                    <p className="text-xs text-[#8d99ae]">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  {!n.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(n.id)}
                      title="Marcar como leída"
                    >
                      <Check className="h-4 w-4 text-blue-600" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNotification(n.id)}
                    className="hover:text-red-600"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="text-center py-20 text-[#8d99ae]">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No tienes notificaciones aún.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
