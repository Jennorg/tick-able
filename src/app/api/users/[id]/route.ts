import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { id } = await params;

  // Check role
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  const currentRole = currentUser?.user_metadata?.role;
  const isSuperAdmin = currentUser?.user_metadata?.is_superadmin === true || currentRole === "superadmin";

  if (currentRole !== "admin" && !isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { role } = body;

  if (!role || !["admin", "agent", "user"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // If not superadmin, ensure the target user belongs to the same organization
  if (!isSuperAdmin) {
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", currentUser?.id)
      .single();
    
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", id)
      .single();

    if (adminProfile?.organization_id !== targetProfile?.organization_id) {
      return NextResponse.json({ error: "Unauthorized: User belongs to another organization" }, { status: 403 });
    }
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
