import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const { userId, topic, styleInstruction } = await req.json();

  if (!process.env.GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: "API key not found" }), { status: 500 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // リストで確認された最新の 2.5-flash を使用
        // thinking: true が設定されているため、思考プロセスが期待できます
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
        });

        const prompt = `
          以下の「ネタ（議論ログやメモ）」を基に、指定された文体指示に従ってnote記事を作成してください。
          
          【文体指示】
          ${styleInstruction}

          【制約事項】
          - 文字数は2,000字程度
          - note形式（見出し、箇条書き、太字などを適宜使用）
          - 最後に適切なハッシュタグを3〜5個付与
          
          【ネタ】
          ${topic}
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
