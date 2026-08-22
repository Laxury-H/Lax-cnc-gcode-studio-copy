import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { message, history = [], context } = await req.json();
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

    const systemInstruction = `You are a Master CNC Programmer and Woodworking Expert assistant for the LAX CNC Simulator.

Your expertise includes:
1. G-code Programming & Troubleshooting: Deep knowledge of RS274/NGC, Fanuc, and standard router G-code dialects.
2. Woodworking & Routing: Expert in cutting parameters (speeds and feeds) for various wood types (hardwood, softwood, MDF, plywood), acrylic, and aluminum.
3. Tooling Selection: End mills, V-bits, compression bits, ball nose, surfacing bits.
4. CNC Machine Operations: Work coordinates (G54-G59), tool length offsets (G43), feeds (F), and speeds (S).

Guidelines for answering:
- Be concise, professional, and practical.
- Provide actionable advice for optimizing machining parameters (spindle speed, feed rate, depth of cut, stepover).
- If the user provides a G-code snippet, help them optimize or fix it. When providing code, format it as a G-code block.
- Read and utilize the provided "CURRENT CONTEXT" (stock size, machine profile, current tool, simulation diagnostics) to give highly specific recommendations.
- Keep safety in mind: warn about tool breakage or fire hazards if parameters seem too aggressive for woodworking.

${context ? "\n--- CURRENT CONTEXT ---\n" + context : ""}`;

    const contents = history.map((msg: { role: string; text: string }) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.text }],
    }));

    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return NextResponse.json({ text: response.text });
  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI response" },
      { status: 500 }
    );
  }
}
