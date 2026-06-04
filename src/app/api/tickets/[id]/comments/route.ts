import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { id } = await params;
  
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role;
  const isSuperAdmin = user?.user_metadata?.is_superadmin === true || role === "superadmin";

  // Check if user has access to this ticket
  let ticketQuery = supabase.from("tickets").select("organization_id, created_by").eq("id", id);

  if (!isSuperAdmin) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user?.id)
      .single();
    
    if (profile?.organization_id) {
      ticketQuery = ticketQuery.eq("organization_id", profile.organization_id);
    } else {
      ticketQuery = ticketQuery.eq("created_by", user?.id);
    }
  }

  const { data: ticket, error: ticketError } = await ticketQuery.single();

  if (ticketError || !ticket) {
    return NextResponse.json({ error: "Unauthorized or ticket not found" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles:author_id(full_name, avatar_url, role)")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { id } = await params;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = user?.user_metadata?.role;
  const isSuperAdmin = user?.user_metadata?.is_superadmin === true || role === "superadmin";

  // Check access to ticket
  let ticketQuery = supabase.from("tickets").select("organization_id, created_by").eq("id", id);
  if (!isSuperAdmin) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();
    
    if (profile?.organization_id) {
      ticketQuery = ticketQuery.eq("organization_id", profile.organization_id);
    } else {
      ticketQuery = ticketQuery.eq("created_by", user.id);
    }
  }

  const { data: ticket, error: ticketError } = await ticketQuery.single();
  if (ticketError || !ticket) {
    return NextResponse.json({ error: "Unauthorized or ticket not found" }, { status: 403 });
  }

  const body = await request.json();
  const { content, is_internal } = body;

  if (!content)
    return NextResponse.json({ error: "Content is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("comments")
    .insert([
      {
        ticket_id: id,
        author_id: user.id,
        content,
        is_internal: is_internal || false,
      },
    ])
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
