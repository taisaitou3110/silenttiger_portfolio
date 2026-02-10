/**
 * 【Next.js Dynamic Routing 仕様解説】
 * 1. フォルダ名を [id] とすることで、URLのその部分を変数として扱う「動的ルート」を定義。
 * 2. URL "/wordbook/list/clt123..." の ID部分が params.id として渡されます。
 * 3. 単語ごとに固有の情報をDBから取得し、1つのテンプレートで数千もの個別ページを生成します。
 * 4. 蓄積された複数の例文を時系列順に表示し、学習の履歴をWikipedia風に可視化します。
 * 5. サーバーサイドでデータ取得(getWordDetail)を行い、SEOとパフォーマンスを最適化しています。
 */

import React from 'react';
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWordDetail, getDashboardData } from "@/app/wordbook/actions";
import { GoldStatus } from "@/components/GoldStatus";

export default async function WordDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  // 単語詳細とユーザーデータ（ゴールド）を並列取得
  const [word, userData] = await Promise.all([
    getWordDetail(id),
    getDashboardData()
  ]);

  if (!word) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24 overflow-y-auto font-sans selection:bg-[#0cf] selection:text-black">
      {/* ナビゲーション & ゴールド表示 */}
      <nav className="mb-12 flex items-center justify-between">
        <Link 
          href="/wordbook/list" 
          className="group flex items-center text-[#0cf] text-[10px] font-mono tracking-[0.2em] hover:opacity-80 transition-all uppercase"
        >
          <span className="mr-2 transform group-hover:-translate-x-1 transition-transform">←</span>
          Return_to_Archives
        </Link>
        
        <GoldStatus amount={userData.gold} className="scale-90 origin-right" />
      </nav>

      {/* エンティティ・ヘッダー */}
      <section className="mb-16">
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 mb-6">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-none break-all">
            {word.term}
          </h1>
          <div className="flex flex-col items-end opacity-60">
            <span className="text-gray-400 font-mono text-sm tracking-widest italic">{word.phonetic || "/ No Phonetic /"}</span>
            <span className="text-[9px] text-gray-600 font-mono tracking-tighter uppercase">Node_ID: {word.id.substring(0, 8)}</span>
          </div>
        </div>
        
        <div className="h-[1px] w-full bg-gradient-to-r from-[#0cf] via-[#0cf]/20 to-transparent mb-10"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-[#0cf] text-[10px] font-mono tracking-[0.3em] uppercase opacity-50 font-bold">Core Definition</h3>
            <p className="text-3xl md:text-4xl font-bold leading-tight italic text-blue-50">
              「{word.meaning}」
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="p-5 bg-gray-900/30 border border-gray-800 rounded-3xl backdrop-blur-sm shadow-xl">
              <h4 className="text-[9px] text-gray-500 uppercase mb-3 font-mono tracking-[0.2em] font-bold">Knowledge Stats</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest font-bold">
                  <span className="text-gray-400">Retention</span>
                  <span className="text-[#0cf]">{Math.floor((word.accuracy || 0) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="bg-[#0cf] h-full transition-all duration-1000 ease-out shadow-[0_0_10px_#0cf]" 
                    style={{ width: `${(word.accuracy || 0) * 100}%` }}
                  ></div>
                </div>
                <div className="pt-2 flex justify-between items-center border-t border-gray-800/50">
                  <span className="text-[9px] text-gray-600 uppercase font-mono font-bold tracking-tighter">Review Interval</span>
                  <span className="text-xs text-gray-300 font-mono">{word.interval || 0} Days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 知識の蓄積（例文タイムライン） */}
      <section className="space-y-12">
        <div className="flex items-center gap-4">
          <h3 className="text-[#0cf] text-[10px] font-mono tracking-[0.3em] uppercase whitespace-nowrap font-bold">
            Accumulated Archives ({word.examples?.length || 0})
          </h3>
          <div className="h-[1px] flex-1 bg-gray-800"></div>
        </div>
        
        <div className="grid grid-cols-1 gap-14">
          {word.examples && word.examples.length > 0 ? (
            word.examples.map((ex: any, index: number) => (
              <div key={ex.id} className="group relative">
                {/* タイムライン装飾 */}
                <div className="absolute -left-6 top-0 bottom-0 w-[1px] bg-gray-800 group-hover:bg-[#0cf]/20 transition-colors"></div>
                <div className="absolute -left-[27px] top-2 w-3 h-3 bg-black border border-gray-700 group-hover:border-[#0cf] transition-colors rounded-full shadow-lg"></div>
                
                <div className="space-y-4">
                  <p className="text-xl md:text-2xl leading-relaxed font-medium text-gray-300 group-hover:text-white transition-all duration-300">
                    {ex.text}
                  </p>
                  
                  <div className="flex flex-wrap gap-3 items-center">
                    {ex.collocation && (
                      <span className="px-2 py-0.5 bg-gray-900 border border-gray-800 text-[#0cf] text-[10px] font-bold rounded uppercase tracking-widest">
                        Focus: {ex.collocation}
                      </span>
                    )}
                    <span className="text-[9px] text-gray-600 font-mono uppercase tracking-tighter opacity-60">
                      Logged: {new Date(ex.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-[9px] text-gray-700 font-mono uppercase tracking-tighter opacity-40 italic">
                      Revision_v{word.examples.length - index}.0
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600 italic text-sm font-mono uppercase tracking-widest">No examples recorded.</p>
          )}
        </div>
      </section>

      {/* 出会ったシーン（オリジン） */}
      {word.scene && (
        <section className="mt-24 pt-10 border-t border-gray-900">
          <div className="flex items-center gap-3 text-gray-600 mb-5">
            <div className="w-1 h-1 bg-[#0cf] rounded-full animate-pulse shadow-[0_0_5px_#0cf]"></div>
            <h4 className="text-[10px] font-mono tracking-[0.4em] uppercase font-bold">Origin Signal</h4>
          </div>
          <p className="text-xs text-gray-500 max-w-2xl leading-loose font-serif italic">
            "このノードは「<span className="text-gray-400 not-italic font-sans">{word.scene}</span>」の観測データより統合されました。"
          </p>
        </section>
      )}
      
      {/* 背景装飾 */}
      <div className="fixed top-0 right-0 -z-10 w-[600px] h-[600px] bg-[#0cf]/5 rounded-full blur-[120px] pointer-events-none"></div>
    </div>
  );
}