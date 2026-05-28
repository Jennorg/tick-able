import { NextResponse } from "next/server";
import { geminiModel } from "@/lib/gemini";
import { createServiceClient } from "@/lib/supabase-service";

export async function POST(request: Request) {
  const body = await request.json();
  const { ticketId, title, description } = body;

  if (!ticketId || !title || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const prompt = `Eres un asistente de soporte técnico. Analiza el siguiente ticket de soporte y responde ÚNICAMENTE con un JSON válido sin texto adicional:
{"summary":"resumen en una sola frase","classification":"categoría (hardware, software, red, cuenta, otro)","suggestions":"respuesta profesional y clara para el usuario","riskLevel":"critical|high|medium|low"}
Título: ${title.slice(0, 300)}
Descripción: ${description.slice(0, 500)}`;

  const startTime = Date.now();
  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json\n?/, "").replace(/\n?```/, "").trim();
    const iaData = JSON.parse(text);
    const latency = Date.now() - startTime;
    const tokensUsed = response.usageMetadata?.totalTokenCount || 0;

    // Update ticket with IA results
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        ia_summary: iaData.summary,
        ia_classification: iaData.classification,
        ia_suggestions: iaData.suggestions,
        ia_risk_level: (iaData.riskLevel || "low").toLowerCase(),
        ia_raw_json: iaData,
        ia_prompt: prompt,
        ia_model: "gemini-2.5-flash",
        ia_latency_ms: latency,
        ia_tokens_used: tokensUsed,
      })
      .eq("id", ticketId);

    if (updateError) {
      console.error("[AI Analyze] Supabase update error:", updateError);
    }

    // Audit log
    await supabase.from("ia_audit_log").insert({
      ticket_id: ticketId,
      prompt,
      model: "gemini-2.5-flash",
      latency_ms: latency,
      tokens_used: tokensUsed,
      result: iaData,
    });

    console.log(`[AI Analyze] ✓ ticket ${ticketId} processed in ${latency}ms`);
    return NextResponse.json({ success: true, latency });
  } catch (error) {
    console.error("[AI Analyze] Failed:", error);
    return NextResponse.json({ error: "AI analysis failed" }, { status: 500 });
  }
}
