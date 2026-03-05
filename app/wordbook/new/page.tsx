"use client";

import { useState } from "react";
import { saveWord } from "../actions";
import { useRouter } from "next/navigation";
import MessageBox from "@/components/MessageBox";
import { AIProcessOverlay, AIMetrics } from "@/components/AI/AIProcessOverlay";

export default function NewWordPage() {
  const [term, setTerm] = useState("");
  const [suggestions, setSuggestions] = useState<any>(null);
  const [loading, setLoading] = useState(false);
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

  const handleConsultAI = async () => {
    if (!term.trim()) return;

    setLoading(true);
    setSuggestions(null);
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
      debug_log: 'Uplinking term...',
    });

    try {
      const response = await fetch('/api/ai/wordbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'suggest',
          term
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
              debug_log: 'Defining semantics...'
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
                setAiMetrics(prev => ({ ...prev, status: 'generating', debug_log: 'Generating examples...' }));
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
            setSuggestions(JSON.parse(jsonMatch[0]));
          }

          if (data.type === 'error') {
            setAiMetrics(prev => ({ ...prev, status: 'error', debug_log: data.message }));
            return;
          }
        }
      }
    } catch (err: any) {
      console.error("Error:", err);
      setAiMetrics(prev => ({ ...prev, status: 'error', debug_log: err.message }));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!suggestions) return;
    setLoading(true);
    try {
      await saveWord({ 
        term, 
        meaning: suggestions.meaning,
        phonetic: suggestions.phonetic,
        scene: "AI Consultation",
        examples: suggestions.examples 
      });
      setMessage({ type: 'success', text: '単語を保存しました。' });
      setTimeout(() => {
        router.push("/wordbook");
        router.refresh(); 
      }, 2000);
    } catch (error) {
      setMessage({ type: 'error', text: '保存に失敗しました。' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-20 overflow-y-auto">
      <AIProcessOverlay metrics={aiMetrics} thoughtText={thoughtText} title="Semantic Link Processor" modelName="Gemini 2.5 Flash" />
      
      {message && (
        <MessageBox 
          status={message.type} 
          title={message.type === 'success' ? '成功' : 'エラー'}
          description={message.text} 
          onClose={() => setMessage(null)} 
        />
      )}
      <h1 className="text-[#0cf] font-bold text-2xl mb-6">新知識のインポート</h1>
      
      <div className="space-y-6 max-w-md mx-auto">
        {/* 単語入力 */}
        <div>
          <label className="block text-xs text-gray-500 mb-2">TARGET WORD</label>
          <div className="flex gap-2">
            <input 
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 outline-none focus:border-[#0cf]"
              placeholder="例: compliment"
              disabled={loading}
            />
            <button 
              onClick={handleConsultAI}
              disabled={loading || !term}
              className="bg-[#0cf] text-black px-4 rounded-xl font-bold text-sm disabled:opacity-50 transition-all active:scale-[0.95]"
            >
              {loading ? "分析中..." : "AI相談"}
            </button>
          </div>
        </div>

        {/* AIの提案結果 */}
        {suggestions && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-4 bg-gray-900 rounded-2xl border border-[#0cf]/20">
              <p className="text-[#0cf] font-bold text-xl">{term}</p>
              <p className="text-gray-400 font-mono text-sm">{suggestions.phonetic}</p>
              <p className="mt-2 text-white text-lg font-bold">{suggestions.meaning}</p>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-2">EXAMPLES & COLLOCATIONS (MAX 10)</label>
              <div className="space-y-3">
                {suggestions.examples.map((ex: any, i: number) => (
                  <div key={i} className="p-3 bg-gray-900/50 border border-gray-800 rounded-xl text-sm hover:border-[#0cf]/30 transition-colors">
                    <p className="text-white mb-1 leading-relaxed">{ex.text}</p>
                    <p className="text-[#0cf] text-[10px] font-mono uppercase tracking-widest">Core: {ex.collocation}</p>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={handleSave}
              disabled={loading}
              className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-bold shadow-lg shadow-green-900/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              この内容でデータベースへ保存
            </button>
          </div>
        )}
      </div>
    </div>
  );
}