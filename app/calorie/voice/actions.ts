// app/calorie/voice/actions.ts
'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { saveMealLog } from '@/app/calorie/actions';
import prisma from '@/lib/prisma'; // Import prisma

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function saveCalorieLogFromVoice(formData: FormData) {
  const transcribedText = formData.get('transcribedText') as string;

  if (!transcribedText) {
    return { success: false, error: '音声入力がありません。' };
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables.');
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

    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    let parsedData;
    if (jsonMatch && jsonMatch[1]) {
      parsedData = JSON.parse(jsonMatch[1]);
    } else {
      parsedData = JSON.parse(text);
    }

    if (parsedData.clarificationNeeded) {
      return { success: false, clarificationNeeded: true, clarificationQuestion: parsedData.clarificationQuestion };
    }

    await saveMealLog({
      foodName: parsedData.foodName,
      calories: parsedData.calories,
      advice: parsedData.advice,
      inputSource: 'voice', // Indicate input source
    });

    return { success: true };
  } catch (error) {
    console.error('Error processing voice input with Gemini:', error);
    return { success: false, error: '音声入力の処理中にエラーが発生しました。' };
  }
}