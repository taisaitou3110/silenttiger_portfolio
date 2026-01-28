import Link from 'next/link';
import versionData from '@/app/version.json';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-12 lg:p-24 bg-gray-100">
      <div className="w-full max-w-4xl text-center mb-12">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-800 mb-4">
          経営支援ダッシュボード
        </h1>
        <p className="text-xl text-gray-600">
          あなたのビジネスをサポートするツールセット
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-4xl">
        {/* 左側: メインの4つのカード */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:w-3/4">
          {/* 簡易経営管理ツール */}
          <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">簡易経営管理ツール <span className="text-sm font-normal text-gray-500 ml-2">v{versionData.apps.dashboard}</span></h2>
            <p className="text-gray-600 mb-6">
              損益計算書 (P/L) 形式でビジネスの財務状況をシミュレーション。売上高、販管費などの各項目をクリックして詳細な内訳を編集できます。
              ランダムデータ生成や業種別プリセットで、多様なシナリオを素早く試すことが可能です。
            </p>
            <Link href="/dashboard" className="mt-auto px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition duration-300">
              ツールを開く
            </Link>
          </div>

          {/* Wikipedia風単語帳 */}
          <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Wikipedia風単語帳 <span className="text-sm font-normal text-gray-500 ml-2">v{versionData.apps.wordbook}</span></h2>
            <p className="text-gray-600 mb-6">
              あなたの学習メモから単語と定義を登録できるパーソナル単語帳。単語の追加、削除、検索機能に加え、JSONファイルからのインポートにも対応。
              英単語学習や専門用語の整理に役立ちます。
            </p>
            <Link href="/wordbook" className="mt-auto px-8 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition duration-300">
              ツールを開く
            </Link>
          </div>

          {/* カロリー記録アプリ */}
          <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">カロリー記録アプリ <span className="text-sm font-normal text-gray-500 ml-2">v{versionData.apps.calorie}</span></h2>
            <p className="text-gray-600 mb-6">
              写真を撮るだけでAIがカロリーを推定し、目標達成を視覚的にサポートします。日々の食事管理を効率化しましょう。
            </p>
            <Link href="/calorie" className="mt-auto px-8 py-3 bg-red-600 text-white text-lg font-semibold rounded-lg hover:bg-red-700 transition duration-300">
              ツールを開く
            </Link>
          </div>

          {/* ポーカーゲーム */}
          <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">ポーカーゲーム <span className="text-sm font-normal text-gray-500 ml-2">v{versionData.apps.poker}</span></h2>
            <p className="text-gray-600 mb-6">
              コンピュータとポーカーで対戦できます。戦略を練って勝利を目指しましょう！
            </p>
            <Link href="/poker" className="mt-auto px-8 py-3 bg-purple-600 text-white text-lg font-semibold rounded-lg hover:bg-purple-700 transition duration-300">
              ゲームを開始
            </Link>
          </div>

          {/* Pencil App */}
          <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Pencil App <span className="text-sm font-normal text-gray-500 ml-2">v{versionData.apps.pencil}</span></h2>
            <p className="text-gray-600 mb-6">
              ペットボトルロケットの物理演算をシミュレートするゲームアプリです。
            </p>
            <Link href="/pencil" className="mt-auto px-8 py-3 bg-indigo-600 text-white text-lg font-semibold rounded-lg hover:bg-indigo-700 transition duration-300">
              アプリを開く
            </Link>
          </div>
        </div>

        {/* 右側: フィードバックと開発日記 */}
        <div className="flex flex-col gap-8 lg:w-1/4">
          {/* フィードバック掲示板 */}
          <div className="bg-white rounded-lg shadow-xl p-4 flex flex-col items-center text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">フィードバック掲示板 <span className="text-xs font-normal text-gray-500 ml-2">v{versionData.apps.feedback}</span></h2>
            <p className="text-gray-600 text-sm mb-4">
              ご意見・ご要望をお寄せください。
            </p>
            <Link href="/feedback" className="px-4 py-2 bg-yellow-600 text-white text-sm font-semibold rounded-lg hover:bg-yellow-700 transition duration-300">
              掲示板を開く
            </Link>
          </div>

          {/* 開発日記 */}
          <div className="bg-white rounded-lg shadow-xl p-4 flex flex-col items-center text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">開発日記 <span className="text-xs font-normal text-gray-500 ml-2">v{versionData.apps.devlog}</span></h2>
            <p className="text-gray-600 text-sm mb-4">
              日々の開発記録を綴りましょう。
            </p>
            <Link href="/devlog" className="px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition duration-300">
              日記を見る
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
