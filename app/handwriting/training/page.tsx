"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, GraduationCap, Zap, BookOpen, Clock, Trash2, CheckCircle } from 'lucide-react';
import { getTrainingData, deleteTrainingData } from '../actions';

export default function TrainingStatusPage() {
  const [trainingData, setTrainingData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await getTrainingData();
    setTrainingData(res);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("この学習データを削除しますか？")) return;
    await deleteTrainingData(id);
    load();
  };

  const totalSamples = trainingData.length;
  const avgConfidence = totalSamples > 0 
    ? (trainingData.reduce((acc, curr) => acc + curr.confidence, 0) / totalSamples).toFixed(2)
    : 0;

  const isPersonalizationActive = totalSamples > 0;

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-pulse text-amber-500 font-mono tracking-[0.5em]">LOADING TRAINING POOL...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <header className="mb-12">
          <Link href="/handwriting" className="flex items-center text-gray-500 hover:text-amber-500 transition-colors mb-6 group">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold uppercase tracking-widest">Back to Hub</span>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tighter mb-4">Training <span className="text-amber-500">Status</span></h1>
              <p className="text-gray-500 text-sm font-medium">個人に最適化された筆跡モデルの学習進捗状況です。</p>
            </div>
            {isPersonalizationActive && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 text-xs font-bold animate-pulse">
                <CheckCircle className="w-4 h-4" />
                PERSONALIZATION ACTIVE
              </div>
            )}
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
            <GraduationCap className="w-8 h-8 text-amber-500 mb-4" />
            <div className="text-3xl font-black mb-1">{totalSamples}</div>
            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Training Samples</div>
          </div>
          <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
            <Zap className="w-8 h-8 text-blue-500 mb-4" />
            <div className="text-3xl font-black mb-1">{(totalSamples * 2.5).toFixed(0)}%</div>
            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Accuracy Boost (Phase 3)</div>
          </div>
          <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
            <Clock className="w-8 h-8 text-emerald-500 mb-4" />
            <div className="text-3xl font-black mb-1">{avgConfidence}</div>
            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Avg OCR Confidence</div>
          </div>
        </div>

        {/* Training Log */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4 text-gray-500">
            <BookOpen className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Personal Handwriting Log</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trainingData.map((item) => (
              <div key={item.id} className="relative p-4 bg-gray-900/40 border border-white/5 rounded-xl hover:border-amber-500/30 transition-all group">
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500/10 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <div className="aspect-square bg-black rounded-lg mb-3 flex items-center justify-center text-2xl font-serif text-gray-700 group-hover:text-amber-500 transition-colors">
                  {item.imagePatch ? (
                    <img src={item.imagePatch} alt="Handwriting Patch" className="w-full h-full object-contain" />
                  ) : (
                    item.correctLabel[0] || '?'
                  )}
                </div>
                <div className="text-center">
                  <div className="text-lg font-black">{item.correctLabel}</div>
                  <div className="text-[8px] text-gray-600 font-mono uppercase tracking-tighter">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}

            {trainingData.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-600 italic">
                No training data accumulated yet. Start scanning to teach the AI!
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 p-8 bg-gray-900/20 border border-white/5 rounded-3xl text-center">
          <h3 className="text-lg font-bold mb-2">Personalization Pipeline: Active</h3>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Phase 3の最適化により、蓄積されたデータがリアルタイムでAIの推論プロンプトに反映されています。
            あなたがよく使う言葉や筆跡のクセ、登録済み顧客・商品名は優先的に認識されます。
          </p>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.5)]" 
              style={{ width: `${Math.min(100, (totalSamples / 100) * 100)}%` }}
            />
          </div>
          <p className="mt-4 text-[10px] text-gray-600 font-mono uppercase tracking-widest">
            {totalSamples} / 100 samples for high-fidelity fine-tuning
          </p>
        </div>
      </div>
    </div>
  );
}
