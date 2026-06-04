import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createClient();

  // Check role
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  // Get user profile to check role and org
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user?.id)
    .single();

  const metadataRole = user?.user_metadata?.role;
  const isSuperAdmin = user?.user_metadata?.is_superadmin === true || metadataRole === "superadmin" || profile?.role === "superadmin";

  console.log(`[API/Users] User: ${user?.email}, MetaRole: ${metadataRole}, ProfileRole: ${profile?.role}, isSuperAdmin: ${isSuperAdmin}`);

  if (profile?.role !== "admin" && profile?.role !== "agent" && !isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const orgId = profile?.organization_id;
  console.log(`[API/Users] Profile OrgId: ${orgId}`);

  let query = supabase
    .from("profiles")
    .select("*, organizations(name)")
    .order("full_name");

  if (!isSuperAdmin) {
    if (!orgId) {
      console.log(`[API/Users] Denying access: No orgId found for non-superadmin`);
      return NextResponse.json([]);
    }
    console.log(`[API/Users] Filtering by OrgId: ${orgId}`);
    query = query.eq("organization_id", orgId);
  } else {
    console.log(`[API/Users] Superadmin detected, returning all users`);
  }

  const { data, error } = await query;

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
