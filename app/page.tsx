"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { GUIDE_CONTENTS } from '@/constants/guideContents';
import { ArrowRight } from 'lucide-react';

export default function GlobalPortal() {
  const apps = Object.values(GUIDE_CONTENTS);

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

        {/* カード型グリッド (標準 9.1) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {apps.map((app, index) => (
            <div 
              key={app.title} 
              className="group relative bg-gray-900/40 border border-white/10 rounded-3xl overflow-hidden hover:border-[#0cf]/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#0cf]/20 flex flex-col"
              style={{ animationDelay: `${index * 100}ms` }}
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
                <h2 className="text-2xl font-bold mb-2 group-hover:text-[#0cf] transition-colors">
                  {app.title}
                </h2>
                <p className="text-[#0cf]/80 text-sm font-bold mb-4 tracking-tight">
                  {app.tagline}
                </p>
                <p className="text-gray-400 text-sm leading-relaxed mb-8 flex-1">
                  {app.overview}
                </p>

                {/* OPEN ボタン */}
                <Link 
                  href={app.path || "/"} 
                  className="inline-flex items-center justify-center gap-2 w-full py-4 bg-white/5 hover:bg-[#0cf] text-white rounded-2xl font-bold transition-all duration-300 group/btn border border-white/10 hover:border-[#0cf] hover:shadow-lg hover:shadow-[#0cf]/40"
                >
                  OPEN APP
                  <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </div>
            </div>
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
