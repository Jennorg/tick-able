import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash", // Use flash for latency/cost efficiency as per optimization strategy
  generationConfig: {
    responseMimeType: "application/json",
  },
});
