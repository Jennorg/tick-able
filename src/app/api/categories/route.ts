import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createClient();
  
  // Check user and organization
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role;
  const isSuperAdmin = user?.user_metadata?.is_superadmin === true || role === "superadmin";

  let query = supabase.from("categories").select("*").order("name");

  if (!isSuperAdmin) {
    // Try to get org from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user?.id)
      .single();
    
    if (profile?.organization_id) {
      query = query.eq("organization_id", profile.organization_id);
    }
  }

  const { data, error } = await query;

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  // Check role
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.user_metadata?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Get organization_id from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return NextResponse.json({ error: "Organization not found" }, { status: 400 });
  }

  const body = await request.json();
  const { name, description } = body;

  if (!name)
    return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("categories")
    .insert([{ 
      name, 
      description, 
      organization_id: profile.organization_id 
    }])
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
