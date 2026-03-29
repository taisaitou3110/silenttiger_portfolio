import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";
import { saveAiLog } from "./ai/ai-logger";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export type AILevel = 'standard' | 'intensive' | 'distributed';

interface AIRetryOptions {
  appId?: string; // どのアプリからのリクエストか（ログ用）
  level?: AILevel;
  taskType?: TaskType;
  title?: string;
  maxRetries?: number;
  isEmbedding?: boolean; // 埋め込み処理かどうかを明示
  modelOverride?: string; // 指定されたモデルのみを使用する場合
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
    appId = 'unknown',
    level = 'standard',
    maxRetries = parseInt(process.env.AI_MAX_RETRIES || "3"),
    isEmbedding = false
  } = options;

  // タスクの種類に応じてモデルリストを切り替える
  const envKey = isEmbedding ? "AI_EMBEDDING_MODEL_FALLBACK_LIST" : "AI_MODEL_FALLBACK_LIST";
  const defaultModels = isEmbedding ? "gemini-embedding-001" : "gemini-2.0-flash,gemini-flash-latest,gemini-1.5-flash-latest,gemini-pro-latest";
  
  const modelList = options.modelOverride 
    ? [options.modelOverride] 
    : (process.env[envKey] || defaultModels).split(",");

  let lastError: any;
  const startTime = Date.now();

  for (const modelName of modelList) {
    const model = genAI.getGenerativeModel({ model: modelName.trim() });
    let retryCount = 0;

    while (retryCount <= maxRetries) {
      try {
        const result = await operation(model);
        
        // 成功ログの保存（レスポンスからトークン情報を抽出できる場合のみ）
        // 型チェックを行い、可能な限り自動でログを保存する
        if (result && typeof result === 'object' && 'response' in result) {
          try {
            const response = (result as any).response;
            const usage = response.usageMetadata;
            if (usage) {
              await saveAiLog({
                appId,
                modelName: modelName.trim(),
                promptTokens: usage.promptTokenCount || 0,
                resultTokens: usage.candidatesTokenCount || 0,
                status: 'SUCCESS',
                durationMs: Date.now() - startTime,
              });
            }
          } catch (logErr) {
            console.warn("[AI Handler] Failed to auto-log usage:", logErr);
          }
        }

        return result;
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
        
        // 致命的なエラー時もログを保存
        await saveAiLog({
          appId,
          modelName: modelName.trim(),
          promptTokens: 0,
          resultTokens: 0,
          status: 'ERROR',
          errorMessage: error.message,
          durationMs: Date.now() - startTime,
        });

        throw error;
      }
    }
  }

  throw lastError || new Error("すべての利用可能なモデルで処理に失敗しました。");
}
