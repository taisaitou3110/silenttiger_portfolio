// app/ai-dashboard/_components/test-button.tsx
"use client";

import { useState } from "react";
import { runTestAi } from "@/app/ai-dashboard/actions/test-run";

export function TestButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const res = await runTestAi();
    if (!res.success) alert("エラー: " + res.error);
    setLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`px-4 py-2 rounded-lg font-bold text-white transition-all ${
        loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700 active:scale-95"
      }`}
    >
      {loading ? "AI実行中..." : "🚀 テスト実行 (Wordbook)"}
    </button>
  );
}