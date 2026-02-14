import React from 'react';
import Link from "next/link";
import { getWords, getDashboardData } from "@/app/wordbook/actions";
import { GoldStatus } from "@/components/GoldStatus";

/**
 * 知識図鑑 一覧画面 (Encyclopedia List)
 * - データベースに登録されたすべての単語（ノード）をアルファベット順に表示します。
 * - 各単語に蓄積された例文の数をカウントして表示します。
 */
export default async function WordListPage() {
  // 単語リストとダッシュボードデータ（ゴールド取得用）を並列で取得
  const [words, userData] = await Promise.all([
    getWords(),
    getDashboardData()
  ]);

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-20 overflow-y-auto font-sans">
      {/* ヘッダー：ダッシュボードへの戻りとゴールド表示 */}
      <header className="flex justify-between items-center mb-10">
        <Link 
          href="/wordbook" 
          className="text-gray-500 font-mono text-[10px] tracking-widest hover:text-[#0cf] transition-colors uppercase"
        >
          ← Dash_Board
        </Link>
        
        <GoldStatus amount={userData.gold} className="scale-90" />
      </header>

      {/* タイトルセクション */}
      <div className="mb-10">
        <h1 className="text-white font-black text-4xl tracking-tighter mb-2 uppercase italic">Encyclopedia</h1>
        <div className="flex items-center gap-2">
          <div className="h-1 w-12 bg-[#0cf] shadow-[0_0_10px_#0cf]"></div>
          <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-mono font-bold">
            Connected Nodes: {words.length}
          </p>
        </div>
      </div>

      {/* ノードリスト */}
      <div className="grid grid-cols-1 gap-4">
        {words.length > 0 ? (
          words.map((word) => (
            <Link 
              key={word.id} 
              href={`/wordbook/list/${word.id}`}
              className="group p-5 bg-gray-900/20 border border-gray-800 rounded-2xl flex justify-between items-center hover:border-[#0cf]/30 active:scale-[0.98] transition-all"
            >
              <div className="space-y-1">
                <h3 className="text-white font-bold text-xl group-hover:text-[#0cf] transition-colors uppercase tracking-tight">
                  {word.term}
                </h3>
                <p className="text-xs text-gray-500 truncate max-w-[200px] md:max-w-md">
                  {word.meaning}
                </p>
              </div>
              
              <div className="flex flex-col items-end gap-1">
                <span className="text-[9px] bg-gray-800/50 px-2 py-1 rounded text-gray-500 font-mono uppercase font-bold">
                  {word._count.examples} EXAMPLES
                </span>
                <div className="text-[9px] text-[#0cf]/40 font-mono tracking-tighter uppercase group-hover:text-[#0cf] transition-colors">
                  View_Node →
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-gray-900 rounded-3xl">
            <p className="text-gray-600 font-mono text-xs uppercase tracking-widest">No nodes discovered in this sector.</p>
          </div>
        )}
      </div>

      {/* 背景の装飾的なグラデーション */}
      <div className="fixed top-0 left-0 -z-10 w-full h-screen bg-[radial-gradient(circle_at_50%_0%,rgba(0,204,255,0.03)_0%,transparent_70%)] pointer-events-none"></div>
    </div>
  );
}