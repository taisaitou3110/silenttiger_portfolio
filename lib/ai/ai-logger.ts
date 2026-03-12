// lib/ai/ai-logger.ts
import prisma from "@/lib/prisma";

/**
 * AIの利用ログをDBに保存する共通関数
 */
export async function saveAiLog(data: {

    
  appId: string;
  modelName: string;
  promptTokens: number;
  resultTokens: number;
  status: 'SUCCESS' | 'ERROR';
  errorMessage?: string;
  durationMs?: number;
}) {
  try {
    // DBへの書き込み実行
    await prisma.aiUsageLog.create({
      data: {
        appId: data.appId,
        environment: process.env.NODE_ENV || 'development',
        modelName: data.modelName,
        promptTokens: data.promptTokens,
        resultTokens: data.resultTokens,
        totalTokens: data.promptTokens + data.resultTokens,
        status: data.status,
        errorMessage: data.errorMessage,
        durationMs: data.durationMs,
        // createdAt はDB側でデフォルト設定されるので省略可
      },
    });
    console.log(`✅ [Log Saved] App: ${data.appId}, Tokens: ${data.promptTokens + data.resultTokens}`);
  } catch (error) {
    // ログ保存自体の失敗でメイン処理を止めたくないので、エラー表示のみに留める
    console.error("❌ AIログの保存に失敗しました:", error);
  }
}