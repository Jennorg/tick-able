import { createClient } from "@/lib/supabase-server";
import { DashboardClient } from "@/app/(dashboard)/dashboard/DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  const role = user?.user_metadata?.role || "user";

  // Fetch tickets based on role
  let ticketsQuery = supabase.from("tickets").select("*");

  if (role === "user") {
    ticketsQuery = ticketsQuery.eq("created_by", user?.id);
  }

  const { data: tickets } = await ticketsQuery.order("created_at", {
    ascending: false,
  });

  // Fetch categories
  const { data: categories } = await supabase
    .from("categories")
    .select("*");

  return (
    <DashboardClient
      user={user}
      role={role}
      tickets={tickets || []}
      categories={categories || []}
    />
  );
}
