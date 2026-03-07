import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const { type, data, mimeType } = await req.json();

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
        let content: any[] = [];

        if (type === 'image') {
          prompt = `あなたはプロの栄養士です。提供された画像を分析し、以下の情報をJSON形式のみで出力してください。
          画像が食べ物や飲み物、または食事の風景でない場合は、"isFood": false とし、"error": "食べ物の写真ではありません。" と出力してください。
          【出力形式】
          {
            "isFood": true,
            "foodName": "料理名",
            "calories": 500,
            "breakdown": "ごはん(200kcal), 焼魚(150kcal)等",
            "advice": "栄養バランスのアドバイス",
            "error": ""
          }`;
          content = [prompt, { inlineData: { data: data.split(",")[1], mimeType } }];
        } else if (type === 'text') {
          prompt = `あなたはプロの栄養士です。入力された内容を分析し、以下の情報をJSON形式のみで出力してください。
          入力内容が食事や食品に関する記述でない場合は、"isFood": false とし、"error": "食事に関する内容ではありません。" と出力してください。
          入力内容: "${data}"
          【出力形式】
          {
            "isFood": true,
            "foodName": "料理名",
            "calories": 500,
            "breakdown": "ごはん(200kcal), 焼魚(150kcal)等",
            "advice": "栄養バランスのアドバイス",
            "error": ""
          }`;
          content = [prompt];
        } else if (type === 'voice') {
          prompt = `あなたはプロの栄養士です。音声データを文字起こしした情報を分析し、以下の情報をJSON形式のみで出力してください。
          入力内容が食事や食品に関する発言でない場合は、"isFood": false とし、"error": "食事に関する発言ではありません。" と出力してください。
          【出力形式】
          {
            "isFood": true,
            "foodName": "料理名",
            "calories": 500,
            "breakdown": "解析結果",
            "advice": "栄養バランスのアドバイス",
            "error": ""
          }`;
          content = [prompt, { inlineData: { data: data.split(",")[1], mimeType } }];
        }

        const result = await model.generateContentStream(content);

        let firstChunkReceived = false;
        for await (const chunk of result.stream) {
          if (!firstChunkReceived) {
            controller.enqueue(encoder.encode(JSON.stringify({ type: "event", data: "first_chunk" }) + "\n"));
            firstChunkReceived = true;
          }
          const text = chunk.text();
          const thought = (chunk as any).thought || "";
          controller.enqueue(encoder.encode(JSON.stringify({ type: "chunk", text, thought }) + "\n"));
        }

        const response = await result.response;
        controller.enqueue(encoder.encode(JSON.stringify({ type: "done", usage: response.usageMetadata }) + "\n"));
      } catch (error: any) {
        console.error("Calorie AI Error:", error);
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
