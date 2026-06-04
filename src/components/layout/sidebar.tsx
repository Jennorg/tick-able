"use client";

import {
  LayoutDashboard,
  Link as LinkIcon,
  PieChart,
  Settings,
  Ticket,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/components/ui/button";
import { createClient } from "@/lib/supabase-client";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", staffOnly: true },
  { icon: Ticket, label: "Tickets", href: "/tickets" },
  { icon: PieChart, label: "Métricas", href: "/metrics", staffOnly: true },
  { icon: Users, label: "Usuarios", href: "/admin/users", adminOnly: true },
  {
    icon: Settings,
    label: "Categorías",
    href: "/admin/categories",
    adminOnly: true,
  },
  {
    icon: LinkIcon,
    label: "Generador de Links",
    href: "/admin/links",
    adminOnly: true,
  },
];

export function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const [role, setRole] = useState<string>("user");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    async function getRole() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const userRole = user.user_metadata?.role || "user";
        setRole(userRole);
        setIsSuperAdmin(user.user_metadata?.is_superadmin === true || userRole === "superadmin");
      }
    }
    getRole();
  }, []);

  return (
    <>
      {/* ==================== MOBILE DRAWER OVERLAY ==================== */}
      {isOpen && (
        <button
          className="fixed inset-0 bg-black/50 z-40 lg:hidden w-full h-full cursor-default border-0 p-0 outline-none"
          onClick={onClose}
          type="button"
          aria-label="Cerrar overlay"
        />
      )}

      {/* Mobile Drawer aside panel */}
      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 w-64 bg-white border-r z-50 transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-4 flex items-center justify-between border-b">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1 rounded-md">
              <Ticket className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">TickAble</span>
          </div>
          <button onClick={onClose} type="button" aria-label="Cerrar menú">
            <X className="h-6 w-6 text-[#8d99ae]" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            if (isSuperAdmin) {
              // Superadmin sees everything
            } else {
              if (item.adminOnly && role !== "admin") return null;
              if (item.staffOnly && role === "user") return null;
            }

            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-[#8d99ae] hover:text-[#2b2d42] hover:bg-gray-100",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ==================== DESKTOP HOVER SIDEBAR (Overlay) ==================== */}
      <aside className="hidden lg:block w-16 h-[calc(100vh-64px)] fixed top-16 left-0 group select-none z-30">
        {/* Absolute expanding container panel */}
        <div className="absolute left-0 top-0 bottom-0 w-16 group-hover:w-64 bg-white border-r transition-all duration-300 ease-in-out flex flex-col overflow-hidden shadow-sm group-hover:shadow-md">
          <nav className="p-3 space-y-2 w-64">
            {menuItems.map((item) => {
              if (isSuperAdmin) {
                // Superadmin sees everything
              } else {
                if (item.adminOnly && role !== "admin") return null;
                if (item.staffOnly && role === "user") return null;
              }

              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-56",
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-[#8d99ae] hover:text-[#2b2d42] hover:bg-gray-100",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pl-1">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
