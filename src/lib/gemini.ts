import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is not defined in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

// Schema definition for structured output - saves tokens by not explaining it in the prompt
const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: {
      type: SchemaType.STRING,
      description: "Resumen del problema en una sola frase corta.",
    },
    classification: {
      type: SchemaType.STRING,
      description: "Categoría del ticket: hardware, software, red, cuenta, u otro.",
    },
    suggestions: {
      type: SchemaType.STRING,
      description: "Respuesta sugerida profesional y clara para el usuario.",
    },
    riskLevel: {
      type: SchemaType.STRING,
      format: "enum",
      description: "Nivel de riesgo o urgencia detectado.",
      enum: ["critical", "high", "medium", "low"],
    },
  },
  required: ["summary", "classification", "suggestions", "riskLevel"],
};

// Schema for agent selection
const agentSelectionSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    selectedAgentId: {
      type: SchemaType.STRING,
      description: "ID del agente seleccionado para el ticket.",
    },
    reasoning: {
      type: SchemaType.STRING,
      description: "Explicación de por qué se eligió a este agente basado en su rendimiento.",
    },
  },
  required: ["selectedAgentId", "reasoning"],
};

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction: "Eres un gestor de soporte técnico experto. Tu tarea es analizar tickets y el rendimiento de los agentes para optimizar la asignación y extraer información clave.",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: responseSchema,
  },
});

const assignmentModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction: "Eres un optimizador de recursos de soporte. Debes asignar tickets al agente más capaz basándote en sus métricas de resolución diaria y carga actual.",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: agentSelectionSchema,
  },
});

export async function analyzeTicket(title: string, description: string) {
  const prompt = `Analiza este ticket:
Título: ${title.slice(0, 200)}
Descripción: ${description.slice(0, 1000)}`;

  const startTime = Date.now();
  const result = await geminiModel.generateContent(prompt);
  const response = await result.response;
  const latency = Date.now() - startTime;
  const tokensUsed = response.usageMetadata?.totalTokenCount || 0;
  
  // Robust JSON parsing: strip Markdown code blocks if present
  const text = response.text().replace(/```json\n?/, "").replace(/\n?```/, "").trim();
  const data = JSON.parse(text);

  return {
    data,
    latency,
    tokensUsed,
    prompt,
  };
}

export async function selectBestAgent(ticketTitle: string, agentsPerformance: any[]) {
  const prompt = `Asigna el ticket "${ticketTitle}" al mejor agente disponible.
Métricas de rendimiento de agentes (promedio resolución/día, carga actual, especialidad):
${JSON.stringify(agentsPerformance, null, 2)}`;

  const startTime = Date.now();
  const result = await assignmentModel.generateContent(prompt);
  const response = await result.response;
  const latency = Date.now() - startTime;
  const tokensUsed = response.usageMetadata?.totalTokenCount || 0;

  // Robust JSON parsing: strip Markdown code blocks if present
  const text = response.text().replace(/```json\n?/, "").replace(/\n?```/, "").trim();
  const data = JSON.parse(text);

  return {
    selectedAgentId: data.selectedAgentId,
    reasoning: data.reasoning,
    latency,
    tokensUsed,
  };
}
