import React from 'react';
import { getDashboardData } from "./actions";
import { getUserGoldData } from '@/lib/actions';
import WordbookDashboardClient from './_components/WordbookDashboardClient';

/**
 * 知識図鑑ダッシュボード (Wordbook Dashboard)
 * サーバーコンポーネントとして動作し、Prismaからデータを取得して
 * クライアントコンポーネントへ渡します。
 */
export default async function WordbookDashboard() {
  // サーバーサイドでデータを取得
  const data = await getDashboardData();
  const { gold } = await getUserGoldData();

  // インタラクションが必要な部分はクライアントコンポーネントへ委譲
  return <WordbookDashboardClient data={data} gold={gold} />;
}
