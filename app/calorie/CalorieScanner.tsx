"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload, Loader2, ChevronLeft, Image as ImageIcon, Sparkles } from 'lucide-react';
import LoadingButton from '@/components/LoadingButton';
import { saveMealLog } from '@/app/calorie/actions';
import ErrorHandler from '@/components/ErrorHandler';
import MessageBox from '@/components/MessageBox';
import { IMAGE_CONFIG } from '@/constants/config';
import { AIProcessOverlay, AIMetrics } from '@/components/AI/AIProcessOverlay';
import { processImage } from '@/components/imageProcessor';

export default function CalorieScanner({ mode = 'estimate' }: { mode?: 'estimate' | 'train' }) {
  const router = useRouter();
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [manualCalories, setManualCalories] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [estimation, setEstimation] = useState<any>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [thoughtText, setThoughtText] = useState('');

  // メトリクス状態
  const [aiMetrics, setAiMetrics] = useState<AIMetrics>({
    input_tokens: 0,
    thought_seconds: 0,
    current_tps: 0,
    total_latency: 0,
    status: 'idle',
    debug_log: '',
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(null);
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError({ message: 'VALIDATION_IMAGE_TYPE' });
        return;
      }

      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setEstimation(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      setError({ message: 'VALIDATION_IMAGE_REQUIRED' });
      return;
    }

    setLoading(true);
    setError(null);
    setEstimation(null);
    setThoughtText('');

    const startTime = Date.now();
    let firstChunkTime = 0;
    let thoughtStartTime = 0;
    let tokensGenerated = 0;
    let fullText = "";
    let fullThoughts = "";

    setAiMetrics({
      input_tokens: 0,
      thought_seconds: 0,
      current_tps: 0,
      total_latency: 0,
      status: 'transfer',
      debug_log: 'Optimizing image data...',
    });

    try {
      const processed = await processImage(image);
      const base64EncodedImage = processed.base64;

      if (processed.size > IMAGE_CONFIG.MAX_FILE_SIZE_BYTES) {
        throw new Error("VALIDATION_IMAGE_SIZE");
      }

      setAiMetrics(prev => ({ ...prev, debug_log: 'Uplinking visual data...' }));

      const response = await fetch('/api/ai/calorie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'image',
          data: base64EncodedImage,
          mimeType: "image/jpeg",
        }),
      });

      if (!response.ok) throw new Error('Analysis failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('ReadableStream error');
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.trim());

        for (const line of lines) {
          let data;
          try {
            data = JSON.parse(line);
          } catch (e) {
            continue;
          }

          if (data.type === 'event' && data.data === 'first_chunk') {
            firstChunkTime = Date.now();
            setAiMetrics(prev => ({ 
              ...prev, 
              total_latency: (firstChunkTime - startTime) / 1000,
              status: 'thinking',
              debug_log: 'Cognitive analysis...'
            }));
            thoughtStartTime = Date.now();
          }

          if (data.type === 'chunk') {
            if (data.thought) {
              fullThoughts += data.thought;
              setThoughtText(fullThoughts);
              setAiMetrics(prev => ({ ...prev, thought_seconds: (Date.now() - thoughtStartTime) / 1000 }));
            }

            if (data.text) {
              if (aiMetrics.status !== 'generating') {
                setAiMetrics(prev => ({ ...prev, status: 'generating', debug_log: 'Synthesizing...' }));
              }
              fullText += data.text;
              tokensGenerated += data.text.length * 0.75;
              const timeFromFirst = (Date.now() - firstChunkTime) / 1000;
              setAiMetrics(prev => ({ ...prev, current_tps: timeFromFirst > 0 ? tokensGenerated / timeFromFirst : 0 }));
            }
          }

          if (data.type === 'done') {
            setAiMetrics(prev => ({ 
              ...prev, 
              status: 'completed',
              input_tokens: data.usage?.promptTokenCount || 0,
              debug_log: 'Analysis sync complete'
            }));

            const jsonMatch = fullText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("Result corrupted");
            const result = JSON.parse(jsonMatch[0]);
            
            if (result.isFood === false) {
              setError({ message: result.error || "食べ物として認識できませんでした。" });
              setEstimation(null);
            } else {
              setEstimation(result);
            }
          }

          if (data.type === 'error') {
            setAiMetrics(prev => ({ ...prev, status: 'error', debug_log: data.message }));
            return;
          }
        }
      }
    } catch (err: any) {
      console.error("Estimation Error:", err);
      setAiMetrics(prev => ({ ...prev, status: 'error', debug_log: err.message }));
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterMeal = async () => {
    if (!estimation) return;
    setIsRegistering(true);
    setError(null);
    
    try {
      await saveMealLog({
        foodName: estimation.foodName,
        calories: mode === 'train' ? (manualCalories || estimation.calories) : estimation.calories,
        advice: estimation.advice,
        imagePath: imagePreview || undefined,
        inputSource: 'photo',
      });
      setSuccessMessage('食事の記録を保存しました！');
      setImage(null);
      setImagePreview(null);
      setEstimation(null);
      
      setTimeout(() => router.push('/calorie'), 1500);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#0cf]/30">
      <AIProcessOverlay metrics={aiMetrics} thoughtText={thoughtText} title="Nutritional Sync Link" modelName="Gemini 2.5 Flash" />
      
      <header className="mb-8 animate-in fade-in slide-in-from-top duration-700">
        <button onClick={() => router.back()} className="text-[#0cf] text-sm font-bold tracking-widest uppercase hover:opacity-80 transition-opacity flex items-center gap-2 mb-6">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-3xl font-black tracking-tighter">
          {mode === 'train' ? 'Train' : 'Scan'} <span className="text-[#0cf]">MEAL</span>
        </h1>
      </header>

      {successMessage && (
        <MessageBox
          status="success"
          title="SYNC COMPLETE"
          description={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Input Section */}
        <section className="space-y-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="relative group">
                <input id="file-upload" type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" accept="image/*" onChange={handleImageChange} disabled={loading} />
                <div className={`
                    relative aspect-video w-full border-2 border-dashed rounded-3xl flex flex-col items-center justify-center overflow-hidden transition-all duration-500
                    ${imagePreview ? 'border-[#0cf]/50 bg-gray-900/40' : 'border-white/10 bg-gray-900/20 hover:border-[#0cf]/30'}
                `}>
                    {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-contain animate-in fade-in zoom-in duration-500" />
                    ) : (
                        <div className="text-center p-8">
                            <div className="w-16 h-16 bg-[#0cf]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Camera className="w-8 h-8 text-[#0cf]" />
                            </div>
                            <p className="text-lg font-bold">MEAL PHOTO</p>
                            <p className="text-gray-500 text-xs">Capture or upload your meal</p>
                        </div>
                    )}
                    {loading && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-30">
                            <Loader2 className="w-10 h-10 text-[#0cf] animate-spin mb-2" />
                            <p className="text-[#0cf] text-[10px] font-mono tracking-widest animate-pulse">ANALYZING...</p>
                        </div>
                    )}
                </div>
            </div>

            {mode === 'train' && (
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                    <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Manual Calorie Entry (KCAL)</label>
                    <input 
                      type="number" 
                      value={manualCalories || ''} 
                      onChange={(e) => setManualCalories(Number(e.target.value))} 
                      className="w-full bg-black border border-white/10 rounded-xl p-4 text-xl font-black focus:border-[#0cf] outline-none transition-colors"
                      placeholder="0" 
                    />
                </div>
            )}

            <LoadingButton
              type="submit"
              className="w-full py-4 bg-[#0cf] hover:bg-[#0ef] text-black rounded-2xl font-black text-lg transition-all shadow-lg shadow-[#0cf]/20 disabled:opacity-50"
              isLoading={loading}
              loadingText="最適化中..."
              disabled={!image || loading}
            >
              {mode === 'train' ? 'START TRAINING SYNC' : 'START CALORIE ANALYSIS'}
            </LoadingButton>
          </form>

          {error && (<ErrorHandler error={error} onClose={() => setError(null)} />)}
        </section>

        {/* Estimation Section */}
        <section className="space-y-8 min-h-[400px]">
          {estimation ? (
            <div className="animate-in fade-in slide-in-from-right duration-500 space-y-8">
              <div className="p-8 bg-gray-900/40 border border-[#0cf]/30 rounded-[32px] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                    <Sparkles className="w-6 h-6 text-[#0cf] animate-pulse" />
                </div>
                <h2 className="text-[10px] font-mono text-[#0cf] uppercase tracking-widest mb-6">Estimation Result</h2>
                
                <div className="space-y-6">
                    <div>
                        <div className="text-4xl font-black tracking-tighter">{estimation.foodName}</div>
                        <div className="text-5xl font-black text-red-500 mt-2">{estimation.calories} <span className="text-sm text-gray-500 font-mono">KCAL</span></div>
                    </div>
                    
                    <div className="pt-6 border-t border-white/5">
                        <div className="text-xs font-bold text-gray-400 mb-2 uppercase">Breakdown</div>
                        <p className="text-sm leading-relaxed text-gray-300">{estimation.breakdown}</p>
                    </div>

                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                        <div className="text-[10px] font-mono text-emerald-500 uppercase mb-2">AI Advice</div>
                        <p className="text-sm text-emerald-100">{estimation.advice}</p>
                    </div>
                </div>
              </div>

              <LoadingButton
                onClick={handleRegisterMeal}
                className="w-full py-4 bg-[#0cf] hover:bg-[#0ef] text-black rounded-2xl font-black text-lg transition-all shadow-lg shadow-[#0cf]/20"
                isLoading={isRegistering}
                loadingText="登録中..."
              >
                COMMIT LOG TO DB
              </LoadingButton>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20 border-2 border-dashed border-white/10 rounded-[32px]">
                <ImageIcon className="w-16 h-16 mb-4" />
                <p className="font-mono text-[10px] uppercase tracking-widest">Awaiting Analysis...</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
