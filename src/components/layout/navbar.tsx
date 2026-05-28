"use client";

import { Bell, LogOut, Menu, User, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase-client";

import { useOutsideClick } from "@/hooks/use-outside-click";
import { NotificationBell } from "./notification-bell";

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const menuRef = useOutsideClick(() => {
    setShowUserMenu(false);
  });

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="h-16 border-b bg-white flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-40 w-full">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm">
            <Ticket className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">
            TickAble
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />

        <div className="relative" ref={menuRef}>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <User className="h-5 w-5 text-[#8d99ae]" />
          </Button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg py-1 z-50">
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                <User className="h-4 w-4" /> Perfil
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
