"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, BookOpen, CheckCircle2, AlertCircle } from 'lucide-react';
import { ActionButton } from '@/components/ActionButton';
import { saveImportedBooks, BookData } from './actions';
import MessageBox from '@/components/MessageBox';
import { AIProcessOverlay, AIMetrics } from '@/components/AI/AIProcessOverlay';

export default function LibraryImportPage() {
  const [text, setText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
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

  const handleImport = async () => {
    if (!text.trim()) {
      setError("テキストを入力してください。");
      return;
    }

    setIsImporting(true);
    setResult(null);
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
      debug_log: 'Uplinking text data...',
    });

    try {
      // 1. AIストリーミング解析
      const response = await fetch('/api/ai/bookshelf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `AI analysis failed (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('ReadableStream error');
      const decoder = new TextDecoder();
      
      let parsedBooks: BookData[] | null = null;

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
            setAiMetrics(prev => ({ ...prev, total_latency: latency, status: 'thinking', debug_log: 'Analyzing text format...' }));
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
                setAiMetrics(prev => ({ ...prev, status: 'generating', debug_log: 'Extracting book data...' }));
              }
              fullText += data.text;
              tokensGenerated += data.text.length * 0.75;
              const timeFromFirst = (Date.now() - firstChunkTime) / 1000;
              const tps = timeFromFirst > 0 ? tokensGenerated / timeFromFirst : 0;
              setAiMetrics(prev => ({ ...prev, current_tps: tps }));
            }
          }

          if (data.type === 'done') {
            setAiMetrics(prev => ({ ...prev, status: 'completed', input_tokens: data.usage?.promptTokenCount || 0, debug_log: 'Extraction complete' }));
            
            const jsonMatch = fullText.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error("JSON parse error: Could not find valid array.");
            parsedBooks = JSON.parse(jsonMatch[0]);
          }

          if (data.type === 'error') {
            setAiMetrics(prev => ({ ...prev, status: 'error', debug_log: data.message }));
            return;
          }
        }
      }

      if (!parsedBooks || parsedBooks.length === 0) {
        throw new Error("書籍データを抽出できませんでした。");
      }

      // 2. DBへの保存処理 (Server Action)
      const saveResult = await saveImportedBooks(parsedBooks);
      setResult(saveResult);

    } catch (err: any) {
      console.error(err);
      setAiMetrics(prev => ({ ...prev, status: 'error', debug_log: err.message }));
      setError(err.message || "予期せぬエラーが発生しました。");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      <AIProcessOverlay 
        metrics={aiMetrics} 
        thoughtText={thoughtText} 
        title="Library Data Extractor" 
        modelName="Gemini 2.5 Flash"
      />

      {/* 共通ヘッダー */}
      <header className="p-4 sm:p-6 flex justify-between items-center bg-white border-b border-gray-200 sticky top-0 z-20">
        <Link href="/bookshelf/scan" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          アプリポータルへ戻る
        </Link>
        <div className="text-gray-500 font-mono text-sm hidden sm:block">
          Library Importer v2.0 (AI Powered)
        </div>
      </header>

      <main className="p-4 sm:p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-indigo-600" />
            貸出履歴スマートインポート
          </h1>
          <p className="text-gray-600">
            図書館サイトの貸出履歴やAmazonの購入履歴などをそのまま貼り付けてください。
            AIがフォーマットの違いを吸収し、自動的にタイトルや著者を抽出して蔵書リストに追加します。
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <label htmlFor="history-text" className="block text-sm font-bold text-gray-700 mb-2">
            履歴テキスト（書式自由）
          </label>
          <textarea
            id="history-text"
            rows={12}
            className="w-full p-4 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-sm mb-4"
            placeholder={`例：
【貸出中】ブルシット・ジョブの謎 (酒井隆史) 2026/02/24返却予定
または
タイトル: ドーパミン中毒
著者: アンナ・レンブケ`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isImporting}
          />

          <ActionButton 
            onClick={handleImport} 
            disabled={isImporting || !text.trim()}
            className="w-full py-4 flex justify-center items-center gap-2"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                AI解析＆インポート中...
              </>
            ) : (
              "AIインポートを実行"
            )}
          </ActionButton>
        </div>

        {error && (
          <MessageBox 
            status="error" 
            title="インポート失敗" 
            description={error} 
            onClose={() => setError(null)} 
          />
        )}

        {result && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom duration-500">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                インポート結果
              </h2>
              <span className="text-sm font-medium text-gray-500">
                {result.processed} / {result.total} 件 完了
              </span>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <p className="text-xs text-blue-600 font-bold uppercase mb-1">AI検出件数</p>
                  <p className="text-2xl font-black text-blue-800">{result.total} 件</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl">
                  <p className="text-xs text-green-600 font-bold uppercase mb-1">保存成功</p>
                  <p className="text-2xl font-black text-green-800">{result.processed} 件</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    注意が必要な項目 ({result.errors.length})
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1 bg-gray-50 p-4 rounded-xl border border-gray-200 overflow-y-auto max-h-48 font-mono">
                    {result.errors.map((err: string, i: number) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-gray-400">•</span>
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-8 flex justify-center">
                <Link href="/bookshelf/scan" className="text-indigo-600 font-bold hover:underline">
                  蔵書リストを確認する →
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
