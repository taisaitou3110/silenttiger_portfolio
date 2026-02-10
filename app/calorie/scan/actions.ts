'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Jimp } from 'jimp';
import { MESSAGE_MASTER } from '@/components/MessageMst';

const MAX_BASE64_IMAGE_SIZE_BYTES = 3 * 1024 * 1024; // 3MB

async function processImage(base64EncodedImage: string, mimeType: string): Promise<string> {
  let pureBase64String = base64EncodedImage;
  if (base64EncodedImage.startsWith('data:')) {
    const parts = base64EncodedImage.split(',');
    if (parts.length < 2 || !parts[1]) {
      throw new Error(MESSAGE_MASTER.ERROR.INVALID_DATA_URI);
    }
    pureBase64String = parts[1];
  }

  if (!pureBase64String) {
    throw new Error(MESSAGE_MASTER.ERROR.EMPTY_BASE64_DATA);
  }

  const buffer = Buffer.from(pureBase64String, 'base64');
  const image = await Jimp.read(buffer);

  if (base64EncodedImage.length > MAX_BASE64_IMAGE_SIZE_BYTES) {
    const maxWidth = 1024;
    const maxHeight = 1024;
    image.scaleToFit({ w: maxWidth, h: maxHeight });
  }

  // ✅ 修正ポイント: 必ず await を追加する
  // Jimp v1.x では Promise を返すため、これがないと split でエラーになります
  const processedDataUri = await image.getBase64(mimeType as any, {
    quality: 80
  });
  
  const finalPureBase64 = processedDataUri.split(',')[1];

  if (!finalPureBase64) {
    throw new Error(MESSAGE_MASTER.ERROR.BASE64_EXTRACTION_FAILED);
  }
  
  return finalPureBase64;
}
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
    throw new Error(MESSAGE_MASTER.ERROR.API_KEY_MISSING);
  }

  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_VISION_MODEL || 'gemini-pro-vision' });

  // --- Add image processing and validation ---
  let processedBase64Image = base64Image;
  try {
    processedBase64Image = await processImage(base64Image, mimeType);
  } catch (error: any) { // Explicitly type error as any to access properties
    console.error("Image processing error:", error.message || error);
    throw new Error(MESSAGE_MASTER.ERROR.IMAGE_PROCESSING_ERROR);
  }

  // Final size check after processing
  if (processedBase64Image.length > MAX_BASE64_IMAGE_SIZE_BYTES) {
    throw new Error(MESSAGE_MASTER.ERROR.PAYLOAD_TOO_LARGE);
  }
  // --- End image processing and validation ---

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

  const imagePart = fileToGenerativePart(processedBase64Image, mimeType);

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
  } catch (error: any) {
    console.error("Gemini API Error:", error);

    // 無料枠の制限（429エラー）の場合
    if (error.status === 429 || error.message?.includes('429')) {
      throw new Error(MESSAGE_MASTER.ERROR.QUOTA_EXCEEDED);
    }

    // 画像サイズが大きすぎるエラー
    if (error.message?.includes('400') && error.message?.includes('Image size too large')) {
      throw new Error(MESSAGE_MASTER.ERROR.AUTO_RESIZE_FAILED);
    }

    // その他の一般的なエラー
    throw new Error(MESSAGE_MASTER.ERROR.DEFAULT);
  }
}

