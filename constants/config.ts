// constants/config.ts
export const IMAGE_CONFIG = {
  MAX_FILE_SIZE_BYTES: 3 * 1024 * 1024, // 3MB
  BYTES_PER_MB: 1024 * 1024, // 💡 これを追加
  MAX_DIMENSION: 1024,                  // リサイズ時の最大縦横幅
  QUALITY: 80,                          // Jimpでの圧縮品質
} as const;

export const AI_CONFIG = {
  // モデル名が変更になった際もここを直すだけでOK
  DEFAULT_MODEL: 'gemini-1.5-flash', 
} as const;