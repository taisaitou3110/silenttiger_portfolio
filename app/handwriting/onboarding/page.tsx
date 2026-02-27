"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Camera, CheckCircle2, AlertCircle, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { getTrainingTemplates, updateProfileTrainingLevel, analyzeHandwriting, saveHandwritingData } from '../actions';

export default function TrainingOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profileId = searchParams.get('profileId');

  const [templates, setTemplates] = useState<any[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [correction, setCorrection] = useState("");
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) {
      router.push('/handwriting');
      return;
    }
    async function load() {
      const res = await getTrainingTemplates();
      setTemplates(res);
      setLoading(false);
    }
    load();
  }, [profileId, router]);

  const currentTemplate = templates[currentStepIdx];

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImage(base64);
      
      // Phase 5: 即時フィードバック
      setAnalyzing(true);
      try {
        const result = await analyzeHandwriting(base64, file.type, 'general', profileId!);
        setFeedback(`AI解析結果: "${result.rawText.slice(0, 30)}..." 
あなたの筆跡は「${result.rawText.length > 5 ? '連筆が強い' : '一画一画が明瞭'}」な傾向があります。`);
        setCorrection(result.rawText);
      } catch (err) {
        console.error(err);
        setFeedback("解析に失敗しましたが、学習用データとして保存できます。");
      }
      setAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleCompleteStep = async () => {
    if (!image || !profileId) return;
    
    // 学習データの保存
    await saveHandwritingData('general', { rawText: correction }, [{
      correctLabel: correction,
      confidence: 0.9,
      imagePatch: image
    }], profileId);

    const newCompleted = [...completedSteps, currentTemplate.step];
    setCompletedSteps(newCompleted);
    
    // プロファイルの進捗更新
    await updateProfileTrainingLevel(profileId, currentTemplate.step);

    if (currentStepIdx < templates.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
      setImage(null);
      setFeedback(null);
      setCorrection("");
    } else {
      router.push('/handwriting');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#0cf] animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <header className="mb-12">
          <Link href="/handwriting" className="flex items-center text-gray-500 hover:text-[#0cf] transition-colors mb-6 group">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold uppercase tracking-widest">Quit Training</span>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="px-3 py-1 bg-[#0cf]/10 border border-[#0cf]/20 rounded-full text-[#0cf] text-[10px] font-black tracking-widest uppercase">
              Step {currentStepIdx + 1} / 5
            </div>
            <h1 className="text-2xl font-black tracking-tighter">{currentTemplate.category}</h1>
          </div>
          <p className="text-gray-400 text-sm">{currentTemplate.description}</p>
        </header>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-12">
          {templates.map((t, idx) => (
            <div 
              key={t.id} 
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${idx <= currentStepIdx ? 'bg-[#0cf] shadow-[0_0_8px_#0cf]' : 'bg-gray-800'}`} 
            />
          ))}
        </div>

        {/* Main Interface */}
        <div className="space-y-8">
          {/* お手本表示 */}
          <div className="p-8 bg-gray-900/40 border border-white/10 rounded-3xl text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0cf]/30 to-transparent" />
            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.3em] mb-4">Target Text to Write</div>
            <div className="text-3xl md:text-4xl font-serif tracking-widest leading-relaxed text-gray-200 group-hover:text-white transition-colors">
              {currentTemplate.targetText}
            </div>
          </div>

          {!image ? (
            <label className="block p-12 bg-white/5 border-2 border-dashed border-white/10 rounded-3xl hover:border-[#0cf]/50 hover:bg-[#0cf]/5 transition-all cursor-pointer text-center group">
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCapture} />
              <Camera className="w-12 h-12 text-gray-600 group-hover:text-[#0cf] mx-auto mb-4 transition-colors" />
              <p className="text-gray-400 font-bold group-hover:text-white transition-colors">紙に書いて撮影してください</p>
              <p className="text-[10px] text-gray-600 uppercase mt-2">Tap to open Camera or Upload</p>
            </label>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="aspect-video bg-gray-900 rounded-3xl overflow-hidden border border-white/10 relative">
                <img src={image} alt="Captured" className="w-full h-full object-contain" />
                {analyzing && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-8 h-8 text-[#0cf] animate-spin" />
                      <div className="text-[10px] font-mono uppercase tracking-widest text-[#0cf]">AI analyzing strokes...</div>
                    </div>
                  </div>
                )}
              </div>

              {feedback && (
                <div className="p-6 bg-[#0cf]/5 border border-[#0cf]/20 rounded-2xl space-y-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-[#0cf] shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-[#0cf] mb-1">Instant Feedback</h4>
                      <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">{feedback}</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-white/5">
                    <label className="text-[10px] text-gray-500 font-mono uppercase block mb-2">Re-Learning (Is this correct?)</label>
                    <input 
                      value={correction}
                      onChange={(e) => setCorrection(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm focus:border-[#0cf] outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button 
                  onClick={() => setImage(null)}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-gray-400 font-bold rounded-2xl transition-all"
                >
                  RE-TAKE
                </button>
                <button 
                  onClick={handleCompleteStep}
                  disabled={analyzing}
                  className="flex-[2] py-4 bg-[#0cf] hover:bg-[#0ef] text-black font-black rounded-2xl transition-all shadow-lg shadow-[#0cf]/20 flex items-center justify-center gap-2"
                >
                  NEXT STEP <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 flex items-center gap-4 p-4 bg-gray-900/20 rounded-2xl border border-white/5">
           <AlertCircle className="w-5 h-5 text-gray-600 shrink-0" />
           <p className="text-[10px] text-gray-500 leading-tight">
             トレーニング中に収集されたデータは、あなた専用の筆跡プロファイル ${profileId.slice(0, 8)} の精度向上にのみ使用されます。
           </p>
        </div>
      </div>
    </div>
  );
}
