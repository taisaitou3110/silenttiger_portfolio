"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2, Info } from 'lucide-react';
import LoadingButton from '@/components/LoadingButton';
import { saveMealLog } from '@/app/calorie/actions';
import ErrorHandler from '@/components/ErrorHandler';
import MessageBox from '@/components/MessageBox';
import { AIProcessOverlay, AIMetrics } from '@/components/AI/AIProcessOverlay';

export default function CalorieTextPage() {
  const router = useRouter();
  const [text, setText] = useState('');
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

  const handleEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

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
      debug_log: 'Uplinking text...',
    });

    try {
      const response = await fetch('/api/ai/calorie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'text',
          data: text,
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
            console.error("Chunk Parse Error:", e, line);
            continue;
          }

          if (data.type === 'event' && data.data === 'first_chunk') {
            firstChunkTime = Date.now();
            const latency = (firstChunkTime - startTime) / 1000;
            setAiMetrics(prev => ({ 
              ...prev, 
              total_latency: latency,
              status: 'thinking',
              debug_log: 'Cognitive analysis...'
            }));
            thoughtStartTime = Date.now();
          }

          if (data.type === 'chunk') {
            if (data.thought) {
              fullThoughts += data.thought;
              setThoughtText(fullThoughts);
              const thinkingTime = (Date.now() - thoughtStartTime) / 1000;
              setAiMetrics(prev => ({ ...prev, thought_seconds: thinkingTime }));
            }

            if (data.text) {
              if (aiMetrics.status !== 'generating') {
                setAiMetrics(prev => ({ ...prev, status: 'generating', debug_log: 'Synthesizing...' }));
              }
              fullText += data.text;
              tokensGenerated += data.text.length * 0.75;
              const timeFromFirst = (Date.now() - firstChunkTime) / 1000;
              const tps = timeFromFirst > 0 ? tokensGenerated / timeFromFirst : 0;
              setAiMetrics(prev => ({ ...prev, current_tps: tps }));
            }
          }

          if (data.type === 'done') {
            setAiMetrics(prev => ({ 
              ...prev, 
              status: 'completed',
              input_tokens: data.usage?.promptTokenCount || 0,
              debug_log: 'Sync complete'
            }));

            const jsonMatch = fullText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("Result corrupted");
            setEstimation(JSON.parse(jsonMatch[0]));
          }

          if (data.type === 'error') {
            setAiMetrics(prev => ({ ...prev, status: 'error', debug_log: data.message }));
            return;
          }
        }
      }
    } catch (err: any) {
      console.error("Error during text estimation:", err);
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
        calories: estimation.calories,
        advice: estimation.advice,
        inputSource: 'text',
      });
      setSuccessMessage('食事の記録を保存しました！');
      setText('');
      setEstimation(null);
    } catch (err: any) {
      console.error("Error saving meal:", err);
      setError(err.message ? err : { message: 'DATA_SAVE_FAILED' });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <AIProcessOverlay metrics={aiMetrics} thoughtText={thoughtText} title="Text Cognition Link" modelName="Gemini 2.5 Flash" />
      
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href="/calorie" className="inline-flex items-center text-indigo-600 font-bold hover:underline mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          ポータルへ戻る
        </Link>

        <header>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">食事内容を入力</h1>
          <p className="text-slate-500 mt-2">食べたものをテキストで入力してください。AIがカロリーを推定します。</p>
        </header>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <form onSubmit={handleEstimate} className="space-y-6">
            <div>
              <label htmlFor="meal-text" className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-widest">Meal Description</label>
              <textarea
                id="meal-text"
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="例: 牛丼並盛りとサラダ、味噌汁を食べました。"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                disabled={loading}
              />
            </div>

            <LoadingButton
              type="submit"
              isLoading={loading}
              loadingText="AIが解析中..."
              disabled={!text.trim() || loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Send className="w-5 h-5" />
              推定を開始する
            </LoadingButton>
          </form>
        </div>

        {error && <ErrorHandler error={error} onClose={() => setError(null)} />}
        {successMessage && (
          <MessageBox status="success" title="完了" description={successMessage} onClose={() => setSuccessMessage(null)} />
        )}

        {estimation && (
          <div className="bg-white rounded-3xl shadow-lg border border-indigo-100 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 text-indigo-600 mb-6">
              <Info className="w-5 h-5" />
              <h2 className="text-xl font-bold">AI推定結果</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Food Name</p>
                  <p className="text-2xl font-black text-slate-900">{estimation.foodName}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Estimated Calories</p>
                  <p className="text-4xl font-black text-red-500">{estimation.calories} <span className="text-lg font-bold text-slate-400 ml-1">kcal</span></p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Breakdown</p>
                <p className="text-slate-700 leading-relaxed font-medium">{estimation.breakdown}</p>
              </div>
            </div>

            <div className="bg-indigo-50 rounded-2xl p-6 mb-8 border border-indigo-100">
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">AI Advice</p>
              <p className="text-indigo-900 font-bold leading-relaxed">{estimation.advice}</p>
            </div>

            <LoadingButton
              onClick={handleRegisterMeal}
              isLoading={isRegistering}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-emerald-200"
            >
              この内容で記録する
            </LoadingButton>
          </div>
        )}
      </div>
    </div>
  );
}
