'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, FileText, Globe, Cpu, Trash2, Database, HelpCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { prepareDocumentAction, injectBatchAction, finalizeIngestionAction, askQuestionAction, getDocumentsAction, deleteDocumentAction } from './actions';
import { AIProcessOverlay, AIMetrics } from '@/components/AI/AIProcessOverlay';
import { WelcomeGuide } from '@/components/Navigation/WelcomeGuide';
import { useSessionFirstTime } from '@/hooks/useSessionFirstTime';
import { GUIDE_CONTENTS } from '@/constants/guideContents';
import versionData from '@/app/version.json';

export const dynamic = 'force-dynamic';

const APP_VERSION = versionData.apps.rag;

export default function RagPage() {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string, sources?: string[] }[]>([]);
  const [input, setInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  
  // パネルの開閉状態
  const [isInjectionOpen, setIsInjectionOpen] = useState(true);
  const [isInventoryOpen, setIsInventoryOpen] = useState(true);
  
  const { isOpen: isGuideOpen, markAsSeen, showAgain } = useSessionFirstTime('has_seen_rag_guide');

  const [metrics, setMetrics] = useState<AIMetrics>({
    input_tokens: 0,
    thought_seconds: 0,
    current_tps: 0,
    total_latency: 0,
    status: 'idle',
    debug_log: 'SYSTEM READY'
  });

  const updateMetrics = (newMetrics: Partial<AIMetrics>) => {
    setMetrics(prev => ({ ...prev, ...newMetrics }));
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchDocuments = async () => {
    const result = await getDocumentsAction();
    if (result.success && result.documents) {
      setDocuments(result.documents);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('このドキュメントを削除しますか？')) return;
    const result = await deleteDocumentAction(id);
    if (result.success) fetchDocuments();
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const formElement = e.currentTarget;

    // 事前チェック: ファイルサイズの警告 (標準 13.4)
    const file = formData.get('file') as File;
    if (file && file.size > 2 * 1024 * 1024) { // 2MB以上
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const proceed = confirm(
        `【大型資料の検出】\nファイルのサイズが ${sizeMB}MB あります。\n\n学習完了まで数分かかる可能性があり、無料枠のAPI制限（リトライ）が発生しやすいサイズです。\nこのまま学習を開始しますか？`
      );
      if (!proceed) return;
    }

    setIsUploading(true);
    setStatus(null);
    const startTime = Date.now();

    try {
      updateMetrics({ status: 'transfer', debug_log: 'EXTRACTING CONTENT' });
      const prepResult = await prepareDocumentAction(formData);
      if (!prepResult.success || !prepResult.documentId || !prepResult.chunks) throw new Error(prepResult.error);

      const { documentId, chunks, totalChunks } = prepResult;
      const BATCH_SIZE = parseInt(process.env.NEXT_PUBLIC_AI_BATCH_SIZE || "15");
      const THROTTLE_MS = parseInt(process.env.NEXT_PUBLIC_AI_THROTTLE_MS || "2000");
      let processedCount = 0;

      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);
        let success = false;
        let retries = 0;

        while (!success && retries < 5) {
          updateMetrics({ status: 'thinking', debug_log: `BATCH ${batchNum}/${totalBatches} (RETRIES: ${retries})` });
          const result = await injectBatchAction(documentId, batch);
          if (result.success) {
            success = true;
            processedCount += batch.length;
            updateMetrics({ debug_log: `SYNCED ${processedCount}/${totalChunks} CHUNKS` });
            await sleep(THROTTLE_MS);
          } else if (result.status === 429) {
            retries++;
            await sleep(retries * 5000);
          } else throw new Error(result.error);
        }
      }

      await finalizeIngestionAction();
      updateMetrics({ status: 'completed', debug_log: 'KNOWLEDGE BASE UPDATED', total_latency: (Date.now() - startTime) / 1000 });
      setStatus({ type: 'success', message: '学習が完了しました！' });
      formElement.reset();
      fetchDocuments();
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
      updateMetrics({ status: 'error', debug_log: 'INJECTION FAILED' });
    } finally {
      setIsUploading(false);
    }
  };

  // 質問のハンドラ
  const handleAsk = async () => {
    if (!input.trim() || isAsking) return;

    const userQuery = input.trim();
    setInput(''); // 🚀 即座に入力をクリア
    
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setIsAsking(true);
    const startTime = Date.now();
    updateMetrics({ 
      status: 'thinking', 
      debug_log: 'SEARCHING KNOWLEDGE BASE...',
      thought_seconds: 0 
    });

    // 思考時間のリアルタイム更新タイマー
    const timer = setInterval(() => {
      updateMetrics({ thought_seconds: (Date.now() - startTime) / 1000 });
    }, 100);

    try {
      const result = await askQuestionAction(userQuery);
      if (result.success && result.answer) {
        updateMetrics({ status: 'generating', debug_log: 'SYNTHESIZING ANSWER...' });
        setMessages(prev => [...prev, { role: 'ai', content: result.answer as string, sources: result.sources as string[] }]);
        updateMetrics({ status: 'completed', debug_log: 'RESPONSE DELIVERED', total_latency: (Date.now() - startTime) / 1000 });
      } else throw new Error(result.error);
    } catch (err) {
      updateMetrics({ status: 'error', debug_log: 'ENGINE ERROR' });
    } finally {
      clearInterval(timer);
      setIsAsking(false);
    }
  };

  // キーダウンハンドラ (IME対応)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 変換確定のEnter（isComposing）は送信処理をスキップ
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="relative flex flex-col h-screen text-white overflow-hidden touch-none overscroll-behavior-none font-sans bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-[#0a192f] to-black z-0 opacity-80" />
      
      <header className="relative z-10 p-5 flex justify-between items-center border-b border-gray-800 bg-gray-900/40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#0cf]" />
          </Link>
          <button onClick={showAgain} className="p-2 hover:bg-white/10 rounded-full transition-colors text-[#0cf]">
            <HelpCircle className="w-5 h-5" />
          </button>
          <div className="hidden sm:block h-8 w-[1px] bg-gray-800 mx-2" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-[#0cf] font-mono font-bold text-lg tracking-tighter uppercase leading-none">IT Concierge</h1>
              <span className="text-[10px] bg-[#0cf]/10 text-[#0cf]/70 px-2 py-0.5 rounded border border-[#0cf]/20 font-mono">v{APP_VERSION}</span>
            </div>
          </div>
        </div>
        <div className={`w-2 h-2 rounded-full animate-pulse ${metrics.status === 'error' ? 'bg-red-500' : 'bg-[#0cf] shadow-[0_0_8px_#0cf]'}`} />
      </header>

      <main className="relative z-10 flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto w-full overflow-hidden">
        {/* 左列: 学習 & リスト */}
        <aside className="lg:col-span-4 flex flex-col gap-4 overflow-hidden">
          
          {/* インジェクションフォーム (折りたたみ) */}
          <section className={`bg-gray-900/40 border border-gray-800 rounded-2xl transition-all duration-300 flex flex-col overflow-hidden ${isInjectionOpen ? 'shrink-0' : 'h-[60px]'}`}>
            <button 
              onClick={() => setIsInjectionOpen(!isInjectionOpen)}
              className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Cpu className={`w-4 h-4 ${isInjectionOpen ? 'text-[#0cf]' : 'text-gray-500'}`} />
                <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase">Knowledge Base Injection</h2>
              </div>
              {isInjectionOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>
            
            <div className={`px-6 pb-6 space-y-5 transition-all duration-300 ${isInjectionOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <form onSubmit={handleUpload} className="space-y-4">
                <input name="title" required placeholder="Document Title" className="w-full p-3 bg-black/50 border border-gray-700 rounded-xl text-sm text-white focus:border-[#0cf] outline-none font-mono" />
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input name="url" placeholder="Web Source URL" className="w-full pl-10 p-3 bg-black/50 border border-gray-700 rounded-xl text-sm text-white focus:border-[#0cf] outline-none font-mono" />
                </div>
                <input name="file" type="file" accept=".pdf" className="w-full p-2.5 bg-black/50 border border-gray-700 rounded-xl text-sm text-gray-400 file:bg-gray-800 file:text-[#0cf] file:border-0 file:rounded file:px-3 file:py-1 cursor-pointer" />
                <button type="submit" disabled={isUploading} className="w-full py-3.5 bg-[#0cf]/10 text-[#0cf] border border-[#0cf]/40 rounded-xl hover:bg-[#0cf]/20 disabled:opacity-50 font-bold text-xs tracking-[0.3em] uppercase">
                  {isUploading ? 'SYNCING...' : 'Inject Data'}
                </button>
              </form>
              {status && (
                <div className={`p-3 rounded-lg border font-mono text-[10px] ${status.type === 'success' ? 'bg-green-900/10 border-green-800/50 text-green-400' : 'bg-red-900/10 border-red-800/50 text-red-400'}`}>
                  [{status.type.toUpperCase()}] {status.message}
                </div>
              )}
            </div>
          </section>

          {/* 学習済みリスト (折りたたみ & 拡張) */}
          <section className={`bg-gray-900/20 border border-gray-800 rounded-2xl transition-all duration-300 flex flex-col overflow-hidden ${isInventoryOpen ? 'flex-1' : 'h-[60px]'}`}>
            <button 
              onClick={() => setIsInventoryOpen(!isInventoryOpen)}
              className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Database className={`w-4 h-4 ${isInventoryOpen ? 'text-[#0cf]' : 'text-gray-500'}`} />
                <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase">Knowledge Inventory</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono text-gray-600 uppercase">{documents.length} ITEMS</span>
                {isInventoryOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </div>
            </button>
            
            <div className={`flex-1 overflow-hidden flex flex-col transition-all duration-300 ${isInventoryOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar space-y-3">
                {documents.length === 0 ? (
                  <p className="text-[10px] text-gray-600 font-mono text-center mt-10 opacity-50 uppercase tracking-widest">System Empty</p>
                ) : (
                  documents.map((doc) => {
                    const hostname = doc.url ? new URL(doc.url).hostname : null;
                    const fileName = doc.filePath || 'PDF DOCUMENT';
                    return (
                      <div key={doc.id} className="group p-3 bg-black/60 border border-gray-800 rounded-xl hover:border-[#0cf]/50 transition-all">
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center gap-3">
                            <h3 className="text-sm md:text-base font-black text-white truncate flex-1 tracking-tight" title={doc.title}>
                              {doc.title}
                            </h3>
                            {doc.url ? (
                              <a 
                                href={doc.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded bg-[#0cf]/10 text-[#0cf] border border-[#0cf]/20 font-bold max-w-[120px] truncate hover:bg-[#0cf]/20 flex items-center gap-1 transition-colors"
                              >
                                {hostname}
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : (
                              <span className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700 font-bold max-w-[120px] truncate">
                                {fileName}
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between items-center opacity-60">
                            <div className="flex items-center gap-3 text-[9px] font-mono uppercase tracking-tighter">
                              <span className="text-[#0cf]/80">{doc._count?.chunks || 0} CHUNKS</span>
                              <span className="text-gray-600">{new Date(doc.createdAt).toLocaleDateString()}</span>
                            </div>
                            <button 
                              onClick={() => handleDelete(doc.id)} 
                              className="p-1 text-gray-600 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        </aside>

        {/* 右列: チャット */}
        <section className="lg:col-span-8 flex flex-col gap-4 overflow-hidden bg-gray-900/20 border border-gray-800 rounded-3xl backdrop-blur-sm shadow-2xl">
          <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-8 custom-scrollbar">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-600 space-y-6 opacity-40">
                <div className="p-6 border border-gray-800 rounded-full"><FileText className="w-16 h-16" /></div>
                <p className="font-mono text-sm tracking-[0.4em] uppercase text-center">Neural Link Ready</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] md:max-w-[80%] p-5 rounded-2xl ${msg.role === 'user' ? 'bg-[#0cf]/10 border border-[#0cf]/20 text-[#0cf] rounded-tr-none' : 'bg-black/60 border border-gray-800 text-gray-200 rounded-tl-none shadow-xl'}`}>
                  <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.content}</p>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-800/50 text-[10px] text-gray-500 font-mono tracking-widest uppercase">
                      SOURCES: {Array.from(new Set(msg.sources)).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isAsking && (
              <div className="flex justify-start animate-in fade-in">
                <div className="bg-black/60 border border-gray-800 p-5 rounded-2xl rounded-tl-none flex gap-2 items-center">
                  <div className="w-1.5 h-1.5 bg-[#0cf] rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-[#0cf] rounded-full animate-bounce delay-150" />
                  <div className="w-1.5 h-1.5 bg-[#0cf] rounded-full animate-bounce delay-300" />
                </div>
              </div>
            )}
          </div>

          <div className="p-6 md:p-8 border-t border-gray-800/50 bg-black/40">
            <div className="relative flex items-center max-w-4xl mx-auto w-full">
              <input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyDown={handleKeyDown} 
                placeholder="Ask your IT Concierge..." 
                className="flex-1 p-5 pr-16 bg-gray-900/80 border border-gray-700 rounded-2xl text-white placeholder-gray-600 focus:border-[#0cf] outline-none transition-all shadow-inner" 
              />
              <button 
                onClick={handleAsk} 
                disabled={isAsking || !input.trim()} 
                className="absolute right-3 p-3 bg-[#0cf]/20 text-[#0cf] rounded-xl hover:bg-[#0cf]/30 disabled:opacity-50"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <AIProcessOverlay metrics={metrics} title="Knowledge Engine" modelName="gemini-embedding-001" />
      <WelcomeGuide isOpen={isGuideOpen} onClose={markAsSeen} content={GUIDE_CONTENTS.IT_CONCIERGE} />
    </div>
  );
}
