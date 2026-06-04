import { TicketsView } from "@/components/tickets/tickets-view";
import { createClient } from "@/lib/supabase-server";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    category?: string;
    q?: string;
  }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const { status, priority, category, q } = params;

  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role || "user";
  const isSuperAdmin = user?.user_metadata?.is_superadmin === true || role === "superadmin";

  // Get organization_id from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user?.id)
    .single();

  const orgId = profile?.organization_id;

  let query = supabase
    .from("tickets")
    .select("*, profiles!created_by(full_name), categories(name)")
    .order("created_at", { ascending: false });

  if (isSuperAdmin) {
    // No filtering for superadmin
  } else if (role === "user") {
    query = query.eq("created_by", user?.id);
  } else if (orgId) {
    query = query.eq("organization_id", orgId);
  }

  if (status) query = query.eq("status", status);
  if (priority) query = query.eq("priority", priority);
  if (category) query = query.eq("category_id", category);
  if (q) query = query.ilike("title", `%${q}%`);

  const { data: tickets } = await query;

  let categoriesQuery = supabase.from("categories").select("*").order("name");
  if (!isSuperAdmin && orgId) {
    categoriesQuery = categoriesQuery.eq("organization_id", orgId);
  }
  const { data: categories } = await categoriesQuery;

  return (
    <div className="container mx-auto py-2">
      <TicketsView tickets={tickets || []} categories={categories || []} role={role} />
    </div>
  );
}
