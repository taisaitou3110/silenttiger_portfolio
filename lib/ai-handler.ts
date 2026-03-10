import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export type AILevel = 'standard' | 'intensive' | 'distributed';

interface AIRetryOptions {
  level?: AILevel;
  taskType?: TaskType;
  title?: string;
  maxRetries?: number;
  isEmbedding?: boolean; // 埋め込み処理かどうかを明示
}

/**
 * 待機処理
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * AI処理・エラーハンドリング標準ユーティリティ
 */
export async function withAIRetry<T>(
  operation: (model: any) => Promise<T>,
  options: AIRetryOptions = {}
): Promise<T> {
  const {
    level = 'standard',
    maxRetries = parseInt(process.env.AI_MAX_RETRIES || "3"),
    isEmbedding = false
  } = options;

  // タスクの種類に応じてモデルリストを切り替える
  const envKey = isEmbedding ? "AI_EMBEDDING_MODEL_FALLBACK_LIST" : "AI_MODEL_FALLBACK_LIST";
  const defaultModels = isEmbedding ? "gemini-embedding-001" : "gemini-2.0-flash,gemini-flash-latest,gemini-pro-latest";
  
  const modelList = (process.env[envKey] || defaultModels).split(",");

  let lastError: any;

  for (const modelName of modelList) {
    const model = genAI.getGenerativeModel({ model: modelName.trim() });
    let retryCount = 0;

    while (retryCount <= maxRetries) {
      try {
        return await operation(model);
      } catch (error: any) {
        lastError = error;
        // 404 (Not Found) の場合はモデル名が間違っているか非対応なので、即座に次のモデルへ
        if (error.status === 404) {
          console.warn(`[AI Handler] Model ${modelName} not found or unsupported. Trying next...`);
          break; 
        }

        const status = error.status || (error.message?.includes("429") ? 429 : error.message?.includes("503") ? 503 : null);

        if (status === 429 || status === 503) {
          if (retryCount < maxRetries) {
            retryCount++;
            const baseTime = level === 'standard' ? 2000 : 5000;
            const waitTime = Math.pow(2, retryCount) * baseTime;
            console.warn(`[AI Handler] ${modelName} rate limited (${status}). Retry ${retryCount}/${maxRetries}...`);
            await sleep(waitTime);
            continue;
          } else {
            break; 
          }
        }
        throw error;
      }
    }
  }

  throw lastError || new Error("すべての利用可能なモデルで処理に失敗しました。");
}
