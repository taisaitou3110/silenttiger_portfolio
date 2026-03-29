import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { saveAiLog } from "@/lib/ai/ai-logger";
import { getSystemInstruction } from "@/lib/ai/ai-loader";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const { userId, pastArticles } = await req.json();

  if (!process.env.GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: "API key not found" }), { status: 500 });
  }

  const encoder = new TextEncoder();
  const startTime = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const modelName = process.env.GEMINI_ALGO_MODEL || "gemini-2.0-flash";
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: "あなたはプロの執筆スタイル・プロファイラーです。渡されたテキストから、著者の「文体の癖」を極めて詳細に抽出し、再現可能な『文体指示書』を作成してください。"
        });

        const rawPrompt = getSystemInstruction("post-assistant-analyzer");
        const prompt = rawPrompt.replace("{{pastArticles}}", pastArticles || "");

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
          const thought = (chunk as any).thought || "";
          
          controller.enqueue(encoder.encode(JSON.stringify({ 
            type: "chunk", 
            text: text,
            thought: thought
          }) + "\n"));
        }

        const response = await result.response;
        const usage = response.usageMetadata;

        // 利用ログの保存
        if (usage) {
          await saveAiLog({
            appId: 'handwriting',
            modelName: modelName,
            promptTokens: usage.promptTokenCount || 0,
            resultTokens: usage.candidatesTokenCount || 0,
            status: 'SUCCESS',
            durationMs: Date.now() - startTime,
          });
        }

        controller.enqueue(encoder.encode(JSON.stringify({ 
          type: "done", 
          usage: usage 
        }) + "\n"));

      } catch (error: any) {
        console.error("Analysis Streaming Error:", error);
        
        await saveAiLog({
          appId: 'handwriting',
          modelName: "unknown",
          promptTokens: 0,
          resultTokens: 0,
          status: 'ERROR',
          errorMessage: error.message,
          durationMs: Date.now() - startTime,
        });

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
