'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Jimp } from 'jimp';
import { AppError } from '@/lib/error';
import { IMAGE_CONFIG, AI_CONFIG } from '@/constants/config';

async function processImage(base64EncodedImage: string, mimeType: string): Promise<string> {
  let pureBase64String = base64EncodedImage;
  
  if (base64EncodedImage.startsWith('data:')) {
    const parts = base64EncodedImage.split(',');
    if (parts.length < 2 || !parts[1]) {
      throw new AppError("VALIDATION_IMAGE_SIZE");
    }
    pureBase64String = parts[1];
  }

  if (!pureBase64String) {
    throw new AppError("VALIDATION_IMAGE_SIZE");
  }

  const buffer = Buffer.from(pureBase64String, 'base64');
  const image = await Jimp.read(buffer);

  // 定数を使用してリサイズ判定
  if (base64EncodedImage.length > IMAGE_CONFIG.MAX_FILE_SIZE_BYTES) {
    image.scaleToFit({ 
      w: IMAGE_CONFIG.MAX_DIMENSION, 
      h: IMAGE_CONFIG.MAX_DIMENSION 
    });
  }

  // Jimpでの処理（awaitを忘れずに）
  const processedDataUri = await image.getBase64(mimeType as any, {
    quality: IMAGE_CONFIG.QUALITY
  });
  
  const finalPureBase64 = processedDataUri.split(',')[1];

  if (!finalPureBase64) {
    throw new AppError("VALIDATION_IMAGE_SIZE");
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
    // APIキー欠損はシステムエラーとして扱う
    throw new AppError("INFRA_DATABASE_ERROR", 500);
  }

  const model = genAI.getGenerativeModel({ 
    model: process.env.GEMINI_VISION_MODEL || AI_CONFIG.DEFAULT_MODEL 
  });

  let processedBase64Image = base64Image;
  try {
    processedBase64Image = await processImage(base64Image, mimeType);
  } catch (error: any) {
    console.error("Image processing error:", error.message || error);
    throw new AppError("VALIDATION_IMAGE_SIZE");
  }

  // 最終チェック
  if (processedBase64Image.length > IMAGE_CONFIG.MAX_FILE_SIZE_BYTES) {
    throw new AppError("VALIDATION_IMAGE_SIZE");
  }

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

// ...（前半の画像処理部分はそのまま）

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // 1. JSONの抽出
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    const jsonString = jsonMatch ? jsonMatch[1] : text;

    try {
      // 2. パース（解析）を実行
      return JSON.parse(jsonString);
    } catch (parseError) {
      // 💡 AIがJSON以外の形式で返してきた場合
      console.error("AI Response Parsing Failed. Raw text:", text);
      throw new AppError("AI_RESPONSE_INVALID", 500); // 辞書に追加した専用コード
    }
    
  } catch (error: any) {
    // 💡 重要：すでに AppError（AI_RESPONSE_INVALID など）が投げられている場合は、
    // そのまま呼び出し元に伝えたいので、ここで再スローします。
    if (error.code) {
      throw error;
    }

    console.error("Gemini API Error:", error);

    // AIのクォータ制限（429）
    if (error.status === 429 || error.message?.includes('429')) {
      throw new AppError("AI_RATE_LIMIT", 429);
    }

    // ✅ その他、Geminiとの通信自体が失敗した場合は「インフラエラー」
    throw new AppError("INFRA_DATABASE_ERROR", 500);
  }
}