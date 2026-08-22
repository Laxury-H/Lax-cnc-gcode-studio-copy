import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    const customApiKey = req.headers.get("x-gemini-api-key");
    const activeApiKey = customApiKey || process.env.GEMINI_API_KEY;

    if (!activeApiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured and no custom key was provided" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey: activeApiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const systemInstruction = `You are a Master CNC Programmer.
Your task is to analyze the provided G-code and optimize it to reduce total machining time while maintaining strict safety parameters.
Specifically, look for non-cutting segments (e.g., G01 moves that occur when Z is above the material surface, often known as safe Z) and optimize them by increasing their feed rates or converting them to G00 rapid moves where appropriate. 
Return ONLY the raw optimized G-code. Do not include any conversational text, explanations, or markdown fences like \`\`\`gcode. Provide ONLY the pure G-code text.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts: [{ text: code }] }],
      config: {
        systemInstruction,
        temperature: 0.2, 
      },
    });

    const rawOutput = response.text || "";
    // Clean up any markdown blocks if the model still outputs them
    const cleanOutput = rawOutput
      .replace(/^```(gcode)?\n/im, "")
      .replace(/\n```$/im, "")
      .trim();

    return NextResponse.json({ code: cleanOutput });
  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json(
      { error: "Failed to optimize G-code" },
      { status: 500 }
    );
  }
}
