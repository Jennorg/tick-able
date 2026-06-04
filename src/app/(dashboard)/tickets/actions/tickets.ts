"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { triggerTicketConfirmation, triggerHighPriorityAlert } from "@/lib/n8n";
import { headers } from "next/headers";

export async function createTicket(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const priority = formData.get("priority") as string;
  const categoryId = formData.get("categoryId") as string;

  // Fetch company_id and organization_id from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, company_id")
    .eq("id", user.id)
    .single();

  let orgId = profile?.organization_id;
  let companyId = profile?.company_id;

  // Fallbacks to default if not present
  if (!orgId || !companyId) {
    const { data: defaultOrg } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", "default")
      .single();
    if (defaultOrg) {
      orgId = orgId || defaultOrg.id;
    }

    const { data: defaultCompany } = await supabase
      .from("companies")
      .select("id")
      .eq("slug", "default")
      .single();
    if (defaultCompany) {
      companyId = companyId || defaultCompany.id;
    }
  }

  // 1. Insert ticket immediately
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .insert({
      title,
      description,
      priority,
      category_id: categoryId || null,
      created_by: user.id,
      organization_id: orgId || null,
      company_id: companyId || null,
    })
    .select()
    .single();

  if (ticketError) {
    return { error: ticketError.message };
  }

  // 2. Fire n8n webhooks (non-blocking, errors are caught silently)
  if (user.email) {
    triggerTicketConfirmation({
      id: ticket.id,
      title: ticket.title,
      email: user.email,
      priority: ticket.priority,
    }).catch((e) => console.error("[n8n] Confirmation webhook failed:", e));
  }

  if (ticket.priority === "high" || ticket.priority === "urgent") {
    triggerHighPriorityAlert({
      id: ticket.id,
      title: ticket.title,
      priority: ticket.priority,
    }).catch((e) => console.error("[n8n] Priority webhook failed:", e));
  }

  // 3. Fire-and-forget AI analysis — do NOT await so the user redirects instantly
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  // We explicitly do NOT await this — it runs in the background
  fetch(`${baseUrl}/api/ai/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticketId: ticket.id, title, description }),
  }).catch((e) => console.error("[AI] Background analysis failed to dispatch:", e));

  // 4. Redirect immediately — user goes to ticket detail while IA processes in background
  revalidatePath("/tickets");
  redirect(`/tickets/${ticket.id}`);
}
