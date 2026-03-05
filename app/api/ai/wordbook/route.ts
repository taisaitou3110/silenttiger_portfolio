import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const { type, term, text } = await req.json();

  if (!process.env.GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: "API key not found" }), { status: 500 });
  }

  const modelName = process.env.GEMINI_ALGO_MODEL || "gemini-2.5-flash";
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        let prompt = "";

        if (type === 'suggest') {
          prompt = `
            単語「${term}」について、以下のJSON形式のみで回答してください。解説文などは一切不要です。
            {
              "meaning": "日本語での主な意味",
              "phonetic": "発音記号",
              "examples": [
                { "text": "英語の例文1", "collocation": "その文中の核心となるコロケーション" }
              ]
            }
            ※例文は最大10個生成してください。実用的で、日常会話やビジネスで使いやすいものにしてください。
            思考プロセス（Thinking）を含めて出力してください。
          `;
        } else if (type === 'bulk') {
          prompt = `
            以下のテキストから英単語、意味、発音記号、実用的な例文3つを抽出し、JSON形式で出力してください。
            解説文などは一切不要です。
            【テキスト】: ${text}
            【形式】: {"words": [{"term": "...", "meaning": "...", "phonetic": "...", "examples": [{"text": "...", "collocation": "..."}]}]}
            思考プロセス（Thinking）を含めて出力してください。
          `;
        }

        const result = await model.generateContentStream({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        let firstChunkReceived = false;

        for await (const chunk of result.stream) {
          if (!firstChunkReceived) {
            controller.enqueue(encoder.encode(JSON.stringify({ type: "event", data: "first_chunk" }) + "\n"));
            firstChunkReceived = true;
          }

          const textData = chunk.text();
          const thought = (chunk as any).thought || "";
          
          controller.enqueue(encoder.encode(JSON.stringify({ 
            type: "chunk", 
            text: textData,
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
        console.error("Wordbook AI Error:", error);
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
