"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { geminiModel } from "@/lib/gemini";
import { createClient } from "@/lib/supabase-server";

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

  // 1. Insert ticket
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .insert({
      title,
      description,
      priority,
      category_id: categoryId || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (ticketError) {
    return { error: ticketError.message };
  }

  // 2. Trigger AI Analysis (Async but we'll wait for the demo)
  try {
    const prompt = `
      Eres un asistente de soporte técnico. Analiza el siguiente ticket y devuelve un JSON estrictamente con este formato:
      {
        "summary": "resumen del problema en una frase",
        "classification": "categoría detectada (hardware, software, red, etc.)",
        "suggestions": "respuesta sugerida al usuario, profesional y clara",
        "riskLevel": "critical, high, medium o low"
      }
      Ticket: Título: ${title} Descripción: ${description}
    `;

    const startTime = Date.now();
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const iaData = JSON.parse(text);
    const latency = Date.now() - startTime;

    // Update ticket with IA data
    await supabase
      .from("tickets")
      .update({
        ia_summary: iaData.summary,
        ia_classification: iaData.classification,
        ia_suggestions: iaData.suggestions,
        ia_risk_level: iaData.riskLevel,
        ia_raw_json: iaData,
        ia_prompt: prompt,
        ia_model: "gemini-1.5-flash",
        ia_latency_ms: latency,
        // tokens_used: response.usageMetadata?.totalTokenCount || 0,
      })
      .eq("id", ticket.id);

    // Audit log
    await supabase.from("ia_audit_log").insert({
      ticket_id: ticket.id,
      prompt,
      model: "gemini-1.5-flash",
      latency_ms: latency,
      result: iaData,
    });
  } catch (error) {
    console.error("IA Analysis failed:", error);
    // We don't fail the ticket creation if IA fails
  }

  revalidatePath("/tickets");
  redirect(`/tickets/${ticket.id}`);
}
