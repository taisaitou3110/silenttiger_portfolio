"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mic, Square, Loader2, Info, Volume2 } from 'lucide-react';
import LoadingButton from '@/components/LoadingButton';
import { saveMealLog } from '@/app/calorie/actions';
import ErrorHandler from '@/components/ErrorHandler';
import MessageBox from '@/components/MessageBox';
import { AIProcessOverlay, AIMetrics } from '@/components/AI/AIProcessOverlay';

export default function CalorieVoicePage() {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [estimation, setEstimation] = useState<any>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [thoughtText, setThoughtText] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // メトリクス状態
  const [aiMetrics, setAiMetrics] = useState<AIMetrics>({
    input_tokens: 0,
    thought_seconds: 0,
    current_tps: 0,
    total_latency: 0,
    status: 'idle',
    debug_log: '',
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setEstimation(null);
      setError(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError({ message: 'MICROPHONE_ACCESS_DENIED' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleEstimate = async () => {
    if (!audioBlob) return;

    setLoading(true);
    setError(null);
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
      debug_log: 'Uplinking audio...',
    });

    try {
      const base64Audio = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => resolve(reader.result as string);
      });

      const response = await fetch('/api/ai/calorie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'voice',
          data: base64Audio,
          mimeType: audioBlob.type,
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
              debug_log: 'Transcribing & analyzing...'
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
                setAiMetrics(prev => ({ ...prev, status: 'generating', debug_log: 'Calculating...' }));
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
      console.error("Error during voice estimation:", err);
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
        inputSource: 'voice',
      });
      setSuccessMessage('食事の記録を保存しました！');
      setAudioBlob(null);
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
      <AIProcessOverlay metrics={aiMetrics} thoughtText={thoughtText} title="Audio Cognition Link" modelName="Gemini 2.5 Flash" />
      
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href="/calorie" className="inline-flex items-center text-indigo-600 font-bold hover:underline mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          ポータルへ戻る
        </Link>

        <header>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">音声で入力</h1>
          <p className="text-slate-500 mt-2">食べた内容を声に出して録音してください。AIが解析します。</p>
        </header>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center">
          {!audioBlob ? (
            <div className="space-y-8">
              <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-all duration-500 ${isRecording ? 'bg-red-500 animate-pulse scale-110 shadow-2xl shadow-red-200' : 'bg-indigo-600 shadow-xl shadow-indigo-100'}`}>
                {isRecording ? (
                  <button onClick={stopRecording} className="text-white"><Square className="w-12 h-12 fill-current" /></button>
                ) : (
                  <button onClick={startRecording} className="text-white"><Mic className="w-12 h-12" /></button>
                )}
              </div>
              <div>
                <p className={`text-xl font-bold ${isRecording ? 'text-red-500' : 'text-slate-700'}`}>
                  {isRecording ? '録音中...' : 'ボタンを押して録音開始'}
                </p>
                <p className="text-slate-400 text-sm mt-2">「今日のお昼はハンバーグとライスでした」のように話してください</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="w-32 h-32 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
                <Volume2 className="w-12 h-12 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-emerald-600">録音完了</p>
                <div className="flex gap-4 justify-center mt-6">
                  <button onClick={() => setAudioBlob(null)} className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">録り直す</button>
                  <LoadingButton
                    onClick={handleEstimate}
                    isLoading={loading}
                    loadingText="解析中..."
                    className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                  >
                    AIで解析する
                  </LoadingButton>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && <ErrorHandler error={error} onClose={() => setError(null)} />}
        {successMessage && (
          <MessageBox status="success" title="完了" description={successMessage} onClose={() => setSuccessMessage(null)} />
        )}

        {estimation && (
          <div className="bg-white rounded-3xl shadow-lg border border-indigo-100 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 text-indigo-600 mb-6">
              <Info className="w-5 h-5" />
              <h2 className="text-xl font-bold">音声解析結果</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Detected Food</p>
                  <p className="text-2xl font-black text-slate-900">{estimation.foodName}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Estimated Calories</p>
                  <p className="text-4xl font-black text-red-500">{estimation.calories} <span className="text-lg font-bold text-slate-400 ml-1">kcal</span></p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Details</p>
                <p className="text-slate-700 leading-relaxed font-medium">{estimation.breakdown}</p>
              </div>
            </div>

            <div className="bg-indigo-50 rounded-2xl p-6 mb-8 border border-indigo-100">
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Nutritional Advice</p>
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
