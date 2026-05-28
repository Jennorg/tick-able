import { NextResponse } from "next/server";
import { geminiModel } from "@/lib/gemini";
import { createClient } from "@/lib/supabase-server";
import { triggerTicketConfirmation, triggerHighPriorityAlert } from "@/lib/n8n";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, priority, category_id } = body;

  if (!title || !description) {
    return NextResponse.json(
      { error: "Title and description are required" },
      { status: 400 },
    );
  }

  // 1. Insert ticket initial state
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .insert([
      {
        title,
        description,
        priority: priority || "medium",
        category_id,
        created_by: user.id,
        status: "open",
      },
    ])
    .select()
    .single();

  if (ticketError)
    return NextResponse.json({ error: ticketError.message }, { status: 500 });

  // Trigger n8n confirmation email
  if (user.email) {
    await triggerTicketConfirmation({
      id: ticket.id,
      title: ticket.title,
      email: user.email,
      priority: ticket.priority,
    });
  }

  // Trigger n8n Slack alert if high priority or urgent
  if (ticket.priority === "high" || ticket.priority === "urgent") {
    await triggerHighPriorityAlert({
      id: ticket.id,
      title: ticket.title,
      priority: ticket.priority,
    });
  }

  // 2. Call Gemini IA Analysis
  const prompt = `
    Eres un asistente de soporte técnico experto. Analiza el siguiente ticket y devuelve un JSON estrictamente con este formato, sin texto adicional:
    {
      "summary": "resumen del problema en una frase",
      "classification": "categoría detectada (hardware, software, red, etc.)",
      "suggestions": "respuesta sugerida al usuario, profesional y clara",
      "riskLevel": "critical, high, medium o low"
    }
    Ticket:
    Título: ${title}
    Descripción: ${description}
  `;

  const startTime = Date.now();
  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const iaResult = JSON.parse(text);
    const latency = Date.now() - startTime;
    const tokensUsed = response.usageMetadata?.totalTokenCount || 0;

    // 3. Update ticket with IA results
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        ia_summary: iaResult.summary,
        ia_classification: iaResult.classification,
        ia_suggestions: iaResult.suggestions,
        ia_risk_level: iaResult.riskLevel,
        ia_raw_json: iaResult,
        ia_prompt: prompt,
        ia_model: "gemini-2.5-flash",
        ia_latency_ms: latency,
        ia_tokens_used: tokensUsed,
      })
      .eq("id", ticket.id);

    // 4. Log to ia_audit_log
    await supabase.from("ia_audit_log").insert([
      {
        ticket_id: ticket.id,
        prompt,
        model: "gemini-2.5-flash",
        latency_ms: latency,
        tokens_used: tokensUsed,
        result: iaResult,
      },
    ]);

    if (updateError)
      console.error("Error updating ticket with IA:", updateError);

    return NextResponse.json({ ...ticket, ia: iaResult });
  } catch (iaError) {
    console.error("IA Analysis failed:", iaError);
    return NextResponse.json(ticket); // Return ticket even if IA fails
  }
}

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tickets")
    .select("*, profiles!created_by(full_name), categories(name)")
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
