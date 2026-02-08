import { getDashboardData } from "./actions";
import Link from "next/link";

export default async function WordbookDashboard() {
  const data = await getDashboardData();

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden touch-none overscroll-behavior-none">
      {/* 共通ヘッダー */}
      <header className="p-6 flex justify-between items-center border-b border-gray-800 bg-gray-900/30">
        <div>
          <h1 className="text-[#0cf] font-mono font-bold text-xl tracking-tighter">KNOWLEDGE COSMOS</h1>
          <p className="text-[10px] text-gray-500">Memory Optimization System v1.0</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-yellow-900/20 border border-yellow-600/50 rounded-full">
          <span className="text-yellow-500">🪙</span>
          <span className="font-mono font-bold text-yellow-500">{data.gold}</span>
        </div>
      </header>

      {/* メイン統計 */}
      <main className="flex-1 p-6 flex flex-col justify-center max-w-md mx-auto w-full gap-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="p-6 bg-gradient-to-br from-gray-900 to-black border border-red-900/50 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-6xl">🧠</span>
            </div>
            <p className="text-red-500 text-sm font-bold mb-2">救出が必要な記憶</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-white">{data.reviewCount}</span>
              <span className="text-gray-500">nodes</span>
            </div>
          </div>

          <div className="p-6 bg-gray-900/50 border border-gray-800 rounded-3xl">
            <p className="text-gray-400 text-xs mb-1">総ネットワーク規模</p>
            <p className="text-2xl font-bold text-[#0cf]">{data.totalWords} <span className="text-sm font-normal text-gray-600">words connected</span></p>
          </div>
        </div>

        {/* ナビゲーション */}
        <nav className="flex flex-col gap-4">
          <Link href="/wordbook/quiz" className="py-5 bg-[#0cf] text-black rounded-2xl font-black text-center text-lg active:scale-[0.98] transition-all shadow-[0_0_25px_rgba(0,204,255,0.3)]">
            復習ミッション開始
          </Link>
          <Link href="/wordbook/new" className="py-5 bg-gray-800 text-[#0cf] rounded-2xl font-bold text-center text-lg border border-[#0cf]/30 active:scale-[0.98] transition-all">
            新知識のインポート
          </Link>
        </nav>
      </main>

      <footer className="p-4 border-t border-gray-800 text-center">
        <Link href="/wordbook/dictionary" className="text-xs text-gray-600 hover:text-[#0cf] transition-colors">
          知識データベース (Wikipedia風) を閲覧
        </Link>
      </footer>
    </div>
  );
}