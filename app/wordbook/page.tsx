import React from 'react';
import { getDashboardData } from "./actions";
import { getUserGoldData } from '@/lib/actions';
import WordbookDashboardClient from './_components/WordbookDashboardClient';

export const dynamic = 'force-dynamic';

/**
 * 知識図鑑ダッシュボード (Wordbook Dashboard)
 * サーバーコンポーネントとして動作し、Prismaからデータを取得して
 * クライアントコンポーネントへ渡します。
 */
export default async function WordbookDashboard() {
  let data = { totalWords: 0, reviewPending: 0, averageAccuracy: 0, sceneDistribution: [] };
  let gold = 0;

  try {
    // サーバーサイドでデータを取得
    data = await getDashboardData();
    const goldData = await getUserGoldData();
    gold = goldData.gold;
  } catch (error) {
    console.error("❌ 単語帳データの取得に失敗しました:", error);
  }

  // インタラクションが必要な部分はクライアントコンポーネントへ委譲
  return <WordbookDashboardClient data={data} gold={gold} />;
}
