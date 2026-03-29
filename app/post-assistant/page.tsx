"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getUserProfiles, ensureUserProfile, uploadAndAnalyzeStyle, createUserProfile, generateImageWithPrompt, refineUserStyle } from './actions';
import { UserProfile as PrismaUserProfile } from '@prisma/client';
import { Loader2, Sparkles, PenLine, BookOpen, Save, History, FileUp, FileText, ArrowLeft, HelpCircle, Code, Image as ImageIcon, Download, Tag, Palette, RefreshCcw, ChevronDown, Lock } from 'lucide-react';
import ProfileSelector from '@/components/ProfileSelector';
import { WelcomeGuide } from '@/components/Navigation/WelcomeGuide';
import { GUIDE_CONTENTS } from '@/constants/guideContents';
import { useSessionFirstTime } from '@/hooks/useSessionFirstTime';
import { AIProcessOverlay, AIMetrics } from '@/components/AI/AIProcessOverlay';
import JSZip from 'jszip';

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
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showStylePreview, setShowStylePreview] = useState(false);
  const [imageCooldown, setImageCooldown] = useState(0);
  
  // 画像生成用の状態
  const [imageTouch, setImageTouch] = useState('Modern & Minimal');
  const [imageKeywords, setImageKeywords] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [generatedImagePrompt, setGeneratedImagePrompt] = useState('');

  // 添削学習（Refine）用の状態
  const [refineDraftText, setRefineDraftText] = useState('');
  const [refineFinalText, setRefineFinalText] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refineFeedback, setRefineFeedback] = useState('');

  // 文字数指定ステート
  const [targetWordCount, setTargetWordCount] = useState<number>(1000);

  // アコーディオン開閉ステート
  const [expanded, setExpanded] = useState({
    s1: false,
    s2: true,
    sOut: false,
    s3: false,
    s4: false
  });

  const toggleSection = (sec: keyof typeof expanded, isLocked: boolean = false) => {
    if (isLocked) return;
    setExpanded(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageSectionRef = useRef<HTMLElement>(null);
  const refineSectionRef = useRef<HTMLElement>(null);

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
              setRefineDraftText(fullText); // 添削用に自動コピー
              
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
            
            // アコーディオンを展開
            setExpanded(prev => ({ ...prev, sOut: true, s3: true, s4: true }));

            // 5秒間のクールダウン開始
            setImageCooldown(5);
            const countdownInterval = setInterval(() => {
              setImageCooldown(prev => {
                if (prev <= 1) {
                  clearInterval(countdownInterval);
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
            
            // 少し遅延を入れてから画像セクションへ自動スクロール
            setTimeout(() => {
              imageSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
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

  const handleGenerateImage = async () => {
    if (!generatedPost || !topic) {
      alert('先に記事を生成してください');
      return;
    }

    setIsGeneratingImage(true);
    setAiMetrics({
      input_tokens: 0,
      thought_seconds: 0,
      current_tps: 0,
      total_latency: 0,
      status: 'thinking',
      debug_log: 'Generating optimal English prompt for image...',
    });
    setThoughtText('指定されたタッチとキーワードに基づく英語プロンプトを構築中...');
    
    const startTime = Date.now();

    try {
      const res = await generateImageWithPrompt(topic, imageTouch, imageKeywords);
      const latency = (Date.now() - startTime) / 1000;
      
      if (res.success) {
        setGeneratedImageUrl(res.imageUrl || '');
        setGeneratedImagePrompt(res.imagePrompt || '');
        setAiMetrics(prev => ({ 
          ...prev, 
          status: 'completed',
          total_latency: latency,
          debug_log: 'Image generation completed successfully'
        }));
      } else {
        alert(res.error || '画像生成に失敗しました');
        setAiMetrics(prev => ({ 
          ...prev, 
          status: 'error',
          debug_log: res.error || 'Generation failed'
        }));
      }
    } catch (error: any) {
      console.error("Image Generation Error:", error);
      alert('画像生成中にエラーが発生しました');
      setAiMetrics(prev => ({ 
        ...prev, 
        status: 'error',
        debug_log: error.message || 'Error occurred'
      }));
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleRefineStyle = async () => {
    if (!activeProfile || !refineDraftText || !refineFinalText) {
      alert('ドラフトと最終版の両方を入力してください。');
      return;
    }

    setIsRefining(true);
    setRefineFeedback('');
    
    // オーバーレイでの進捗表示（疑似）
    setAiMetrics({
      input_tokens: refineDraftText.length + refineFinalText.length,
      thought_seconds: 0,
      current_tps: 0,
      total_latency: 0,
      status: 'thinking',
      debug_log: 'Analyzing discrepancy...'
    });
    setThoughtText('ドラフトと最終版の差分を分析し、あなたの好みを学習中...');
    
    const startTime = Date.now();

    try {
      const res = await refineUserStyle(activeProfile.id, refineDraftText, refineFinalText);
      const latency = (Date.now() - startTime) / 1000;
      
      if (res.success) {
        setRefineFeedback(res.feedback || '');
        setAiMetrics(prev => ({ 
          ...prev, 
          status: 'completed',
          total_latency: latency,
          debug_log: 'Style refined successfully'
        }));
        // 最新プロファイルに更新
        const data = await getUserProfiles() as ExtendedUserProfile[];
        setProfiles(data);
        const updated = data.find(p => p.id === activeProfile.id);
        if (updated) setActiveProfile(updated);
      } else {
        alert(res.error || '添削学習に失敗しました');
        setAiMetrics(prev => ({ ...prev, status: 'error', debug_log: 'Refinement failed' }));
      }
    } catch (error: any) {
      console.error("Style Refinement Error:", error);
      alert('添削学習中にエラーが発生しました');
      setAiMetrics(prev => ({ ...prev, status: 'error', debug_log: 'Error occurred' }));
    } finally {
      setIsRefining(false);
    }
  };

  const handleDownloadPackage = async () => {
    if (!generatedPost) return;

    try {
      const zip = new JSZip();
      const date = new Date().toISOString().split('T')[0];
      const folderName = `note_${date}`;
      
      // Markdownファイルの作成
      const mdContent = `# ${topic || 'Untitled'}\n\n${generatedPost}`;
      zip.file(`${folderName}/article.md`, mdContent);

      // 画像のダウンロードと追加（URLがある場合）
      if (generatedImageUrl) {
        const imageRes = await fetch(generatedImageUrl);
        const imageBlob = await imageRes.blob();
        zip.file(`${folderName}/eyecatch.png`, imageBlob);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      
      // ブラウザでのダウンロード処理
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${folderName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('ダウンロードフォルダに保存しました');
    } catch (error: any) {
      console.error("Download Error:", error);
      alert('パッケージの作成に失敗しました');
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
              <div className="flex flex-col items-start gap-1 pb-1">
                <div className="text-[10px] text-gray-500 font-medium">Growth EXP</div>
                <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-pulse rounded-full" style={{ width: '100%' }}></div>
                </div>
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

        <div className="space-y-6 max-w-5xl mx-auto w-full">
          {/* Section 1: Style Analysis */}
          <section className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden transition-all duration-300">
            <div 
              onClick={() => toggleSection('s1')}
              className="px-8 py-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3 text-blue-400">
                <BookOpen className="w-5 h-5" />
                <h2 className="text-xl font-bold uppercase tracking-wide">1. 文体学習 (Analyzer)</h2>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expanded.s1 ? 'rotate-180' : ''}`} />
            </div>
            
            {expanded.s1 && (
              <div className="px-8 pb-8 space-y-6 animate-in slide-in-from-top-2 border-t border-white/10 pt-6 mt-2">
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
            )}
          </section>

          {/* Section 2: Post Generation */}
          <section className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden transition-all duration-300">
            <div 
              onClick={() => toggleSection('s2')}
              className="px-8 py-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3 text-emerald-400">
                <PenLine className="w-5 h-5" />
                <h2 className="text-xl font-bold uppercase tracking-wide">2. 記事作成 (Generator)</h2>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expanded.s2 ? 'rotate-180' : ''}`} />
            </div>

            {expanded.s2 && (
              <div className="px-8 pb-8 space-y-6 animate-in slide-in-from-top-2 border-t border-white/10 pt-6 mt-2">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-3 space-y-2">
                    <label className="text-sm font-bold text-gray-400">記事のネタ（議論ログ、箇条書きメモ等）</label>
                    <textarea 
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="今日あった出来事や、書きたいテーマの断片を入力してください"
                      className="w-full h-64 bg-black/50 border border-white/10 rounded-xl p-4 text-sm leading-relaxed focus:border-emerald-500 outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400">文字数の目安</label>
                    <select 
                      value={targetWordCount}
                      onChange={(e) => setTargetWordCount(Number(e.target.value))}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="500">500文字</option>
                      <option value="1000">1000文字</option>
                      <option value="1500">1500文字</option>
                      <option value="2000">2000文字</option>
                    </select>
                  </div>
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
            )}
          </section>

        {/* Output Section: Generated Post */}
        <section className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden transition-all duration-300">
          <div 
            onClick={() => toggleSection('sOut', !generatedPost)}
            className={`px-8 py-6 flex items-center justify-between transition-colors ${!generatedPost ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-white/5'}`}
          >
            <div className="flex items-center gap-3 text-blue-400">
              <FileText className="w-5 h-5" />
              <h2 className="text-xl font-bold uppercase tracking-wide">生成された記事 (Draft)</h2>
              {!generatedPost && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-white/10 text-gray-300 rounded uppercase tracking-wider">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expanded.sOut ? 'rotate-180' : ''}`} />
          </div>
          
          {expanded.sOut && generatedPost && (
            <div className="px-8 pb-8 space-y-6 animate-in slide-in-from-top-2 border-t border-white/10 pt-6 mt-2">
              <div className="flex items-center justify-end gap-3">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPost);
                    alert('クリップボードにコピーしました');
                  }}
                  className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors px-4 py-2 bg-white/5 rounded-full"
                >
                  Copy Text
                </button>
                <button 
                  onClick={handleDownloadPackage}
                  className="text-xs font-bold uppercase tracking-widest text-white transition-all px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  <Download className="w-4 h-4" />
                  Save Package (ZIP)
                </button>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 prose prose-invert max-w-none whitespace-pre-wrap leading-loose text-gray-200">
                {generatedPost}
              </div>
            </div>
          )}
        </section>

        {/* Section 3: Image Generation */}
        <section ref={imageSectionRef} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden transition-all duration-300 scroll-mt-24">
          <div 
            onClick={() => toggleSection('s3', !generatedPost)}
            className={`px-8 py-6 flex items-center justify-between transition-colors ${!generatedPost ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-white/5'}`}
          >
            <div className="flex items-center gap-3 text-purple-400">
              <ImageIcon className="w-5 h-5" />
              <h2 className="text-xl font-bold uppercase tracking-wide">3. アイキャッチ生成 (Visualizer)</h2>
              {!generatedPost && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-white/10 text-gray-300 rounded uppercase tracking-wider">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expanded.s3 ? 'rotate-180' : ''}`} />
          </div>
          
          {expanded.s3 && generatedPost && (
            <div className="px-8 pb-8 space-y-6 animate-in slide-in-from-top-2 border-t border-white/10 pt-6 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 flex items-center gap-2">
                    <Palette className="w-4 h-4" /> タッチを選択
                  </label>
                  <select 
                    value={imageTouch}
                    onChange={(e) => setImageTouch(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-purple-500 transition-colors"
                  >
                    <option>Modern & Minimal</option>
                    <option>Abstract Art</option>
                    <option>Cyberpunk / Tech</option>
                    <option>Soft Pastel / Watercolor</option>
                    <option>Professional / Business</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 flex items-center gap-2">
                    <Tag className="w-4 h-4" /> フォーカスキーワード
                  </label>
                  <input 
                    type="text"
                    value={imageKeywords}
                    onChange={(e) => setImageKeywords(e.target.value)}
                    placeholder="例: 未来, AI, 自由, 都会の夜"
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <button 
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || imageCooldown > 0}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:text-purple-300 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-purple-600/20"
              >
                {isGeneratingImage ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> 画像生成中...</>
                ) : imageCooldown > 0 ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> 準備中... ({imageCooldown}秒)</>
                ) : (
                  <><ImageIcon className="w-5 h-5" /> アイキャッチを生成する</>
                )}
              </button>

              {generatedImageUrl && (
                <div className="space-y-4 pt-4">
                  <div className="relative aspect-[1280/670] w-full overflow-hidden rounded-2xl border border-white/10 bg-black group">
                    <img 
                      src={generatedImageUrl} 
                      alt="Generated Eye Catch" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-8 text-center">
                      <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2">Generated Prompt</p>
                      <p className="text-xs text-gray-300 italic line-clamp-3">{generatedImagePrompt}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Section 4: Refinement (Feedback Learning) */}
        <section ref={refineSectionRef} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden transition-all duration-300 scroll-mt-24">
          <div 
            onClick={() => toggleSection('s4', !generatedPost)}
            className={`px-8 py-6 flex items-center justify-between transition-colors ${!generatedPost ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-white/5'}`}
          >
            <div className="flex items-center gap-3 text-indigo-400">
              <RefreshCcw className="w-5 h-5" />
              <h2 className="text-xl font-bold uppercase tracking-wide">4. 添削から学習 (Reflection)</h2>
              {!generatedPost && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-white/10 text-gray-300 rounded uppercase tracking-wider">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expanded.s4 ? 'rotate-180' : ''}`} />
          </div>
          
          {expanded.s4 && generatedPost && (
            <div className="px-8 pb-8 space-y-6 animate-in slide-in-from-top-2 border-t border-white/10 pt-6 mt-2 relative overflow-hidden">
              {/* Background Decor */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                AIが出力した記事をそのまま使わず、自分で手直し（添削）した場合は、その「最終版」をここに貼り付けてください。
                AIがドラフトと最終版の差分を比較し、あなたの真の好みを学習（レベルアップ）します。
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <div className="space-y-2">
                   <label className="text-sm font-bold text-gray-400">AIが出したドラフト</label>
                   <textarea 
                     value={refineDraftText}
                     onChange={(e) => setRefineDraftText(e.target.value)}
                     placeholder="AIが生成した元の文章（記事生成時に自動で入力されます）。"
                     className="w-full h-80 bg-black/50 border border-white/10 rounded-xl p-4 text-sm leading-relaxed focus:border-indigo-500 outline-none transition-colors"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-sm font-bold text-indigo-300">手直しした最終版モデル</label>
                   <textarea 
                     value={refineFinalText}
                     onChange={(e) => setRefineFinalText(e.target.value)}
                     placeholder="あなたが実際にnoteやSNSに投稿した、修正後の文章を貼り付けてください。"
                     className="w-full h-80 bg-black/50 border border-indigo-500/30 rounded-xl p-4 text-sm leading-relaxed focus:border-indigo-500 outline-none transition-colors"
                   />
                </div>
              </div>

              <button 
                onClick={handleRefineStyle}
                disabled={isRefining || !activeProfile?.styleInstruction}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:text-indigo-300 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20 relative z-10 mt-6"
              >
                {isRefining ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> 学習中...</>
                ) : (
                  <><RefreshCcw className="w-5 h-5" /> 差分から文体をアップデートする</>
                )}
              </button>

              {refineFeedback && (
                <div className="mt-6 p-6 bg-indigo-950/30 border border-indigo-500/20 rounded-2xl animate-in fade-in slide-in-from-bottom-4 relative z-10">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold mb-2 uppercase text-xs tracking-wider">
                    <Sparkles className="w-4 h-4" /> Reflection Complete! Level Up!
                  </div>
                  <p className="text-sm text-indigo-100 leading-relaxed font-medium">
                    {refineFeedback}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
     </div>
    </div>
  );
}
