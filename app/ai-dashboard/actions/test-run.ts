// app/ai-dashboard/actions/test-run.ts
"use server";

import { runAiTask } from "@/lib/ai/ai-runner";
import { revalidatePath } from "next/cache";

export async function runTestAi() {
  try {
    // 12個のアプリのうち「wordbook」を想定して実行
    await runAiTask("wordbook", "「AI駆動開発」を30文字以内で一言で説明して。");
    
    // 画面のデータを最新にする
    revalidatePath("/ai-dashboard");
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}