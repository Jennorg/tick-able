"use client";

import { Loader2, Mail, User as UserIcon, Plus, Send, X, Copy, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "agent" | "user";
  avatar_url: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("agent");
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const text = await res.text();
      const data = text ? JSON.parse(text) : [];
      if (Array.isArray(data)) setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, role: newRole as any } : u,
        ),
      );
    }
  }

  async function handleInviteAgent(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    
    // In this simplified version, we'll generate a special registration link
    // that includes the role and organization context.
    // For a real app, this would send an email.
    
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Failed to fetch profile");
      const text = await res.text();
      const me = text ? JSON.parse(text) : {};
      const orgSlug = me.organization?.slug;
      
      const baseUrl = window.location.origin;
      // We encode the intent in the URL for the registration page to pick up
      const params = new URLSearchParams();
      params.set("role", inviteRole);
      params.set("org", orgSlug);
      params.set("invite", "true");
      
      const link = `${baseUrl}/register?${params.toString()}`;
      setInviteLink(link);
    } catch (err) {
      console.error("Error generating invite:", err);
    } finally {
      setInviting(false);
    }
  }

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#2b2d42]">
            Gestión de Usuarios
          </h1>
          <p className="text-[#8d99ae]">
            Administra los roles y permisos de tu equipo de soporte.
          </p>
        </div>
        <Button 
          onClick={() => {
            setShowInviteModal(true);
            setInviteLink("");
          }}
          className="bg-[#ef233c] hover:bg-red-700"
        >
          <Plus className="h-4 w-4 mr-2" /> Invitar Agente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Miembros del Equipo</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-sm font-semibold text-[#8d99ae] uppercase">
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Rol</th>
                    <th className="py-3 px-4">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((user) => (
                    <tr key={user.id} className="text-sm">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <UserIcon className="h-4 w-4" />
                          </div>
                          <span className="font-medium text-[#2b2d42]">
                            {user.full_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-[#8d99ae]">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-700"
                              : user.role === "agent"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-[#2b2d42]"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <select
                          className="text-xs border rounded p-1 outline-none focus:ring-1 focus:ring-blue-500 bg-white text-[#2b2d42]"
                          value={user.role}
                          onChange={(e) =>
                            handleRoleChange(user.id, e.target.value)
                          }
                        >
                          <option value="user">User</option>
                          <option value="agent">Agent</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full animate-in zoom-in duration-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Invitar nuevo miembro</CardTitle>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent>
              {!inviteLink ? (
                <form onSubmit={handleInviteAgent} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Email del Agente</label>
                    <Input 
                      type="email" 
                      placeholder="agente@empresa.com" 
                      required 
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Rol Asignado</label>
                    <select 
                      className="w-full h-10 border rounded-md px-3 text-sm"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                    >
                      <option value="agent">Agente de Soporte</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-[#ef233c] hover:bg-red-700"
                    disabled={inviting}
                  >
                    {inviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Generar Invitación
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 text-green-700 text-xs rounded-lg border border-green-100 flex items-center gap-2">
                    <Check className="h-4 w-4" /> Invitación generada con éxito.
                  </div>
                  <p className="text-sm text-gray-600">Envía este enlace al nuevo miembro para que se registre directamente en tu organización:</p>
                  <div className="flex gap-2">
                    <Input readOnly value={inviteLink} className="text-xs" />
                    <Button variant="secondary" size="sm" className="px-2" onClick={copyInvite}>
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={() => setShowInviteModal(false)}
                  >
                    Cerrar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
