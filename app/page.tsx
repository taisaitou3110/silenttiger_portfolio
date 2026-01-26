import Link from 'next/link';

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* 簡易経営管理ツール */}
        <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">簡易経営管理ツール</h2>
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
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Wikipedia風単語帳</h2>
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
          <h2 className="text-3xl font-bold text-gray-800 mb-4">カロリー記録アプリ</h2>
          <p className="text-gray-600 mb-6">
            写真を撮るだけでAIがカロリーを推定し、目標達成を視覚的にサポートします。日々の食事管理を効率化しましょう。
          </p>
          <Link href="/calorie" className="mt-auto px-8 py-3 bg-red-600 text-white text-lg font-semibold rounded-lg hover:bg-red-700 transition duration-300">
            ツールを開く
          </Link>
        </div>

        {/* ポーカーゲーム */}
        <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">ポーカーゲーム</h2>
          <p className="text-gray-600 mb-6">
            コンピュータとポーカーで対戦できます。戦略を練って勝利を目指しましょう！
          </p>
          <Link href="/poker" className="mt-auto px-8 py-3 bg-purple-600 text-white text-lg font-semibold rounded-lg hover:bg-purple-700 transition duration-300">
            ゲームを開始
          </Link>
        </div>

        {/* フィードバック掲示板 */}
        <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">フィードバック掲示板</h2>
          <p className="text-gray-600 mb-6">
            アプリケーションに関するご意見・ご要望をお寄せください。開発の参考にさせていただきます。
          </p>
          <Link href="/feedback" className="mt-auto px-8 py-3 bg-yellow-600 text-white text-lg font-semibold rounded-lg hover:bg-yellow-700 transition duration-300">
            掲示板を開く
          </Link>
        </div>
      </div>
    </main>
  );
}
