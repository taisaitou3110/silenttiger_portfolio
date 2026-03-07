"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ChevronLeft, 
  Send, 
  Loader2, 
  Info, 
  Type, 
  Zap, 
  Sparkles, 
  Mic, 
  Square, 
  Volume2,
  MessageSquare,
  Terminal
} from 'lucide-react';
import LoadingButton from '@/components/LoadingButton';
import { saveMealLog } from '@/app/calorie/actions';
import ErrorHandler from '@/components/ErrorHandler';
import MessageBox from '@/components/MessageBox';
import { AIProcessOverlay, AIMetrics } from '@/components/AI/AIProcessOverlay';

export default function CalorieSmartInputPage() {
  const router = useRouter();
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  
  // テキストモード用
  const [text, setText] = useState('');
  
  // ボイスモード用
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  // 共通状態
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

  const addLog = (msg: string) => {
    console.log(`[VoiceDebug] ${msg}`);
    setDebugLogs(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  // --- 音声録音ロジック ---
  const startRecording = async () => {
    addLog("Attempting to start recording...");
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        addLog("Error: getUserMedia not supported in this browser");
        throw new Error("お使いのブラウザは音声録音に対応していません。");
      }

      addLog("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      addLog("Microphone access granted.");

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
            addLog(`Data available: ${e.data.size} bytes`);
            chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        addLog("MediaRecorder stopped. Generating blob...");
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        addLog(`Blob generated: ${blob.size} bytes`);
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      addLog("MediaRecorder started.");
      setIsRecording(true);
      setError(null);
      setEstimation(null);
    } catch (err: any) {
      addLog(`Error in startRecording: ${err.message || err}`);
      setError({ message: err.message || "マイクへのアクセスが拒否されました。" });
    }
  };

  const stopRecording = () => {
    addLog("Stopping recording...");
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => {
          track.stop();
          addLog(`Track ${track.label} stopped.`);
      });
      addLog("Recording finalized.");
    } else {
        addLog("MediaRecorder not active.");
    }
  };

  // --- 解析実行ロジック (共通) ---
  const handleEstimate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (inputMode === 'text' && !text.trim()) return;
    if (inputMode === 'voice' && !audioBlob) return;

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
      debug_log: `Uplinking ${inputMode} data...`,
    });

    try {
      let bodyData: any = { type: inputMode };
      
      if (inputMode === 'text') {
        bodyData.data = text;
      } else {
        const reader = new FileReader();
        const base64Audio = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(audioBlob!);
        });
        bodyData.data = base64Audio;
        bodyData.mimeType = 'audio/webm';
      }

      const response = await fetch('/api/ai/calorie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      if (!response.ok) throw new Error('Analysis failed');

      const bodyReader = response.body?.getReader();
      if (!bodyReader) throw new Error('ReadableStream error');
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await bodyReader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.trim());

        for (const line of lines) {
          let data;
          try { data = JSON.parse(line); } catch (e) { continue; }

          if (data.type === 'event' && data.data === 'first_chunk') {
            firstChunkTime = Date.now();
            setAiMetrics(prev => ({ 
              ...prev, 
              total_latency: (firstChunkTime - startTime) / 1000,
              status: 'thinking',
              debug_log: inputMode === 'voice' ? 'Transcribing & Analyzing...' : 'Cognitive analysis...'
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
              setError({ message: result.error || "食事に関する内容として認識できませんでした。" });
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
        calories: estimation.calories,
        advice: estimation.advice,
        inputSource: inputMode,
      });
      setSuccessMessage('食事の記録を保存しました！');
      if (inputMode === 'text') setText('');
      if (inputMode === 'voice') setAudioBlob(null);
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
      <AIProcessOverlay metrics={aiMetrics} thoughtText={thoughtText} title="Smart Nutrition Link" modelName="Gemini 2.5 Flash" />
      
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-12">
        <header className="animate-in fade-in slide-in-from-top duration-700">
          <button onClick={() => router.back()} className="text-[#0cf] text-sm font-bold tracking-widest uppercase hover:opacity-80 transition-opacity flex items-center gap-2 mb-6">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tighter">
                Smart <span className="text-[#0cf]">INPUT</span> Mode
              </h1>
              <p className="text-gray-400 mt-2">自然言語または音声解析により、食事内容を特定します。</p>
            </div>

            <div className="flex bg-gray-900/60 p-1 rounded-xl border border-white/5">
                <button 
                  onClick={() => { setInputMode('text'); setEstimation(null); }}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${inputMode === 'text' ? 'bg-[#0cf] text-black shadow-[0_0_10px_#0cf]' : 'text-gray-500 hover:text-white'}`}
                >
                    <Type className="w-3 h-3" /> TEXT
                </button>
                <button 
                  onClick={() => { setInputMode('voice'); setEstimation(null); }}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${inputMode === 'voice' ? 'bg-[#0cf] text-black shadow-[0_0_10px_#0cf]' : 'text-gray-500 hover:text-white'}`}
                >
                    <Mic className="w-3 h-3" /> VOICE
                </button>
            </div>
          </div>
        </header>

        <div className="bg-gray-900/40 border border-white/10 rounded-[32px] p-8 md:p-12">
          {inputMode === 'text' ? (
            <form onSubmit={handleEstimate} className="space-y-8 animate-in fade-in slide-in-from-left duration-500">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <MessageSquare className="w-4 h-4" />
                  <label htmlFor="meal-text" className="text-[10px] font-mono uppercase tracking-[0.3em]">Meal Description</label>
                </div>
                <textarea
                  id="meal-text"
                  rows={4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="例: 牛丼並盛りとサラダ、味噌汁を食べました。"
                  className="w-full bg-black border border-white/10 rounded-2xl p-6 text-white focus:border-[#0cf] outline-none transition-all resize-none leading-relaxed"
                  disabled={loading}
                />
              </div>

              <LoadingButton
                type="submit"
                isLoading={loading}
                loadingText="AIが解析中..."
                disabled={!text.trim() || loading}
                className="w-full bg-[#0cf] hover:bg-[#0ef] text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#0cf]/20"
              >
                <Zap className="w-5 h-5" />
                EXECUTE COGNITION
              </LoadingButton>
            </form>
          ) : (
            <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-right duration-500">
                <div className={`
                    relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500
                    ${isRecording ? 'bg-red-500/20 scale-110 shadow-[0_0_40px_rgba(239,68,68,0.3)]' : 'bg-[#0cf]/10 hover:bg-[#0cf]/20'}
                `}>
                    {isRecording && <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-20 pointer-events-none" />}
                    {isRecording ? (
                        <button 
                          type="button"
                          onClick={stopRecording} 
                          className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors z-10"
                        >
                            <Square className="w-8 h-8 text-white fill-white" />
                        </button>
                    ) : (
                        <button 
                          type="button"
                          onClick={startRecording} 
                          className="w-20 h-20 bg-[#0cf] rounded-full flex items-center justify-center hover:bg-[#0ef] transition-colors z-10"
                        >
                            <Mic className="w-8 h-8 text-black" />
                        </button>
                    )}
                </div>
                <div>
                    <p className={`text-xl font-bold ${isRecording ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        {isRecording ? 'RECORDING...' : 'TAP MIC TO START'}
                    </p>
                    <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest leading-loose">
                        {isRecording ? 'Listening to your voice' : 'Say what you ate today'}
                    </p>
                </div>

                {/* Debug Log Display */}
                {debugLogs.length > 0 && (
                    <div className="w-full mt-4 p-4 bg-black/40 rounded-xl border border-white/5 text-left font-mono text-[8px] text-gray-500 space-y-1">
                        <div className="flex items-center gap-2 mb-1 text-gray-600">
                            <Terminal className="w-2 h-2" /> SYSTEM LOGS
                        </div>
                        {debugLogs.map((log, i) => <div key={i}>{log}</div>)}
                    </div>
                )}

                {audioBlob && !isRecording && (
                    <div className="w-full pt-8 border-t border-white/5 animate-in fade-in slide-in-from-bottom duration-500 space-y-6">
                        <div className="flex items-center justify-center gap-4 p-4 bg-black border border-white/5 rounded-2xl">
                            <Volume2 className="w-5 h-5 text-[#0cf]" />
                            <audio src={URL.createObjectURL(audioBlob)} controls className="h-8" />
                        </div>
                        <LoadingButton
                            onClick={() => handleEstimate()}
                            isLoading={loading}
                            loadingText="AIが解析中..."
                            className="w-full bg-[#0cf] hover:bg-[#0ef] text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#0cf]/20"
                        >
                            <Zap className="w-5 h-5" />
                            EXECUTE VOCAL SYNC
                        </LoadingButton>
                    </div>
                )}
            </div>
          )}
        </div>

        {error && <ErrorHandler error={error} onClose={() => setError(null)} />}
        {successMessage && (
          <MessageBox status="success" title="SYNC COMPLETE" description={successMessage} onClose={() => setSuccessMessage(null)} />
        )}

        {estimation && (
          <div className="animate-in fade-in slide-in-from-bottom duration-500 space-y-8">
            <div className="p-8 bg-gray-900/40 border border-[#0cf]/30 rounded-[32px] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                    <Sparkles className="w-6 h-6 text-[#0cf] animate-pulse" />
                </div>
                <h2 className="text-[10px] font-mono text-[#0cf] uppercase tracking-widest mb-6">Cognition Result</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <div className="text-[10px] font-mono text-gray-500 uppercase mb-1">Identified Meal</div>
                            <div className="text-3xl font-black tracking-tighter">{estimation.foodName}</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-mono text-gray-500 uppercase mb-1">Calorie Estimate</div>
                            <div className="text-5xl font-black text-red-500">{estimation.calories} <span className="text-sm text-gray-500 font-mono ml-1">KCAL</span></div>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="p-6 bg-white/5 border border-white/5 rounded-2xl">
                            <div className="text-[10px] font-mono text-gray-500 uppercase mb-2">Nutritional Breakdown</div>
                            <p className="text-sm leading-relaxed text-gray-300">{estimation.breakdown}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                    <div className="text-[10px] font-mono text-emerald-500 uppercase mb-2 flex items-center gap-2">
                        <Info className="w-3 h-3" /> AI Advice
                    </div>
                    <p className="text-sm text-emerald-100">{estimation.advice}</p>
                </div>
            </div>

            <LoadingButton
              onClick={handleRegisterMeal}
              isLoading={isRegistering}
              className="w-full bg-[#0cf] hover:bg-[#0ef] text-black font-black py-4 rounded-2xl transition-all shadow-lg shadow-[#0cf]/20"
            >
              COMMIT LOG TO DB
            </LoadingButton>
          </div>
        )}
      </div>
    </div>
  );
}
