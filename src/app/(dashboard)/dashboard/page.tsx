import { createClient } from "@/lib/supabase-server";
import { DashboardClient } from "@/app/(dashboard)/dashboard/DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  const role = user?.user_metadata?.role || "user";
  const isSuperAdmin = user?.user_metadata?.is_superadmin === true || role === "superadmin";

  // Get organization_id from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user?.id)
    .single();

  const orgId = profile?.organization_id;

  // Fetch tickets based on role and organization
  let ticketsQuery = supabase.from("tickets").select("*");

  if (isSuperAdmin) {
    // Superadmin sees everything
  } else if (role === "user") {
    ticketsQuery = ticketsQuery.eq("created_by", user?.id);
  } else if (orgId) {
    // Admin/Agent sees their organization
    ticketsQuery = ticketsQuery.eq("organization_id", orgId);
  }

  const { data: tickets } = await ticketsQuery.order("created_at", {
    ascending: false,
  });

  // Fetch categories (filtered by org)
  let categoriesQuery = supabase.from("categories").select("*");
  if (!isSuperAdmin && orgId) {
    categoriesQuery = categoriesQuery.eq("organization_id", orgId);
  }
  const { data: categories } = await categoriesQuery;

  return (
    <DashboardClient
      user={user}
      role={role}
      tickets={tickets || []}
      categories={categories || []}
    />
  );
}
