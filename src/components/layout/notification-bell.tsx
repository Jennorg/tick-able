"use client";

import { Bell, Check } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase-client";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", table: "notifications" },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
          setUnreadCount((prev) => prev + 1);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchNotifications() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    }
  }

  async function markAsRead(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    fetchNotifications();
  }

  async function markAllAsRead() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id);
    fetchNotifications();
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-white text-[10px] text-white flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">
              Notificaciones
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"
              >
                <Check className="h-3 w-3" /> Marcar todas como leídas
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((n) => (
              <Link
                key={n.id}
                href={
                  n.ticket_id ? `/tickets/${n.ticket_id}` : "/notifications"
                }
                onClick={() => {
                  markAsRead(n.id);
                  setIsOpen(false);
                }}
                className={`block p-4 border-b hover:bg-gray-50 transition-colors ${!n.read ? "bg-blue-50/30" : ""}`}
              >
                <div className="flex gap-3">
                  {!n.read && (
                    <div className="h-2 w-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm text-gray-800 leading-snug">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
            {notifications.length === 0 && (
              <div className="p-8 text-center text-gray-400 text-sm">
                No tienes notificaciones nuevas.
              </div>
            )}
          </div>
          <Link
            href="/notifications"
            className="block p-3 text-center text-xs font-medium text-blue-600 hover:bg-gray-50 border-t"
            onClick={() => setIsOpen(false)}
          >
            Ver todas las notificaciones
          </Link>
        </div>
      )}
    </div>
  );
}
