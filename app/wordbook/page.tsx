import React from 'react';
import Link from "next/link";
import Image from 'next/image'; // Import Image
import { getDashboardData } from "./actions";

/**
 * 知識図鑑ダッシュボード (Wordbook Dashboard)
 * サーバーコンポーネントとして動作し、Prismaから取得した統計データと
 * 共通のゴールド表示コンポーネントを描画します。
 */
export default async function WordbookDashboard() {
  // サーバーアクションから最新の統計データを取得
  const data = await getDashboardData();

  return (
    <div className="relative flex flex-col h-screen text-white overflow-hidden touch-none overscroll-behavior-none font-sans">
      <Image
        src="/images/image_background_wordbook.png"
        alt="Wordbook Background"
        layout="fill"
        objectFit="cover"
        className="z-0"
        priority
      />
      {/* 共通ヘッダー：プロジェクト共通の GoldStatus コンポーネントを使用 */}
      <header className="relative z-10 p-5 flex justify-between items-center border-b border-gray-800 bg-gray-900/20">
        <div>
          <h1 className="text-[#0cf] font-mono font-bold text-lg tracking-tighter uppercase">Knowledge Cosmos</h1>
          <p className="text-[9px] text-gray-500 uppercase tracking-widest">Memory OS v1.0</p>
        </div>
        

      </header>

      {/* メインコンテンツエリア */}
      <main className="relative z-10 flex-1 p-5 flex flex-col max-w-md mx-auto w-full gap-4 overflow-y-auto">
        
        {/* 統計サマリーカード */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-gradient-to-br from-gray-900 to-black border border-red-900/40 rounded-2xl">
            <p className="text-red-500 text-[9px] font-bold mb-1 uppercase tracking-wider font-mono">Review Required</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">{data.reviewCount}</span>
              <span className="text-gray-600 text-[10px] font-mono">nodes</span>
            </div>
          </div>

          <div className="p-4 bg-gray-900/30 border border-gray-800 rounded-2xl">
            <p className="text-gray-500 text-[9px] uppercase tracking-wider font-mono">Total Network</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-[#0cf]">{data.totalWords}</span>
              <span className="text-gray-600 text-[10px] font-mono">words</span>
            </div>
          </div>
        </div>

        {/* 2x2 メインメニュー */}
        <div className="grid grid-cols-2 gap-3">
          {/* AI相談 */}
          <Link href="/wordbook/new" className="h-24 bg-[#0cf]/70 border border-[#0cf]/80 rounded-2xl flex items-center p-4 gap-3 active:scale-[0.97] transition-all group">
            <div className="text-2xl bg-[#0cf]/10 w-12 h-12 flex items-center justify-center rounded-xl group-hover:bg-[#0cf]/20 transition-colors">✍️</div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-sm text-white">単語登録</span>
              <span className="text-[9px] text-gray-500 font-mono">NEW NODE</span>
            </div>
          </Link>

          {/* 一括読込 */}
          <Link href="/wordbook/import" className="h-24 bg-gray-900/40 border border-gray-800 rounded-2xl flex items-center p-4 gap-3 active:scale-[0.97] transition-all">
            <div className="text-2xl bg-gray-800 w-12 h-12 flex items-center justify-center rounded-xl">📄</div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-sm text-white">一括読込</span>
              <span className="text-[9px] text-gray-500 font-mono">BULK</span>
            </div>
          </Link>

          {/* 救出作戦 (クイズ) */}
          <Link href="/wordbook/quiz" className="h-24 bg-red-900/70 border border-red-900/80 rounded-2xl flex items-center p-4 gap-3 active:scale-[0.97] transition-all">
            <div className="text-2xl bg-red-900/20 w-12 h-12 flex items-center justify-center rounded-xl animate-pulse text-red-500">⚡</div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-sm text-red-400">本日の学習</span>
              <span className="text-[9px] text-red-900/40 font-mono uppercase tracking-tighter font-bold">Mission</span>
            </div>
          </Link>

          {/* 知識図鑑 (一覧) */}
          <Link href="/wordbook/list" className="h-24 bg-gray-900/40 border border-gray-800 rounded-2xl flex items-center p-4 gap-3 active:scale-[0.97] transition-all text-white">
            <div className="text-2xl bg-gray-800 w-12 h-12 flex items-center justify-center rounded-xl">📚</div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-sm">登録単語リスト</span>
              <span className="text-[9px] text-gray-500 font-mono uppercase tracking-tighter font-bold tracking-widest text-gray-400">Encyclopedia</span>
            </div>
          </Link>
        </div>

        {/* 下部：システムステータス表示 */}
        <div className="mt-auto p-4 bg-gray-900/20 border border-gray-800 rounded-2xl flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest font-mono">Cosmos Status</span>
            <span className="text-[10px] text-gray-600 font-mono">Synchronization complete</span>
          </div>
          <div className="w-2 h-2 bg-[#0cf]/50 rounded-full animate-pulse shadow-[0_0_8px_#0cf]"></div>
        </div>
      </main>

      {/* フッター装飾 */}
      <footer className="p-4 text-center opacity-30">
        <p className="text-[8px] text-gray-800 font-mono tracking-[0.5em] uppercase">
          Neural Knowledge Network v1.0
        </p>
      </footer>
    </div>
  );
}