// lib/ai/ai-runner.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSystemInstruction } from "./ai-loader";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function runAiTask(appId: string, userPrompt: string) {
  // 1. アプリIDに基づいた指示を自動取得
  const systemInstruction = getSystemInstruction(appId);

  // 2. モデルの初期化 (ここで指示が注入される)
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash", // 必要に応じて切り替え
    systemInstruction: systemInstruction,
  });

  // 3. 実行（ここにリトライ処理やログ保存を追加していく）
  const result = await model.generateContent(userPrompt);
  
  // 今後のステップでここに「消費トークンの保存」などを追加
  console.log(`[${appId}] AI実行完了`); 
  
  return result.response.text();
}