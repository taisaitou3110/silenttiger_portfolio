import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const { text } = await req.json();

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

        const prompt = `
          以下のテキストは図書館や書店の貸出・購入履歴です。
...

          
          【出力形式（JSON配列のみ）】
          [
            {
              "title": "本のタイトル",
              "author": "著者名（余分な空白や「／著」などは削除）",
              "utilizationDate": "YYYY/MM/DD（利用日や貸出日。不明な場合は現在の日付）"
            }
          ]
          
          思考プロセス（Thinking）を含めて出力し、様々なフォーマットのテキストから正確に書籍データを抽出してください。
          
          【解析対象テキスト】
          ${text}
        `;

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
        console.error("Bookshelf AI Error:", error);
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
