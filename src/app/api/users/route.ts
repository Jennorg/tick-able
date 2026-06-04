import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createClient();

  // Check role
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role;
  const isSuperAdmin = user?.user_metadata?.is_superadmin === true || role === "superadmin";

  if (role !== "admin" && role !== "agent" && role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Get user's organization_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user?.id)
    .single();

  const orgId = profile?.organization_id;

  let query = supabase
    .from("profiles")
    .select("*")
    .order("full_name");

  if (!isSuperAdmin && orgId) {
    query = query.eq("organization_id", orgId);
  }

  const { data, error } = await query;

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
