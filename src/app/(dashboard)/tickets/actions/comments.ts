"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export async function addComment(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const ticketId = formData.get("ticketId") as string;
  const content = formData.get("content") as string;
  const isInternal = formData.get("isInternal") === "on";

  const { error } = await supabase.from("comments").insert({
    ticket_id: ticketId,
    author_id: user.id,
    content,
    is_internal: isInternal,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/tickets/${ticketId}`);
}

export async function applyIaSuggestion(ticketId: string, suggestion: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase.from("comments").insert({
    ticket_id: ticketId,
    author_id: user.id,
    content: suggestion,
    is_internal: false,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/tickets/${ticketId}`);
}
