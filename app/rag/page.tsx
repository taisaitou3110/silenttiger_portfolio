'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, FileText, Globe, Cpu, Trash2, Database } from 'lucide-react';
import { prepareDocumentAction, injectBatchAction, finalizeIngestionAction, askQuestionAction, getDocumentsAction, deleteDocumentAction } from './actions';
import { AIProcessOverlay, AIMetrics } from '@/components/AI/AIProcessOverlay';
import versionData from '../version.json';

const APP_VERSION = versionData.apps.rag;

export default function RagPage() {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string, sources?: string[] }[]>([]);
  const [input, setInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  
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

  // ドキュメント一覧の取得
  const fetchDocuments = async () => {
    const result = await getDocumentsAction();
    if (result.success && result.documents) {
      setDocuments(result.documents);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // ドキュメント削除
  const handleDelete = async (id: string) => {
    if (!confirm('このドキュメントを削除しますか？関連する学習データもすべて消去されます。')) return;
    const result = await deleteDocumentAction(id);
    if (result.success) {
      fetchDocuments();
    } else {
      alert('削除に失敗しました: ' + result.error);
    }
  };

  // ドキュメント学習のハンドラ (クライアント主導ループ)
  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const formElement = e.currentTarget;
    const title = formData.get('title') as string;
    
    setIsUploading(true);
    setStatus(null);
    const startTime = Date.now();

    try {
      // Step 1: テキスト抽出とチャンク化
      updateMetrics({ status: 'transfer', debug_log: 'EXTRACTING CONTENT' });
      const prepResult = await prepareDocumentAction(formData);
      
      if (!prepResult.success || !prepResult.documentId || !prepResult.chunks) {
        throw new Error(prepResult.error || '準備に失敗しました');
      }

      const { documentId, chunks, totalChunks } = prepResult;
      
      // 環境変数から設定を取得 (デフォルト値をフォールバックとして保持)
      const BATCH_SIZE = parseInt(process.env.NEXT_PUBLIC_AI_BATCH_SIZE || "15");
      const THROTTLE_MS = parseInt(process.env.NEXT_PUBLIC_AI_THROTTLE_MS || "2000");
      
      let processedCount = 0;

      // Step 2: バッチごとにインジェクション (ループ)
      updateMetrics({ status: 'thinking', debug_log: `INDEXING: 0/${totalChunks} CHUNKS` });

      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);

        let success = false;
        let retries = 0;

        while (!success && retries < 5) {
          updateMetrics({ 
            status: 'thinking', 
            debug_log: `BATCH ${batchNum}/${totalBatches} (RETRIES: ${retries})` 
          });

          const result = await injectBatchAction(documentId, batch);

          if (result.success) {
            success = true;
            processedCount += batch.length;
            updateMetrics({ debug_log: `SYNCED ${processedCount}/${totalChunks} CHUNKS` });
            // 正常時も待機してレート制限を回避
            await sleep(THROTTLE_MS);
          } else if (result.status === 429) {
            retries++;
            const waitTime = retries * 5000;
            updateMetrics({ 
              status: 'error', 
              debug_log: `RATE LIMIT. RETRYING IN ${waitTime/1000}s...` 
            });
            await sleep(waitTime);
          } else {
            throw new Error(result.error || 'バッチ保存中にエラーが発生しました');
          }
        }

        if (!success) throw new Error('リトライ上限に達しました');
      }

      // Step 3: 完了処理
      await finalizeIngestionAction();
      updateMetrics({ 
        status: 'completed', 
        debug_log: 'KNOWLEDGE BASE UPDATED',
        total_latency: (Date.now() - startTime) / 1000
      });
      setStatus({ type: 'success', message: '学習が完了しました！' });
      formElement.reset();
      fetchDocuments(); // リストを更新

    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: err.message || 'エラーが発生しました' });
      updateMetrics({ status: 'error', debug_log: 'INJECTION FAILED' });
    } finally {
      setIsUploading(false);
    }
  };

  // 質問のハンドラ
  const handleAsk = async () => {
    if (!input.trim()) return;

    const userQuery = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setIsAsking(true);
    
    const startTime = Date.now();
    updateMetrics({ status: 'thinking', debug_log: 'RETRIEVING KNOWLEDGE' });

    try {
      const result = await askQuestionAction(userQuery);

      if (result.success && result.answer) {
        updateMetrics({ status: 'generating', debug_log: 'SYNTHESIZING ANSWER' });
        setMessages(prev => [...prev, { 
          role: 'ai', 
          content: result.answer as string, 
          sources: result.sources as string[] 
        }]);
        updateMetrics({ 
          status: 'completed', 
          debug_log: 'RESPONSE DELIVERED',
          total_latency: (Date.now() - startTime) / 1000,
          current_tps: (result.answer as string).length / ((Date.now() - startTime) / 1000)
        });
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: `エラー: ${result.error}` }]);
        updateMetrics({ status: 'error', debug_log: 'QUERY FAILED' });
      }
    } catch (err) {
      updateMetrics({ status: 'error', debug_log: 'ENGINE ERROR' });
    } finally {
      setIsAsking(false);
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
          <div className="hidden sm:block h-8 w-[1px] bg-gray-800 mx-2" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-[#0cf] font-mono font-bold text-lg tracking-tighter uppercase leading-none">IT Concierge</h1>
              <span className="text-[10px] bg-[#0cf]/10 text-[#0cf]/70 px-2 py-0.5 rounded border border-[#0cf]/20 font-mono">v{APP_VERSION}</span>
            </div>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Enterprise RAG Engine</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-[10px] font-mono">
          <div className="hidden md:flex flex-col items-end opacity-40">
            <span className="text-gray-500 uppercase tracking-tighter">Engine Status</span>
            <span className="text-[#0cf]">OPERATIONAL</span>
          </div>
          <div className={`w-2 h-2 rounded-full animate-pulse ${metrics.status === 'error' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-[#0cf] shadow-[0_0_8px_#0cf]'}`} />
        </div>
      </header>

      <main className="relative z-10 flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto w-full overflow-hidden">
        {/* 左列: 学習 & リスト */}
        <aside className="lg:col-span-4 flex flex-col gap-6 overflow-hidden">
          {/* インジェクションフォーム */}
          <section className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-2 mb-6">
              <Cpu className="w-5 h-5 text-[#0cf]" />
              <h2 className="text-sm font-bold text-white tracking-[0.2em] uppercase">Knowledge Base Injection</h2>
            </div>
            
            <form onSubmit={handleUpload} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Document Title</label>
                <input name="title" required placeholder="e.g. Printer Manual v2" className="w-full p-3 bg-black/50 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:border-[#0cf] focus:ring-1 focus:ring-[#0cf] outline-none transition-all font-mono" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Web Source (URL)</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input name="url" placeholder="https://manual-site.com/..." className="w-full pl-10 p-3 bg-black/50 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:border-[#0cf] focus:ring-1 focus:ring-[#0cf] outline-none transition-all font-mono" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">PDF Source (Local)</label>
                <input name="file" type="file" accept=".pdf" className="w-full p-2.5 bg-black/50 border border-gray-700 rounded-xl text-sm text-gray-400 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gray-800 file:text-[#0cf] hover:file:bg-gray-700 cursor-pointer" />
              </div>
              <button type="submit" disabled={isUploading} className="w-full py-4 bg-[#0cf]/10 text-[#0cf] border border-[#0cf]/40 rounded-xl hover:bg-[#0cf]/20 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm tracking-[0.3em] uppercase transition-all mt-4">
                {isUploading ? 'SYNCING...' : 'Inject Data'}
              </button>
            </form>

            {status && (
              <div className={`mt-6 p-4 rounded-xl border font-mono text-xs ${status.type === 'success' ? 'bg-green-900/10 border-green-800/50 text-green-400' : 'bg-red-900/10 border-red-800/50 text-red-400'}`}>
                [{status.type.toUpperCase()}] {status.message}
              </div>
            )}
          </section>

          {/* 学習済みリスト */}
          <section className="bg-gray-900/20 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-gray-500" />
                <h2 className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase">Knowledge Inventory</h2>
              </div>
              <span className="text-[9px] font-mono text-gray-600">{documents.length} ITEMS</span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
              {documents.length === 0 ? (
                <p className="text-[10px] text-gray-600 font-mono text-center mt-10 opacity-50 tracking-widest">SYSTEM_EMPTY: NO DATA STORED</p>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="group p-3 bg-black/40 border border-gray-800 rounded-xl hover:border-gray-700 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-2">
                        <h3 className="text-xs font-bold text-gray-300 truncate tracking-tight">{doc.title}</h3>
                        <p className="text-[9px] text-gray-600 font-mono mt-1 truncate">{doc.url || 'PDF_BLOB_LOADED'}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[8px] bg-gray-800 text-[#0cf]/70 px-1.5 py-0.5 rounded font-mono uppercase tracking-widest">{doc._count?.chunks || 0} CHUNKS</span>
                          <span className="text-[8px] text-gray-700 font-mono uppercase italic">{new Date(doc.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 text-gray-700 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Delete document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-auto pt-4 flex items-center justify-between opacity-30 border-t border-gray-800/50">
              <div className="flex flex-col">
                <span className="text-[9px] font-mono tracking-widest text-gray-500 uppercase">Storage</span>
                <span className="text-[9px] font-mono text-gray-600">PostgreSQL / pgvector</span>
              </div>
              <div className="w-1.5 h-1.5 bg-[#0cf] rounded-full animate-pulse shadow-[0_0_8px_#0cf]"></div>
            </div>
          </section>
        </aside>

        {/* 右列: チャット */}
        <section className="lg:col-span-8 flex flex-col gap-4 overflow-hidden bg-gray-900/20 border border-gray-800 rounded-3xl backdrop-blur-sm shadow-2xl">
          <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-8 custom-scrollbar">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-600 space-y-6 opacity-40">
                <div className="p-6 border border-gray-800 rounded-full"><FileText className="w-16 h-16" /></div>
                <p className="font-mono text-sm tracking-[0.4em] uppercase text-center">Neural Link Ready<br/><span className="text-[10px] tracking-widest mt-2 block">AWAITING QUERY INPUT</span></p>
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
              <div className="flex justify-start">
                <div className="bg-black/60 border border-gray-800 p-5 rounded-2xl rounded-tl-none">
                  <div className="flex gap-2 items-center">
                    <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mr-2">Processing</span>
                    <div className="w-1.5 h-1.5 bg-[#0cf] rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-[#0cf] rounded-full animate-bounce delay-150" />
                    <div className="w-1.5 h-1.5 bg-[#0cf] rounded-full animate-bounce delay-300" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 md:p-8 border-t border-gray-800/50 bg-black/40">
            <div className="relative flex items-center max-w-4xl mx-auto w-full">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAsk()} placeholder="Ask your IT Concierge..." className="flex-1 p-5 pr-16 bg-gray-900/80 border border-gray-700 rounded-2xl text-white placeholder-gray-600 focus:border-[#0cf] outline-none transition-all shadow-inner" />
              <button onClick={handleAsk} disabled={isAsking || !input.trim()} className="absolute right-3 p-3 bg-[#0cf]/20 text-[#0cf] rounded-xl hover:bg-[#0cf]/30 disabled:opacity-50"><Send className="w-6 h-6" /></button>
            </div>
          </div>
        </section>
      </main>

      <AIProcessOverlay metrics={metrics} title="Knowledge Engine" modelName="gemini-embedding-001" />
    </div>
  );
}
