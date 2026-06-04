import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function DELETE(
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

  // If not superadmin, ensure the category belongs to the same organization
  if (!isSuperAdmin) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", currentUser?.id)
      .single();
    
    const { data: category } = await supabase
      .from("categories")
      .select("organization_id")
      .eq("id", id)
      .single();

    if (profile?.organization_id !== category?.organization_id) {
      return NextResponse.json({ error: "Unauthorized: Category belongs to another organization" }, { status: 403 });
    }
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
