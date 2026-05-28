import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createClient();

  // Check role
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role;

  if (role !== "admin" && role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // If agent, maybe only fetch other agents/admins?
  // For simplicity and specified requirements, we'll fetch all profiles if staff
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name");

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
