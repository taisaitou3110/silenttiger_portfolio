import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const { userId, pastArticles } = await req.json();

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
          systemInstruction: "あなたはプロの執筆スタイル・プロファイラーです。渡されたテキストから、著者の「文体の癖」を極めて詳細に抽出し、再現可能な『文体指示書』を作成してください。"
        });

        const prompt = `
          以下のテキスト（過去の記事やメモ）を深く分析し、著者の執筆スタイルを抽出してください。
          特に、独特の記号使い、改行のリズム、思考の飛躍、比喩の傾向に注目してください。

...

          1. 語彙とトーン: 宗教、哲学、科学、あるいはサブカルチャー（ゲーム等）をどう織り交ぜるか。
          2. 記号と視覚構造: 独自のセパレーター（例：ʕ•̫͡•...）や、強調、引用の使い方。
          3. 構成の癖: 体験談から抽象的な思考へどう繋げるか。メタ視点の（ ）書きの頻度。
          4. 結論の出し方: 結論を急ぐか、余韻を残すか。

        【出力形式】
        AI（Gemini）への「システム指示文（System Instruction）」として、そのままコピペして使える形式で出力してください。
        「あなたは〜というスタイルで書く作家です。特徴は...」という形式で、具体的かつ詳細に記述してください。
        解説は不要です。指示文のみを出力してください。
        
        分析対象テキスト：
        ${pastArticles}
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
        console.error("Analysis Streaming Error:", error);
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
