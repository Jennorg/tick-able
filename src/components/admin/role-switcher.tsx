"use client";

import { useState } from "react";
import { updateUserRole } from "@/app/(dashboard)/admin/actions/admin";
import { Select } from "@/components/ui/select";

export function RoleSwitcher({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value;
    if (!confirm(`¿Estás seguro de cambiar el rol a ${newRole}?`)) return;

    setLoading(true);
    const result = await updateUserRole(userId, newRole);
    if (result?.error) {
      alert(result.error);
    }
    setLoading(false);
  }

  return (
    <Select
      options={[
        { label: "Usuario", value: "user" },
        { label: "Agente", value: "agent" },
        { label: "Administrador", value: "admin" },
      ]}
      defaultValue={currentRole}
      onChange={handleRoleChange}
      disabled={loading}
      className="w-40 h-9 py-1 text-sm"
    />
  );
}
