"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getUserProfiles, ensureUserProfile, uploadAndAnalyzeStyle, createUserProfile } from './actions';
import { UserProfile as PrismaUserProfile } from '@prisma/client';
import { Loader2, Sparkles, PenLine, BookOpen, Save, History, FileUp, FileText, ArrowLeft, HelpCircle, Code } from 'lucide-react';
import ProfileSelector from '@/components/ProfileSelector';
import { WelcomeGuide } from '@/components/Navigation/WelcomeGuide';
import { GUIDE_CONTENTS } from '@/constants/guideContents';
import { useSessionFirstTime } from '@/hooks/useSessionFirstTime';
import { AIProcessOverlay, AIMetrics } from '@/components/AI/AIProcessOverlay';

export const dynamic = 'force-dynamic';

// Prismaの型が更新されない場合のための拡張定義
interface ExtendedUserProfile extends PrismaUserProfile {
  styleInstruction?: string | null;
  learningLevel?: number;
  lastAnalyzedAt?: Date | null;
}

export default function PostAssistantPage() {
  const { isOpen, markAsSeen, showAgain } = useSessionFirstTime('post-assistant-guide');
  const [profiles, setProfiles] = useState<ExtendedUserProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<ExtendedUserProfile | null>(null);
  const [pastArticles, setPastArticles] = useState('');
  const [topic, setTopic] = useState('');
  const [generatedPost, setGeneratedPost] = useState('');
  const [thoughtText, setThoughtText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showStylePreview, setShowStylePreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // メトリクス状態
  const [aiMetrics, setAiMetrics] = useState<AIMetrics>({
    input_tokens: 0,
    thought_seconds: 0,
    current_tps: 0,
    total_latency: 0,
    status: 'idle',
    debug_log: '',
  });

  useEffect(() => {
    async function init() {
      await ensureUserProfile();
      const res = await getUserProfiles() as ExtendedUserProfile[];
      setProfiles(res);
      
      const savedId = localStorage.getItem('post_assistant_active_profile_id');
      if (savedId) {
        const active = res.find((p: any) => p.id === savedId);
        if (active) setActiveProfile(active);
      } else if (res.length > 0) {
        setActiveProfile(res[0]);
        localStorage.setItem('post_assistant_active_profile_id', res[0].id);
      }
      setLoading(false);
    }
    init();
  }, []);

  const handleCreateProfile = async (displayName: string) => {
    const res = await createUserProfile(displayName);
    const updatedProfiles = [...profiles, res as ExtendedUserProfile];
    setProfiles(updatedProfiles);
    setActiveProfile(res as ExtendedUserProfile);
    localStorage.setItem('post_assistant_active_profile_id', res.id);
    return res;
  };

  const handleSwitchProfile = (profile: ExtendedUserProfile) => {
    setActiveProfile(profile);
    localStorage.setItem('post_assistant_active_profile_id', profile.id);
    setGeneratedPost('');
    setMessage('');
    setAiMetrics(prev => ({ ...prev, status: 'idle' }));
  };

  const handleAnalyzeStreaming = async () => {
    if (!activeProfile || !pastArticles) {
      alert('過去の記事を入力してください');
      return;
    }

    setIsAnalyzing(true);
    setThoughtText('');
    setMessage('');
    
    const startTime = Date.now();
    let firstChunkTime = 0;
    let thoughtStartTime = 0;
    let tokensGenerated = 0;
    let fullStyleInstruction = "";
    let fullThoughts = "";

    setAiMetrics({
      input_tokens: 0,
      thought_seconds: 0,
      current_tps: 0,
      total_latency: 0,
      status: 'transfer',
      debug_log: 'Starting style distillation...',
    });

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeProfile.id,
          pastArticles
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Analysis failed (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('ReadableStream not supported');

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
              debug_log: 'Analyzing core patterns...'
            }));
            thoughtStartTime = Date.now();
          }

          if (data.type === 'chunk') {
            if (data.thought) {
              fullThoughts += data.thought;
              setThoughtText(fullThoughts);
              const thinkingTime = (Date.now() - thoughtStartTime) / 1000;
              setAiMetrics(prev => ({ 
                ...prev, 
                thought_seconds: thinkingTime,
              }));
            }

            if (data.text) {
              if (aiMetrics.status !== 'generating') {
                setAiMetrics(prev => ({ 
                  ...prev, 
                  status: 'generating',
                  debug_log: 'Formulating instruction...'
                }));
              }
              fullStyleInstruction += data.text;
              
              // TPS計算
              tokensGenerated += data.text.length * 0.75;
              const timeFromFirst = (Date.now() - firstChunkTime) / 1000;
              const tps = timeFromFirst > 0 ? tokensGenerated / timeFromFirst : 0;
              
              setAiMetrics(prev => ({ 
                ...prev, 
                current_tps: tps
              }));
            }
          }

          if (data.type === 'done') {
            setAiMetrics(prev => ({ 
              ...prev, 
              status: 'completed',
              input_tokens: data.usage?.promptTokenCount || 0,
              debug_log: 'Style analysis successful'
            }));
            
            setMessage('文体分析が完了しました。最新の指示書が生成されました。');
            setActiveProfile(prev => prev ? ({ ...prev, styleInstruction: fullStyleInstruction }) : null);
          }

          if (data.type === 'error') {
            setAiMetrics(prev => ({ ...prev, status: 'error', debug_log: data.message }));
            return;
          }
        }
      }
    } catch (error: any) {
      console.error("Analysis Error:", error);
      setAiMetrics(prev => ({ ...prev, status: 'error', debug_log: error.message }));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeProfile) return;

    setIsAnalyzing(true);
    setMessage(`ファイルを処理中: ${file.name}...`);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', activeProfile.id);

    try {
      const result = await uploadAndAnalyzeStyle(formData);
      if (result.success) {
        setMessage(`「${file.name}」の分析が完了しました！`);
        const data = await getUserProfiles() as ExtendedUserProfile[];
        setProfiles(data);
        const updated = data.find(p => p.id === activeProfile.id);
        if (updated) setActiveProfile(updated);
      } else {
        alert(result.error || 'ファイルの分析に失敗しました');
      }
    } catch (error: any) {
      console.error("File Upload Error:", error);
      alert('ファイル処理中にエラーが発生しました。');
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGenerateStreaming = async () => {
    if (!activeProfile || !topic) {
      alert('ネタを入力してください');
      return;
    }

    setIsGenerating(true);
    setGeneratedPost('');
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
      debug_log: 'Initializing generator...',
    });

    try {
      const response = await fetch('/api/ai/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeProfile.id,
          topic,
          styleInstruction: activeProfile.styleInstruction
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to start generation (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('ReadableStream not supported');

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
              debug_log: 'Applying style rules...'
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
                setAiMetrics(prev => ({ 
                  ...prev, 
                  status: 'generating',
                  debug_log: 'Generating note content...'
                }));
              }
              fullText += data.text;
              setGeneratedPost(fullText);
              
              tokensGenerated += data.text.length * 0.75;
              const timeFromFirst = (Date.now() - (firstChunkTime || startTime)) / 1000;
              const tps = timeFromFirst > 0 ? tokensGenerated / timeFromFirst : 0;
              
              setAiMetrics(prev => ({ ...prev, current_tps: tps }));
            }
          }

          if (data.type === 'done') {
            setAiMetrics(prev => ({ 
              ...prev, 
              status: 'completed',
              input_tokens: data.usage?.promptTokenCount || 0,
              debug_log: 'Generation finished'
            }));
          }

          if (data.type === 'error') {
            setAiMetrics(prev => ({ ...prev, status: 'error', debug_log: data.message }));
            return;
          }
        }
      }
    } catch (error: any) {
      console.error("Streaming Error:", error);
      setAiMetrics(prev => ({ 
        ...prev, 
        status: 'error',
        debug_log: error.message 
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-pulse text-blue-500 font-mono tracking-[0.5em]">SYSTEM INITIALIZING...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans selection:bg-blue-500/30">
      <WelcomeGuide 
        content={GUIDE_CONTENTS.POST_ASSISTANT} 
        isOpen={isOpen} 
        onClose={markAsSeen} 
      />

      {/* AI Process Overlay (Floating Popup) */}
      <AIProcessOverlay 
        metrics={aiMetrics} 
        thoughtText={thoughtText} 
        modelName="Gemini 2.5 Flash"
      />

      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <header className="animate-in fade-in slide-in-from-top duration-700">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-blue-500 text-sm font-bold tracking-widest uppercase hover:opacity-80 transition-opacity flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Gateway
              </Link>
              
              <button 
                onClick={() => showAgain()}
                className="text-xs text-gray-500 hover:text-blue-400 flex items-center gap-1 transition-colors border-l pl-4 border-white/10"
              >
                <HelpCircle className="w-4 h-4" />
                使い方
              </button>
            </div>
            
            <ProfileSelector 
              profiles={profiles}
              activeProfile={activeProfile}
              onSwitch={handleSwitchProfile}
              onCreate={handleCreateProfile}
            />
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)]">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black tracking-tight uppercase">SNS Posting Assistant <span className="text-blue-500">Phase 1</span></h1>
          </div>
          <p className="text-gray-400 max-w-2xl leading-relaxed">
            過去の執筆データからあなたの「文体」を蒸留し、AIがあなたらしいnote記事を代筆します。
          </p>
        </header>

        {/* User Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-2">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center justify-between">
              Style Learning Level
              {activeProfile?.styleInstruction && (
                <button 
                  onClick={() => setShowStylePreview(!showStylePreview)}
                  className="text-[10px] text-blue-400 hover:underline"
                >
                  {showStylePreview ? 'Hide Style' : 'View Style'}
                </button>
              )}
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-blue-500">Lv.{activeProfile?.learningLevel || 0}</span>
              <div className="flex gap-0.5 mb-1.5">
                {[1,2,3,4,5].map(lv => (
                  <div key={lv} className={`w-3 h-1.5 rounded-full ${lv <= (activeProfile?.learningLevel || 0) ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-white/10'}`} />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-2">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Last Analyzed</div>
            <div className="text-lg font-medium text-gray-300">
              {activeProfile?.lastAnalyzedAt ? new Date(activeProfile.lastAnalyzedAt).toLocaleDateString() : 'No analysis data'}
            </div>
          </div>
        </div>

        {/* Style Preview Area */}
        {showStylePreview && activeProfile?.styleInstruction && (
          <div className="animate-in zoom-in duration-300 bg-blue-950/20 border border-blue-500/20 rounded-2xl p-6 relative">
            <div className="absolute top-4 right-4 flex items-center gap-2 text-[10px] font-bold text-blue-400/50 uppercase">
              <Code className="w-3 h-3" /> System Instruction
            </div>
            <div className="text-sm text-blue-300/80 italic font-mono leading-relaxed whitespace-pre-wrap">
              {activeProfile.styleInstruction}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Section 1: Style Analysis */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-blue-400">
              <BookOpen className="w-5 h-5" />
              <h2 className="text-xl font-bold uppercase tracking-wide">1. 文体学習 (Analyzer)</h2>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400">過去の記事（テキスト貼り付け または ファイル）</label>
                
                {/* File Upload Area */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-white/10 hover:border-blue-500/50 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all bg-white/5 hover:bg-blue-500/5"
                >
                  <FileUp className="w-8 h-8 text-blue-500" />
                  <div className="text-center">
                    <p className="text-sm font-bold">ファイルをアップロード</p>
                    <p className="text-[10px] text-gray-500 uppercase mt-1">PDF, XML (note export), TXT</p>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden" 
                    accept=".pdf,.xml,.txt"
                  />
                </div>

                <div className="relative py-4 flex items-center">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink mx-4 text-[10px] font-bold text-gray-600 uppercase">OR</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                <textarea 
                  value={pastArticles}
                  onChange={(e) => setPastArticles(e.target.value)}
                  placeholder={`${activeProfile?.displayName || 'ユーザー'}さんの過去記事を貼り付けてください`}
                  className="w-full h-48 bg-black/50 border border-white/10 rounded-xl p-4 text-sm leading-relaxed focus:border-blue-500 outline-none transition-colors"
                />
              </div>
              <button 
                onClick={handleAnalyzeStreaming}
                disabled={isAnalyzing}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-blue-300 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20"
              >
                {isAnalyzing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> 蒸留中...</>
                ) : (
                  <><Save className="w-5 h-5" /> 文体を蒸留する</>
                )}
              </button>
              {message && (
                <div className="flex items-center justify-center gap-2 text-blue-400 text-sm font-medium animate-pulse bg-blue-500/5 py-2 rounded-lg">
                   <FileText className="w-4 h-4" />
                   {message}
                </div>
              )}
            </div>
          </section>

          {/* Section 2: Post Generation */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-emerald-400">
              <PenLine className="w-5 h-5" />
              <h2 className="text-xl font-bold uppercase tracking-wide">2. 記事作成 (Generator)</h2>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400">記事のネタ（議論ログ、箇条書きメモ等）</label>
                <textarea 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="今日あった出来事や、書きたいテーマの断片を入力してください"
                  className="w-full h-64 bg-black/50 border border-white/10 rounded-xl p-4 text-sm leading-relaxed focus:border-emerald-500 outline-none transition-colors"
                />
              </div>
              <button 
                onClick={handleGenerateStreaming}
                disabled={isGenerating || !activeProfile?.styleInstruction}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:text-emerald-300 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-emerald-600/20"
              >
                {isGenerating ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> 執筆中...</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> 記事を生成する</>
                )}
              </button>
              {!activeProfile?.styleInstruction && (
                <p className="text-center text-amber-500 text-xs font-bold uppercase tracking-wider bg-amber-500/5 py-2 rounded-lg">
                  先に文体分析を行ってください
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Output Section */}
        {generatedPost && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400">
                <History className="w-5 h-5" />
                <h2 className="text-xl font-bold uppercase tracking-wide">生成されたドラフト</h2>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(generatedPost);
                  alert('クリップボードにコピーしました');
                }}
                className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors px-3 py-1 bg-white/5 rounded-full"
              >
                Copy to Clipboard
              </button>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 prose prose-invert max-w-none whitespace-pre-wrap leading-loose text-gray-200">
              {generatedPost}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
