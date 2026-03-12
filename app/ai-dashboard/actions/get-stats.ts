"use server";

import prisma from "@/lib/prisma";

export async function getAiStats() {
  try {
    // 1. モデルが存在するかチェック
    // @ts-ignore
    if (!prisma.aiUsageLog) {
      console.error("❌ PrismaClientに AiUsageLog モデルが見つかりません。");
      return [];
    }

    // 2. 統計データの集計
    const stats = await prisma.aiUsageLog.groupBy({
      by: ["appId"],
      _sum: {
        totalTokens: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          totalTokens: "desc",
        },
      },
    });

    /**
     * 単価計算ロジック:
     * Gemini 1.5 Flash の目安: $0.075 / 1M input tokens
     * 1ドル150円、1000トークン単位に換算
     */
    const YEN_PER_TOKEN = (0.000125 * 150) / 1000;

    // 3. 表示用にフォーマット
    return stats.map((s) => ({
      appId: s.appId,
      requestCount: s._count.id,
      totalTokens: s._sum.totalTokens || 0,
      estimatedCost: (s._sum.totalTokens || 0) * YEN_PER_TOKEN,
    }));
  } catch (error) {
    console.error("📊 統計データの取得に失敗しました:", error);
    // 開発初期でテーブルが空の場合などは空配列を返す
    return [];
  }
}