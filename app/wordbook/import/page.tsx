"use client";

import { useState } from "react";
import { analyzeBulkText, saveWords } from "../actions";
import { useRouter } from "next/navigation";
import MessageBox from "@/components/MessageBox";

export default function ImportWordsPage() {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const router = useRouter();

  const handleBatchImport = async () => {
    setLoading(true);
    try {
      const result = await analyzeBulkText(notes);
      if (result && result.words) {
        const saveResult = await saveWords(result.words);
        setMessage({ type: 'success', text: `${saveResult.count}個の単語を保存しました。` });
        setTimeout(() => {
          router.push("/wordbook");
          router.refresh();
        }, 2000);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `エラーが発生しました: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-20 overflow-y-auto">
      {message && (
        <MessageBox 
          status={message.type} 
          title={message.type === 'success' ? '成功' : 'エラー'}
          description={message.text} 
          onClose={() => setMessage(null)} 
        />
      )}
      <h1 className="text-[#0cf] font-bold text-2xl mb-6">学習メモから一括インポート</h1>
      
      <div className="space-y-6 max-w-md mx-auto">
        <div>
          <label className="block text-xs text-gray-500 mb-2">英語学習メモ (最大1000文字)</label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 outline-none focus:border-[#0cf]"
            placeholder="ここに学習メモを貼り付けてください..."
            rows={10}
            maxLength={1000}
          />
        </div>
        <button 
          onClick={handleBatchImport}
          disabled={loading || !notes}
          className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold shadow-lg shadow-purple-900/20 disabled:opacity-50"
        >
          {loading ? "処理中..." : "メモから単語を抽出・登録"}
        </button>
      </div>
    </div>
  );
}
