import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { id } = await params;
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
