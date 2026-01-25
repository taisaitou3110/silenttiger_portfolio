'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

function fileToGenerativePart(base64EncodedImage: string, mimeType: string) {
  return {
    inlineData: {
      data: base64EncodedImage,
      mimeType,
    },
  };
}

export async function getCalorieEstimation(
  base64Image: string,
  mimeType: string
) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables.');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

  const prompt = `あなたは「その100kcalを削り出せ」というスローガンのもと、ユーザーの減量を支援する管理栄養士です。
送られた食事写真から以下の情報を解析してください。

1. 料理名 (foodName)
2. 推定合計カロリー (calories)
3. カロリーの内訳 (breakdown)
4. 100kcalを削り出すための具体的なアドバイス (advice)
   例：「ご飯を二口分（約50g）残すと、ちょうど100kcal削れます」「揚げ物の衣を半分剥がすと効果的です」

出力は必ず以下のJSON形式のみで返してください。
{
  "foodName": "string",
  "calories": number,
  "breakdown": "string",
  "advice": "string"
}`;

  const imagePart = fileToGenerativePart(base64Image, mimeType);

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Gemini API might return Markdown or extra text, try to extract JSON
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    } else {
      // If no code block, try to parse directly
      return JSON.parse(text);
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to get calorie estimation from AI.');
  }
}
