// app/bookshelf/scan/page.tsx
"use client";

import { useState, FormEvent, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import CameraView from '@/app/bookshelf/components/CameraView';
import MessageBox from '@/components/MessageBox';
import FFMessageBox from '@/components/FFMessageBox';
import { ActionButton } from '@/components/ActionButton';
import { GoldStatus } from '@/components/GoldStatus';
import { getUserGoldData } from '@/lib/actions';
// ✅ 追加：共通コンポーネントとガイド内容
import { WelcomeGuide } from '@/components/Navigation/WelcomeGuide';
import { GUIDE_CONTENTS } from '@/constants/guideContents';
import { useSessionFirstTime } from '@/hooks/useSessionFirstTime';

const ScanPage = () => {
  const router = useRouter();
  // ✅ 追加：ガイドの表示管理ロジック
  const { isOpen, markAsSeen, showAgain } = useSessionFirstTime('bookshelf-scan-guide');
  const [error, setError] = useState<string | null>(null);
  const [cameraAccessError, setCameraAccessError] = useState<string | null>(null);
  const [isbnInput, setIsbnInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [gold, setGold] = useState(0);
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    const fetchGold = async () => {
      const data = await getUserGoldData();
      setGold(data.gold);
    };
    fetchGold();
  }, []);

  const handleScanSuccess = useCallback((decodedText: string) => {
    if (isNavigatingRef.current) return;
    
    isNavigatingRef.current = true;
    setIsScanning(false);
    router.push(`/bookshelf/book/${decodedText}`);
  }, [router]);

  const handleScanFailure = useCallback((errorMessage: string) => {
    if (errorMessage.includes("NotAllowedError") || errorMessage.includes("NotFoundError")) {
      setCameraAccessError(`カメラへのアクセスがブロックされました。ブラウザの設定を確認してください。`);
      setIsScanning(false);
    } else {
      console.warn("Transient scan error:", errorMessage);
    }
  }, []);
  
  const handleManualSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const isbnRegex = /^(?:\d{10}|\d{13})$/;
    if (!isbnRegex.test(isbnInput)) {
      setError('有効なISBNコード（10桁または13桁の半角数字）を入力してください。');
      return;
    }
    
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    router.push(`/bookshelf/book/${isbnInput}`);
  };

  const handleScanStop = useCallback(() => {
    setIsScanning(false);
  }, []);

  const displayMessage = cameraAccessError
    ? "カメラが利用できません。\nブラウザの設定でカメラへのアクセスを許可してください。"
    : "カメラに本のバーコードをかざすか、下部のボックスに入力してください。";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ✅ 11.1：WelcomeGuide の配置（オーバーレイなので場所はどこでも良いがここが一般的） */}
    <WelcomeGuide 
      content={GUIDE_CONTENTS.BOOKSHELF_SCAN} 
      isOpen={isOpen} 
      onClose={markAsSeen} // 👈 ここで「閉じる ＋ セッション保存」を実行
    />

      {/* ✅ 10.1：第10章ルールに基づきヘッダーを修正 */}
<header className="p-4 sm:p-6 flex justify-between items-center bg-white border-b border-gray-200">
  <div className="flex items-center gap-4"> {/* gapで戻るボタンとの間隔を調整 */}
    <Link 
      href="/" 
      className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
    >
      <ArrowLeft className="w-5 h-5 mr-2" />
      アプリポータルへ戻る
    </Link>

    {/* ✅ 追加：使い方再確認ボタン */}
    <button 
      onClick={() => showAgain()} // 強制的に表示させる
      className="text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-1 transition-colors border-l pl-4 border-gray-300"
    >
      <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold">i</span>
      使い方を確認
    </button>
  </div>
  
  <GoldStatus amount={gold} />
</header>

      <main className="flex flex-col items-center p-4 sm:p-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">蔵書マネージャー</h1>

        <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">ISBNで書籍を検索</h2>
          
          {/* カメラ表示エリア */}
          <div className="w-full max-w-md mx-auto border-2 border-gray-200 rounded-xl overflow-hidden mb-6 bg-gray-50">
            {cameraAccessError ? (
              <div className="flex items-center justify-center h-64 bg-red-50 text-red-700">
                <p className="text-center p-4">{cameraAccessError}</p>
              </div>
            ) : (
              <div className="relative aspect-square sm:aspect-video bg-black">
                {!isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                    <ActionButton onClick={() => setIsScanning(true)}>
                      📸 スキャン開始
                    </ActionButton>
                  </div>
                )}
                <CameraView
                  isScanning={isScanning}
                  onScanSuccess={handleScanSuccess}
                  onScanFailure={handleScanFailure}
                  onScanStop={handleScanStop}
                />
              </div>
            )}
          </div>

          {/* 手動入力フォーム */}
          <form onSubmit={handleManualSubmit} className="w-full max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={isbnInput}
                onChange={(e) => setIsbnInput(e.target.value.replace(/\D/g, ''))}
                placeholder="ISBNコード(ハイフンなし)"
                className="flex-grow p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
              <ActionButton type="submit">検索</ActionButton>
            </div>
          </form>
          
          {error && (
            <div className="mt-4 w-full max-w-md mx-auto">
              <MessageBox status="error" title="入力エラー" description={error} onClose={() => setError(null)} />
            </div>
          )}
        </div>

        <div className="w-full max-w-md">
          <FFMessageBox message={displayMessage} />
        </div>
        
        {cameraAccessError && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm text-gray-600 w-full max-w-md">
            <p className="font-bold mb-2">【トラブルシューティング】</p>
            <ul className="list-disc list-inside space-y-1">
              <li>ブラウザの設定でカメラアクセスを「許可」してください。</li>
              <li>別のアプリがカメラを使用していないか確認してください。</li>
            </ul>
          </div>
        )}
      </main>
    </div>
  );
};

export default ScanPage;
