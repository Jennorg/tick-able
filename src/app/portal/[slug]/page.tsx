import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { PortalForm } from "./PortalForm";

export default async function PortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  // Extract template data from searchParams
  const template = {
    title: typeof sp.title === "string" ? sp.title : "",
    description: typeof sp.description === "string" ? sp.description : "",
    priority: typeof sp.priority === "string" ? sp.priority : "medium",
    categoryId: typeof sp.category === "string" ? sp.category : "",
  };

  // Fetch organization by slug
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!org) {
    notFound();
  }

  // Fetch categories for this organization
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("organization_id", org.id)
    .order("name");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-[#2b2d42] tracking-tight">
            Portal de Soporte
          </h1>
          <p className="text-[#8d99ae] mt-2">
            Bienvenido al centro de ayuda de <span className="font-bold text-[#ef233c]">{org.name}</span>
          </p>
        </div>

        <PortalForm 
          organization={org} 
          categories={categories || []} 
          template={template}
        />
        
        <p className="text-center text-xs text-[#8d99ae] mt-8">
          Potenciado por <span className="font-bold">TickAble</span> • AI Support Ticket System
        </p>
      </div>
    </div>
  );
}
