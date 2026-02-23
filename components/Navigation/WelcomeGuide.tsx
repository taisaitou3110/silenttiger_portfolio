"use client";

import React from 'react';
import Image from 'next/image';
import { X } from 'lucide-react'; // 閉じるボタン用のアイコン

// 💡 第11章の標準に合わせた型定義
export interface GuideContent {
  title: string;
  overview: string;
  howTo: string[];
  techStack: string[];
  image?: string; // オプションのイラスト画像
}

interface WelcomeGuideProps {
  content: GuideContent;
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeGuide: React.FC<WelcomeGuideProps> = ({ content, isOpen, onClose }) => {
  // 開いていない時は何も表示しない
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {/* 💡 9.0章：正方形のウィンドウ (aspect-square) */}
      <div className="bg-white w-full max-w-md aspect-square rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* ヘッダー画像エリア（存在する場合） */}
        {content.image && (
          <div className="relative w-full h-40 shrink-0">
            <Image
              src={content.image}
              alt={content.title}
              fill
              className="object-cover"
            />
            {/* グラデーションオーバーレイ：下部の白背景に滑らかに繋げる */}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
            
            {/* 閉じるボタン（画像の上に重ねる） */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md z-10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ヘッダー（画像がない場合のフォールバック） */}
        {!content.image && (
          <header className="relative p-5 border-b bg-gray-50 flex items-center justify-center">
            <h2 className="font-bold text-xl text-gray-800">{content.title}</h2>
            <button 
              onClick={onClose}
              className="absolute right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </header>
        )}

        {/* スクロール可能なボディ */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {content.image && (
            <h2 className="font-bold text-xl text-gray-800 text-center mb-4">{content.title}</h2>
          )}
          
          <section>
            <h3 className="font-bold text-indigo-600 mb-2">概要</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {content.overview}
            </p>
          </section>

          <section>
            <h3 className="font-bold text-indigo-600 mb-2">使いかた</h3>
            <ul className="space-y-2">
              {content.howTo.map((item, index) => (
                <li key={index} className="flex gap-3 text-sm text-gray-600">
                  <span className="flex-shrink-0 w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-indigo-600 mb-2">技術構成</h3>
            <div className="flex flex-wrap gap-2">
              {content.techStack.map((tech) => (
                <span key={tech} className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                  {tech}
                </span>
              ))}
            </div>
          </section>
        </div>

        {/* フッター */}
        <footer className="p-5 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg transition-all active:scale-[0.98] shadow-lg shadow-indigo-200"
          >
            使いかたを理解した
          </button>
        </footer>
      </div>
    </div>
  );
};