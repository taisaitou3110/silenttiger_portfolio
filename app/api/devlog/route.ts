import { NextResponse } from "next/server";
import { getDevelopmentLogs } from "@/app/devlog/actions";
import { handleApiError } from "@/lib/error"; // Step 1 で作成したハンドラ

export async function GET() {
  try {
    const logs = await getDevelopmentLogs();
    return NextResponse.json(logs);
  } catch (error) {
    // 💡 個別の console.error やメッセージ指定を廃止し、共通ハンドラに任せる
    // 内部で自動的にログ出力され、適切な JSON (INFRA_DATABASE_ERROR 等) が返ります
    return handleApiError(error);
  }
}