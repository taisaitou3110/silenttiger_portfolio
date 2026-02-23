// app/calorie/voice/actions.ts
'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { saveMealLog } from '@/app/calorie/actions';
import prisma from '@/lib/prisma'; // Import prisma
import { AppError } from '@/lib/error'; // ✅ 追加
import { AI_CONFIG } from '@/constants/config'; // ✅ 追加

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function saveCalorieLogFromVoice(formData: FormData) {
  const transcribedText = formData.get('transcribedText') as string;

// 1. バリデーションの共通化
  if (!transcribedText) {
    throw new AppError("VALIDATION_VOICE_REQUIRED"); 
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new AppError("INFRA_DATABASE_ERROR", 500);
  }

  // --- CustomFood search logic ---
  const customFood = await prisma.customFood.findFirst({
    where: {
      name: transcribedText, // Simple exact match for now, can be improved with fuzzy matching
    },
  });

  if (customFood) {
    await saveMealLog({
      foodName: customFood.name,
      calories: customFood.calories,
      advice: 'カスタムマスタからカロリーを適用しました。',
      inputSource: 'voice',
    });
    return { success: true };
  }
  // --- End CustomFood search logic ---

  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_VOICE_MODEL || 'gemini-pro' });

  const prompt = `あなたは管理栄養士です。以下の音声入力（文字起こし）を解析し、料理名、推定合計カロリー、カロリーの内訳、そして100kcalを削り出すための具体的なアドバイスをJSON形式で返してください。

ユーザーはざっくりとした口語表現を使用します。「いつもの野菜炒めを半分」のような表現は、文脈から判断できる場合は対応してください。

不明な点があり、ユーザーに確認が必要な場合は、"clarificationNeeded": true とし、"clarificationQuestion" フィールドに具体的な質問を含めてください。この際、"foodName", "calories", "breakdown", "advice" は空または仮の値でも構いません。

入力: "${transcribedText}"

出力は必ず以下のJSON形式のみで返してください。
{
  "foodName": "string",
  "calories": number,
  "breakdown": "string",
  "advice": "string",
  "clarificationNeeded"?: boolean,
  "clarificationQuestion"?: string
}`;

try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 2. パース処理の共通化（スキャンの時と同じロジック）
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    const jsonString = jsonMatch ? jsonMatch[1] : text;
    
    let parsedData;
    try {
      parsedData = JSON.parse(jsonString);
    } catch (e) {
      throw new AppError("AI_RESPONSE_INVALID", 500);
    }

    if (parsedData.clarificationNeeded) {
      // 💡 ユーザーへの確認が必要な場合は、成功として返し、
      // フロントエンド側でこのフラグを見て質問を表示させるのがスムーズです
      return { 
        success: false, 
        clarificationNeeded: true, 
        clarificationQuestion: parsedData.clarificationQuestion 
      };
    }

    await saveMealLog({
      foodName: parsedData.foodName,
      calories: parsedData.calories,
      advice: parsedData.advice,
      inputSource: 'voice',
    });

    return { success: true };

  } catch (error: any) {
    // 3. エラーハンドリングの共通化
    if (error.code) throw error; // すでに投げた AppError はそのまま通す

    console.error('Voice Gemini Error:', error);

    if (error.status === 429) throw new AppError("AI_RATE_LIMIT", 429);
    
    // それ以外は保存失敗またはインフラエラー
    throw new AppError("DATA_SAVE_FAILED", 500);
  }
}