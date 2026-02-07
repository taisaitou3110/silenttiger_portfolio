// app/calorie/text/actions.ts
'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { saveMealLog } from '@/app/calorie/actions';
import prisma from '@/lib/prisma'; // Import prisma

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function saveCalorieLogFromText(prevState: any, formData: FormData) {
  const foodDescription = formData.get('foodDescription') as string;

  if (!foodDescription) {
    return { success: false, error: '食事内容が入力されていません。' };
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables.');
  }

  // --- CustomFood search logic ---
  const customFood = await prisma.customFood.findFirst({
    where: {
      name: foodDescription, // Simple exact match for now, can be improved with fuzzy matching
    },
  });

  if (customFood) {
    await saveMealLog({
      foodName: customFood.name,
      calories: customFood.calories,
      advice: 'カスタムマスタからカロリーを適用しました。',
      inputSource: 'text',
    });
    return { success: true };
  }
  // --- End CustomFood search logic ---

  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_TEXT_MODEL || 'gemini-pro' });

  const prompt = `あなたは管理栄養士です。以下の食事内容のテキストを解析し、料理名、推定合計カロリー、カロリーの内訳、そして100kcalを削り出すための具体的なアドバイスをJSON形式で返してください。

もし料理名が複数ある場合は、主となる料理をfoodNameとし、その他の料理はbreakdownに含めてください。
不明な点があれば、具体的な質問をadviceに含めてください。
例：「サラダの種類は何でしたか？」

出力は必ず以下のJSON形式のみで返してください。
{
  "foodName": "string",
  "calories": number,
  "breakdown": "string",
  "advice": "string"
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

    await saveMealLog({
      foodName: parsedData.foodName,
      calories: parsedData.calories,
      advice: parsedData.advice,
      inputSource: 'text', // Indicate input source
    });

    return { success: true };
  } catch (error) {
    console.error('Error processing text input with Gemini:', error);
    return { success: false, error: 'テキスト入力の処理中にエラーが発生しました。' };
  }
}