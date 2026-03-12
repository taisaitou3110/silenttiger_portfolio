// lib/ai/ai-runner.ts
import { getSystemInstruction } from "./ai-loader";
import { saveAiLog } from "./ai-logger";
import { withAIRetry } from "../ai-handler";

export async function runAiTask(appId: string, userPrompt: string) {
  const startTime = Date.now();

  try {
    // 1. 設定ファイル（base + app専用）を自動ロード
    const systemInstruction = getSystemInstruction(appId);

    // 2. AI実行（withAIRetryを使用してモデルの切り替えやリトライを自動化）
    const responseText = await withAIRetry(async (model) => {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        systemInstruction: systemInstruction,
      });
      const response = await result.response;
      
      // トークン使用量の抽出
      const usage = response.usageMetadata;
      const promptTokens = usage?.promptTokenCount || 0;
      const resultTokens = usage?.candidatesTokenCount || 0;

      // 成功ログの保存
      await saveAiLog({
        appId,
        modelName: model.model.replace("models/", ""), 
        promptTokens,
        resultTokens,
        status: 'SUCCESS',
        durationMs: Date.now() - startTime,
      });

      return response.text();
    }, {
      title: `AI Task: ${appId}`
    });

    return responseText;

  } catch (error: any) {
    // 3. 失敗ログの保存
    console.error(`[${appId}] AI最終エラー:`, error.message);
    
    await saveAiLog({
      appId,
      modelName: "unknown",
      promptTokens: 0,
      resultTokens: 0,
      status: 'ERROR',
      errorMessage: error.message,
      durationMs: Date.now() - startTime,
    });

    throw error;
  }
}