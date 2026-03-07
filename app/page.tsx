"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { GUIDE_CONTENTS, GUIDE_GROUPS } from '@/constants/guideContents';
import { ArrowRight, Menu, X } from 'lucide-react';

export default function GlobalPortal() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // グループごとにアプリを分類
  const appsByGroup = Object.entries(GUIDE_GROUPS).map(([groupId, groupTitle]) => {
    const apps = Object.values(GUIDE_CONTENTS).filter(
      (app) => app.group === groupId && !(app as any).hideFromPortal
    );
    return { groupId, groupTitle, apps };
  });

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="relative min-h-screen w-screen overflow-x-hidden bg-black text-white font-sans">
      {/* システム共通背景 (標準 9.1) */}
      <Image
        src="/images/toppage_wheel_labo.png"
        alt="Background"
        fill
        className="object-cover z-0 opacity-10"
        priority
      />

      {/* ナビゲーション（モバイル：ハンバーガー / デスクトップ：上部リンク） */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6 flex items-center justify-between pointer-events-none">
        {/* モバイルメニューボタン */}
        <button 
          onClick={toggleMenu}
          className="pointer-events-auto p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl hover:border-[#0cf]/50 transition-all group lg:hidden"
          aria-label="Toggle Menu"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 group-hover:text-[#0cf]" />}
        </button>

        {/* デスクトップ用ナビゲーション */}
        <div className="hidden lg:flex pointer-events-auto gap-8 bg-black/40 backdrop-blur-md px-8 py-4 rounded-full border border-white/10 mx-auto">
          {appsByGroup.map(({ groupId, groupTitle }) => (
            <a 
              key={groupId}
              href={`#${groupId}`}
              className="text-xs font-bold tracking-widest uppercase text-gray-400 hover:text-[#0cf] transition-colors"
            >
              {groupTitle}
            </a>
          ))}
        </div>
      </nav>

      {/* モバイルメニューオーバーレイ */}
      <div className={`fixed inset-0 z-40 bg-black/95 backdrop-blur-xl transition-all duration-500 lg:hidden ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {appsByGroup.map(({ groupId, groupTitle }) => (
            <a 
              key={groupId}
              href={`#${groupId}`}
              onClick={toggleMenu}
              className="text-2xl font-black tracking-tighter hover:text-[#0cf] transition-all transform hover:scale-110"
            >
              {groupTitle}
            </a>
          ))}
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 md:py-24">
        {/* ヘッダーエリア */}
        <header className="text-center mb-16 animate-in fade-in slide-in-from-top duration-1000">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 bg-gradient-to-r from-blue-400 via-[#0cf] to-indigo-400 bg-clip-text text-transparent">
            Wheel Reinvention Lab
          </h1>
          <p className="text-gray-400 md:text-xl font-medium tracking-widest uppercase">
            Application Gateway v2.0
          </p>
        </header>

        {/* グループ別コンテンツ */}
        <div className="space-y-32 max-w-7xl mx-auto">
          {appsByGroup.map(({ groupId, groupTitle, apps }, groupIndex) => (
            <section 
              id={groupId}
              key={groupId} 
              className="scroll-mt-32 animate-in fade-in slide-in-from-bottom duration-1000" 
              style={{ animationDelay: `${groupIndex * 200}ms` }}
            >
              {/* グループタイトル */}
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-xl md:text-2xl font-bold tracking-widest uppercase text-[#0cf]/60 whitespace-nowrap">
                  {groupTitle}
                </h2>
                <div className="h-[1px] w-full bg-gradient-to-r from-[#0cf]/20 to-transparent" />
              </div>

              {/* カード型グリッド (標準 9.1) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {apps.map((app) => (
                  <Link 
                    key={app.title} 
                    href={app.path || "/"}
                    className="group relative bg-gray-900/40 border border-white/10 rounded-3xl overflow-hidden hover:border-[#0cf]/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#0cf]/20 flex flex-col no-underline text-white"
                  >
                    {/* カード画像エリア */}
                    <div className="relative h-48 w-full overflow-hidden">
                      <Image
                        src={app.image || "/images/toppage_wheel_labo.png"}
                        alt={app.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                    </div>

                    {/* カードコンテンツ */}
                    <div className="p-8 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <h2 className="text-2xl font-bold group-hover:text-[#0cf] transition-colors">
                          {app.title}
                        </h2>
                        <ArrowRight className="w-6 h-6 text-white/20 group-hover:text-[#0cf] group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-[#0cf]/80 text-sm font-bold mb-4 tracking-tight">
                        {app.tagline}
                      </p>
                      <p className="text-gray-400 text-sm leading-relaxed flex-1">
                        {app.overview}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* フッター装飾 */}
        <footer className="mt-24 text-center opacity-30">
          <p className="text-xs font-mono tracking-[0.5em] uppercase">
            Universal Reinvention System
          </p>
        </footer>
      </div>
    </div>
  );
}
