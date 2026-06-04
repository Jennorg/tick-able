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

  let query = supabase
    .from("tickets")
    .select("*, profiles!created_by(full_name), categories(name)")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (priority) query = query.eq("priority", priority);
  if (category) query = query.eq("category_id", category);
  if (q) query = query.ilike("title", `%${q}%`);

  const { data: tickets } = await query;

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role || "user";

  return (
    <div className="container mx-auto py-2">
      <TicketsView tickets={tickets || []} categories={categories || []} role={role} />
    </div>
  );
}
