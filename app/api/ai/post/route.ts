import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSystemInstruction } from "@/lib/ai/ai-loader";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const { userId, topic, styleInstruction, wordCount = 1000 } = await req.json();

  if (!process.env.GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: "API key not found" }), { status: 500 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const modelName = process.env.GEMINI_ALGO_MODEL || "gemini-2.5-flash";
        const model = genAI.getGenerativeModel({
          model: modelName,
        });

        const rawPrompt = getSystemInstruction("post-assistant-generator");
        const prompt = rawPrompt
          .replace("{{styleInstruction}}", styleInstruction || "")
          .replace("{{wordCount}}", String(wordCount))
          .replace("{{topic}}", topic || "");

        const result = await model.generateContentStream({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        let firstChunkReceived = false;

        for await (const chunk of result.stream) {
          if (!firstChunkReceived) {
            controller.enqueue(encoder.encode(JSON.stringify({ type: "event", data: "first_chunk" }) + "\n"));
            firstChunkReceived = true;
          }

          const text = chunk.text();
          // SDK/モデルが思考プロセスを返す場合、ここで取得を試みます
          const thought = (chunk as any).thought || "";
          
          controller.enqueue(encoder.encode(JSON.stringify({ 
            type: "chunk", 
            text: text,
            thought: thought
          }) + "\n"));
        }

        const response = await result.response;
        const usage = response.usageMetadata;

        controller.enqueue(encoder.encode(JSON.stringify({ 
          type: "done", 
          usage: usage 
        }) + "\n"));

      } catch (error: any) {
        console.error("Streaming Error:", error);
        controller.enqueue(encoder.encode(JSON.stringify({ type: "error", message: error.message }) + "\n"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
