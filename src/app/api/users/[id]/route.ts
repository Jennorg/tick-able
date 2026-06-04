import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createServiceClient } from "@/lib/supabase-service";

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

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUser?.id)
    .single();

  const currentRole = currentProfile?.role;
  const metadataRole = currentUser?.user_metadata?.role;
  const isSuperAdmin = currentUser?.user_metadata?.is_superadmin === true || metadataRole === "superadmin" || currentRole === "superadmin";

  console.log(`[API/Users/ID] Action by: ${currentUser?.email}, Role: ${currentRole}, isSuperAdmin: ${isSuperAdmin}, Target ID: ${id}`);

  if (currentRole !== "admin" && !isSuperAdmin) {
    console.log(`[API/Users/ID] Rejected: Not admin or superadmin`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { role, full_name } = body;

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

    if (!adminProfile?.organization_id || adminProfile.organization_id !== targetProfile?.organization_id) {
      return NextResponse.json({ error: "Unauthorized: User belongs to another organization" }, { status: 403 });
    }
  }

  const updates: any = {};
  if (role) {
    if (!["admin", "agent", "user"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    updates.role = role;
  }
  if (full_name) updates.full_name = full_name;

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

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

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUser?.id)
    .single();

  const currentRole = currentProfile?.role;
  const metadataRole = currentUser?.user_metadata?.role;
  const isSuperAdmin = currentUser?.user_metadata?.is_superadmin === true || metadataRole === "superadmin" || currentRole === "superadmin";

  console.log(`[API/Users/ID] Action by: ${currentUser?.email}, Role: ${currentRole}, isSuperAdmin: ${isSuperAdmin}, Target ID: ${id}`);

  if (currentRole !== "admin" && !isSuperAdmin) {
    console.log(`[API/Users/ID] Rejected: Not admin or superadmin`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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

    if (!adminProfile?.organization_id || adminProfile.organization_id !== targetProfile?.organization_id) {
      return NextResponse.json({ error: "Unauthorized: User belongs to another organization" }, { status: 403 });
    }
  }

  // Use service client to delete from auth as well
  const supabaseService = createServiceClient();
  
  // 1. Delete from profiles (Cascade might handle this if configured, but let's be explicit)
  const { error: profileError } = await supabaseService
    .from("profiles")
    .delete()
    .eq("id", id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // 2. Delete from auth.users
  const { error: authError } = await supabaseService.auth.admin.deleteUser(id);
  
  if (authError) {
    console.error("Error deleting user from auth:", authError);
    // Continue anyway as profile is gone
  }

  return NextResponse.json({ success: true });
}
