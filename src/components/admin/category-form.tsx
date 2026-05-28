"use client";

import { useState } from "react";
import { createCategory } from "@/app/(dashboard)/admin/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CategoryForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    await createCategory(name, description);
    setLoading(false);
    // Close modal or reset (if handled by parent)
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <Input name="name" label="Nombre" placeholder="Software" required />
      <Input
        name="description"
        label="Descripción"
        placeholder="Problemas de aplicaciones"
      />
      <Button type="submit" className="w-full" isLoading={loading}>
        Crear Categoría
      </Button>
    </form>
  );
}
