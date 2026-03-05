import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const { image, mimeType, docType, personalContext } = await req.json();

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
          ${personalContext || ""}
          この画像は${docType === 'business' ? 'ビジネス電話' : docType === 'order' ? '発注電話' : '一般メモ'}です。
          内容を解析し、以下の構造を持つJSON形式のみを出力してください。
          
          【出力形式（JSONのみ）】
          ${docType === 'general' 
            ? '{ "rawText": "解析テキスト", "confidence": 0.9 }' 
            : '{ "customerName": "名前", "phoneNumber": "番号", "zipCode": "郵便番号", "address": "住所", "content": "内容（ビジネスの場合）", "items": [{"itemName": "品名", "quantity": 1, "price": 100}], "confidence": 0.9 }'
          }
          
          筆跡プロファイルの傾向を考慮して、崩し字を正確に補正してください。
          思考プロセス（Thinking）を含めて出力してください。
        `;

        const result = await model.generateContentStream([
          prompt,
          { inlineData: { data: image.split(",")[1], mimeType } }
        ]);

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

        controller.enqueue(encoder.encode(JSON.stringify({ 
          type: "done", 
          usage: usage 
        }) + "\n"));

      } catch (error: any) {
        console.error("Handwriting AI Error:", error);
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
