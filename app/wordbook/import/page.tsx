"use client";

import { useState } from "react";
import { saveWords } from "../actions";
import { useRouter } from "next/navigation";
import MessageBox from "@/components/MessageBox";
import { AIProcessOverlay, AIMetrics } from "@/components/AI/AIProcessOverlay";

export default function ImportWordsPage() {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [thoughtText, setThoughtText] = useState('');
  const router = useRouter();

  // メトリクス状態
  const [aiMetrics, setAiMetrics] = useState<AIMetrics>({
    input_tokens: 0,
    thought_seconds: 0,
    current_tps: 0,
    total_latency: 0,
    status: 'idle',
    debug_log: '',
  });

  const handleBatchImport = async () => {
    if (!notes.trim()) return;

    setLoading(true);
    setMessage(null);
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
      debug_log: 'Uplinking notes...',
    });

    try {
      const response = await fetch('/api/ai/wordbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bulk',
          text: notes
        }),
      });

      if (!response.ok) throw new Error('Analysis failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('ReadableStream error');
      const decoder = new TextDecoder();
      
      let parsedResult: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);

            if (data.type === 'event' && data.data === 'first_chunk') {
              firstChunkTime = Date.now();
              const latency = (firstChunkTime - startTime) / 1000;
              setAiMetrics(prev => ({ 
                ...prev, 
                total_latency: latency,
                status: 'thinking',
                debug_log: 'Extracting knowledge...'
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
                  setAiMetrics(prev => ({ ...prev, status: 'generating', debug_log: 'Structuring JSON...' }));
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
              parsedResult = JSON.parse(jsonMatch[0]);
            }

            if (data.type === 'error') throw new Error(data.message);
          } catch (e) {
            console.error("Parse Error:", e);
          }
        }
      }

      if (parsedResult && parsedResult.words) {
        const saveResult = await saveWords(parsedResult.words);
        setMessage({ type: 'success', text: `${saveResult.count}個の単語を保存しました。` });
        setTimeout(() => {
          router.push("/wordbook");
          router.refresh();
        }, 2000);
      }
    } catch (error: any) {
      console.error("Error:", error);
      setAiMetrics(prev => ({ ...prev, status: 'error', debug_log: error.message }));
      setMessage({ type: 'error', text: `エラーが発生しました: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-20 overflow-y-auto">
      <AIProcessOverlay metrics={aiMetrics} thoughtText={thoughtText} title="Knowledge Extract Link" modelName="Gemini 2.5 Flash" />
      
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
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 outline-none focus:border-[#0cf] text-sm"
            placeholder="ここに学習メモを貼り付けてください..."
            rows={10}
            maxLength={1000}
            disabled={loading}
          />
        </div>
        <button 
          onClick={handleBatchImport}
          disabled={loading || !notes}
          className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-bold shadow-lg shadow-purple-900/20 disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          {loading ? "処理中..." : "メモから単語を抽出・登録"}
        </button>
      </div>
    </div>
  );
}
