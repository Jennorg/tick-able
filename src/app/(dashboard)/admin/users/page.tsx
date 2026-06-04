"use client";

import { Loader2, Mail, User as UserIcon, Plus, Send, X, Copy, Check, Edit2, Trash2, ShieldAlert, Sparkles } from "lucide-react";
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
  organizations?: { name: string } | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Profile | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Profile | null>(null);
  const [editData, setEditData] = useState({ full_name: "", role: "" });
  const [inviteRole, setInviteRole] = useState("agent");
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [orgSlug, setOrgSlug] = useState("");
  const [orgName, setOrgName] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchIdentity();
  }, []);

  async function fetchIdentity() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const text = await res.text();
        const me = text ? JSON.parse(text) : {};
        console.log("[UsersPage] Identity:", me);
        if (me.user) setCurrentUserId(me.user.id);
        if (me.organization?.slug) {
          setOrgSlug(me.organization.slug);
          setOrgName(me.organization.name);
        }
        const superAdmin = me.user?.user_metadata?.is_superadmin === true || me.user?.user_metadata?.role === "superadmin";
        console.log("[UsersPage] isSuperAdmin:", superAdmin);
        setIsSuperAdmin(superAdmin);
      }
    } catch (err) {
      console.error("Error fetching identity info:", err);
    }
  }

  async function fetchUsers() {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const text = await res.text();
      const data = text ? JSON.parse(text) : [];
      console.log("[UsersPage] Users loaded:", data.length);
      if (Array.isArray(data)) setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!showEditModal) return;
    setUpdating(true);

    try {
      const res = await fetch(`/api/users/${showEditModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });

      if (res.ok) {
        setUsers(
          users.map((u) =>
            u.id === showEditModal.id ? { ...u, ...editData as any } : u,
          ),
        );
        setShowEditModal(null);
      }
    } catch (err) {
      console.error("Error updating user:", err);
    } finally {
      setUpdating(false);
    }
  }

  async function handleDeleteUser() {
    if (!showDeleteConfirm) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/users/${showDeleteConfirm.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setUsers(users.filter((u) => u.id !== showDeleteConfirm.id));
        setShowDeleteConfirm(null);
      }
    } catch (err) {
      console.error("Error deleting user:", err);
    } finally {
      setDeleting(false);
    }
  }


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
          }}
          className="bg-[#ef233c] hover:bg-red-700 font-bold"
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
                    {isSuperAdmin && <th className="py-3 px-4">Empresa</th>}
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
                            {user.full_name} {user.id === currentUserId && "(Tú)"}
                          </span>
                        </div>
                      </td>
                      {isSuperAdmin && (
                        <td className="py-4 px-4 text-[#2b2d42]">
                          <span className="font-medium">{user.organizations?.name || "Sin Empresa"}</span>
                        </td>
                      )}
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
                        {user.id !== currentUserId && (
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => {
                                setShowEditModal(user);
                                setEditData({ full_name: user.full_name, role: user.role });
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setShowDeleteConfirm(user)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
        <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 space-y-1">
          <p className="font-bold uppercase tracking-wider">Nota sobre seguridad de contraseñas</p>
          <p>Por políticas de seguridad, las contraseñas se almacenan de forma cifrada e irreversible. No es posible visualizarlas. Si un agente olvida su acceso, se recomienda usar un enlace de recuperación.</p>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full animate-in zoom-in duration-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Editar Agente</CardTitle>
              <button onClick={() => setShowEditModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nombre Completo</label>
                  <Input 
                    value={editData.full_name}
                    onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Rol</label>
                  <select 
                    className="w-full h-10 border rounded-md px-3 text-sm"
                    value={editData.role}
                    onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                  >
                    <option value="user">Usuario</option>
                    <option value="agent">Agente</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button 
                    type="button" 
                    variant="secondary" 
                    className="flex-1"
                    onClick={() => setShowEditModal(null)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-[#ef233c] hover:bg-red-700"
                    disabled={updating}
                  >
                    {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Guardar Cambios"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-sm w-full animate-in zoom-in duration-200">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <Trash2 className="h-5 w-5" /> ¿Eliminar Agente?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Esta acción eliminará a <strong>{showDeleteConfirm.full_name}</strong> del sistema. Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <Button 
                  variant="secondary" 
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={handleDeleteUser}
                  disabled={deleting}
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Eliminar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full border-gray-100 shadow-2xl rounded-2xl animate-in zoom-in duration-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
              <div>
                <CardTitle className="text-lg font-bold text-[#2b2d42] flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#ef233c] animate-pulse" />
                  Generar Enlace de Invitación
                </CardTitle>
                <p className="text-xs text-[#8d99ae] mt-0.5">
                  El enlace registrará automáticamente al usuario en tu organización.
                </p>
              </div>
              <button 
                onClick={() => setShowInviteModal(false)} 
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              {/* Organization Info */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-[#8d99ae] uppercase tracking-wider">Tu Organización</p>
                  <p className="text-sm font-semibold text-[#2b2d42]">{orgName || "Cargando..."}</p>
                </div>
                <span className="px-2.5 py-1 bg-red-50 text-[#ef233c] text-xs font-mono rounded-lg border border-red-100/50">
                  {orgSlug || "cargando..."}
                </span>
              </div>

              {/* Role Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                  Rol del Invitado
                </label>
                <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setInviteRole("agent")}
                    className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                      inviteRole === "agent"
                        ? "bg-white text-[#2b2d42] shadow-sm"
                        : "text-[#8d99ae] hover:text-[#2b2d42]"
                    }`}
                  >
                    Agente de Soporte
                  </button>
                  <button
                    type="button"
                    onClick={() => setInviteRole("admin")}
                    className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                      inviteRole === "admin"
                        ? "bg-white text-[#2b2d42] shadow-sm"
                        : "text-[#8d99ae] hover:text-[#2b2d42]"
                    }`}
                  >
                    Administrador
                  </button>
                </div>
              </div>

              {/* Generated Link Display */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                  Enlace de Registro
                </label>
                <div className="flex gap-2">
                  <Input 
                    readOnly 
                    value={orgSlug ? `${typeof window !== "undefined" ? window.location.origin : ""}/register?role=${inviteRole}&org=${orgSlug}&invite=true` : "Generando..."} 
                    className="text-xs font-mono bg-gray-50 text-gray-600 border-gray-200 select-all" 
                  />
                  <Button 
                    variant="secondary" 
                    className="px-3 border border-gray-200 bg-white hover:bg-gray-50 shrink-0" 
                    onClick={() => {
                      const link = `${window.location.origin}/register?role=${inviteRole}&org=${orgSlug}&invite=true`;
                      navigator.clipboard.writeText(link);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    disabled={!orgSlug}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Quick Copy CTA Button */}
              <Button 
                onClick={() => {
                  const link = `${window.location.origin}/register?role=${inviteRole}&org=${orgSlug}&invite=true`;
                  navigator.clipboard.writeText(link);
                  setCopied(true);
                  setTimeout(() => {
                    setCopied(false);
                    setShowInviteModal(false);
                  }, 1000);
                }}
                disabled={!orgSlug}
                className="w-full bg-[#ef233c] hover:bg-red-700 h-11 text-sm font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group text-white"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    ¡Copiado al portapapeles!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    Copiar y Cerrar Enlace
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
