"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, BookOpen, CheckCircle2, AlertCircle } from 'lucide-react';
import { ActionButton } from '@/components/ActionButton';
import { importLibraryHistory } from './actions';
import MessageBox from '@/components/MessageBox';

export default function LibraryImportPage() {
  const [text, setText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!text.trim()) {
      setError("テキストを入力してください。");
      return;
    }

    setIsImporting(true);
    setResult(null);
    setError(null);

    try {
      const data = await importLibraryHistory(text);
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      {/* 共通ヘッダー */}
      <header className="p-4 sm:p-6 flex justify-between items-center bg-white border-b border-gray-200 sticky top-0 z-20">
        <Link href="/bookshelf/scan" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          アプリポータルへ戻る
        </Link>
        <div className="text-gray-500 font-mono text-sm hidden sm:block">
          Library Importer v1.0
        </div>
      </header>

      <main className="p-4 sm:p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-indigo-600" />
            貸出履歴インポート
          </h1>
          <p className="text-gray-600">
            図書館サイトの貸出履歴をコピーして、こちらに貼り付けてください。
            AIがタイトルやISBNを解析し、あなたの蔵書リストに追加します。
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <label htmlFor="history-text" className="block text-sm font-bold text-gray-700 mb-2">
            コピーしたテキスト
          </label>
          <textarea
            id="history-text"
            rows={12}
            className="w-full p-4 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-sm mb-4"
            placeholder={`タイトル ： ブルシット・ジョブの謎
著者 ： 酒井　隆史／著
利用日 ： 2026/02/24

タイトル ： ドーパミン中毒
著者 ： アンナ・レンブケ／著
利用日 ： 2026/02/04`}
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
                解析中...
              </>
            ) : (
              "インポートを実行"
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
                  <p className="text-xs text-blue-600 font-bold uppercase mb-1">検出件数</p>
                  <p className="text-2xl font-black text-blue-800">{result.total} 件</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl">
                  <p className="text-xs text-green-600 font-bold uppercase mb-1">成功件数</p>
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
