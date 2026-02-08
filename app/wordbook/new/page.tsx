"use client";

import { useState } from "react";
import { generateWordSuggestions, saveWord } from "../actions";
import { useRouter } from "next/navigation";

export default function NewWordPage() {
  const [term, setTerm] = useState("");
  const [suggestions, setSuggestions] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleConsultAI = async () => {
    setLoading(true);
    try {
      const data = await generateWordSuggestions(term);
      setSuggestions(data);
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
      scene: "AI Consultation", // 必要に応じて入力欄を作ってもOK
      examples: suggestions.examples 
    });
    // キャッシュを更新して戻る
    router.push("/wordbook");
    router.refresh(); 
  } catch (error) {
    alert("保存に失敗しました");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-20 overflow-y-auto">
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
            />
            <button 
              onClick={handleConsultAI}
              disabled={loading || !term}
              className="bg-[#0cf] text-black px-4 rounded-xl font-bold text-sm disabled:opacity-50"
            >
              {loading ? "分析中..." : "AI相談"}
            </button>
          </div>
        </div>

        {/* AIの提案結果 */}
        {suggestions && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="p-4 bg-gray-900 rounded-2xl border border-[#0cf]/20">
              <p className="text-[#0cf] font-bold text-xl">{term}</p>
              <p className="text-gray-400">{suggestions.phonetic}</p>
              <p className="mt-2 text-white">{suggestions.meaning}</p>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-2">EXAMPLES & COLLOCATIONS (MAX 10)</label>
              <div className="space-y-3">
                {suggestions.examples.map((ex: any, i: number) => (
                  <div key={i} className="p-3 bg-gray-900/50 border border-gray-800 rounded-xl text-sm">
                    <p className="text-white mb-1">{ex.text}</p>
                    <p className="text-[#0cf] text-[10px] font-mono">LINK: {ex.collocation}</p>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={handleSave}
              className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold shadow-lg shadow-green-900/20"
            >
              この内容でデータベースへ保存
            </button>
          </div>
        )}
      </div>
    </div>
  );
}