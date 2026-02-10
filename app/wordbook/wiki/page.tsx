'use client';

import React, { useState } from 'react';
import { AppIcons } from '../../../components/AppIcons';
import { UI_TOKENS } from '../../../components/designToken';
import { WordCard } from '../../../components/WordCard';

/**
 * メインアプリケーション: Wikipedia風単語帳
 */
export default function WordbookWikiPage() {
  const [words, setWords] = useState([
    { id: 1, word: "Commemorative", definition: "記念の。記念物。a commemorative stamp（記念切手）などとして使われる。", level: 14 },
    { id: 2, word: "Diverse", definition: "種々の。多様な。十人十色（Diverse men, diverse minds）ということわざもある。", level: 5 },
  ]);

  const [search, setSearch] = useState("");

  const deleteWord = (id: number) => {
    setWords(words.filter(w => w.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ナビゲーション */}
      <nav className="bg-white/50 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <AppIcons.BookOpen className="text-indigo-600" />
            <span>Wordbook <span className="text-indigo-600">Standard</span></span>
          </div>
          <div className="relative">
            <AppIcons.Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="単語を検索..." 
              className="pl-10 pr-4 py-2 bg-slate-100 rounded-full text-sm border-none focus:ring-2 focus:ring-indigo-500 transition-all outline-none w-48 md:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </nav>

      <main className={UI_TOKENS.CONTAINER}>
        {/* ヘッダーエリア */}
        <header className="mb-12">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-1 bg-indigo-600 rounded-full" />
            <span className={UI_TOKENS.TEXT.CAPTION}>Knowledge Management</span>
          </div>
          <h1 className={UI_TOKENS.TEXT.H1}>Wikipedia風単語帳</h1>
          <p className={UI_TOKENS.TEXT.BODY}>
            標準化されたCSSトークンを使用することで、Apple製品のような一貫したデザインを維持します。
            「原因不明のズレ」を排除し、コンテンツの管理に集中しましょう。
          </p>
        </header>

        {/* 単語リスト一覧 */}
        <div className="grid grid-cols-1 gap-6">
          {words
            .filter(w => w.word.toLowerCase().includes(search.toLowerCase()))
            .map(w => (
              <WordCard 
                key={w.id} 
                {...w} 
                onDelete={() => deleteWord(w.id)} 
              />
            ))
          }
        </div>

        {/* アクションエリア */}
        <section className="mt-16 p-8 bg-indigo-900 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-10">
            <AppIcons.Info size={120} />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">新しい知恵を追加しましょう</h2>
            <p className="text-indigo-200 text-sm">AIアシスタントが、単語の定義や例文の入力をサポートします。</p>
          </div>
          <button className={`${UI_TOKENS.BUTTON.PRIMARY} bg-white text-indigo-900 hover:bg-indigo-50 relative z-10`}>
            単語を登録する
          </button>
        </section>
      </main>

      <footer className="py-12 text-center">
        <p className={UI_TOKENS.TEXT.CAPTION}>
          Design System v1.6.0 | Powered by Gemini Vibe Coding
        </p>
      </footer>
    </div>
  );
}
