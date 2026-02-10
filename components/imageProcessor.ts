"use server";

import { Jimp } from 'jimp';

/**
 * 画像処理・圧縮の共通定数
 */
const MAX_BASE64_IMAGE_SIZE_BYTES = 3 * 1024 * 1024; // 3MB（Vercelの制限4.5MBに対し安全マージンを確保）
const DEFAULT_MAX_DIMENSION = 1024; // 最大長辺

/**
 * 画像を解析・圧縮し、AIへの入力に適した純粋なBase64文字列を返します。
 * @param base64EncodedImage Data URI形式または純粋なBase64文字列
 * @param mimeType 画像のMIMEタイプ (image/jpeg, image/png等)
 * @returns 処理後の純粋なBase64文字列（Data URIスキップ済み）
 */
export async function processImageForAI(
  base64EncodedImage: string, 
  mimeType: string
): Promise<string> {
  let pureBase64String = base64EncodedImage;

  // 1. Data URIのプレフィックスを除去
  if (base64EncodedImage.startsWith('data:')) {
    const parts = base64EncodedImage.split(',');
    if (parts.length < 2 || !parts[1]) {
      throw new Error('Invalid Data URI format.');
    }
    pureBase64String = parts[1];
  }

  if (!pureBase64String) {
    throw new Error('Base64 data is empty.');
  }

  try {
    const buffer = Buffer.from(pureBase64String, 'base64');
    const image = await Jimp.read(buffer);

    // 2. サイズチェックとリサイズ
    // ファイルサイズが大きい、または解像度が高すぎる場合にリサイズ
    if (
      base64EncodedImage.length > MAX_BASE64_IMAGE_SIZE_BYTES || 
      image.width > DEFAULT_MAX_DIMENSION || 
      image.height > DEFAULT_MAX_DIMENSION
    ) {
      image.scaleToFit({ w: DEFAULT_MAX_DIMENSION, h: DEFAULT_MAX_DIMENSION });
    }

    // 3. 圧縮とBase64出力 (Jimp v1.x API)
    // Jimp v1.x では getBase64 は Promise を返します
    const processedDataUri = await image.getBase64(mimeType as any, {
      quality: 80
    });
    
    const finalPureBase64 = processedDataUri.split(',')[1];

    if (!finalPureBase64) {
      throw new Error('Failed to extract base64 from processed image.');
    }

    // 4. 最終サイズチェック
    if (finalPureBase64.length > MAX_BASE64_IMAGE_SIZE_BYTES) {
      throw new Error('Image remains too large after compression.');
    }
    
    return finalPureBase64;
  } catch (error: any) {
    console.error("Image processing core error:", error);
    throw new Error(`画像処理に失敗しました: ${error.message || 'Unknown error'}`);
  }
}