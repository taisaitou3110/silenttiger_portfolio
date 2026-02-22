// app/bookshelf/scan/page.tsx
"use client";

import { useState, FormEvent, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import CameraView from '@/app/bookshelf/components/CameraView';
import MessageBox from '@/components/MessageBox';
import FFMessageBox from '@/components/FFMessageBox';
import { ActionButton } from '@/components/ActionButton';

const ScanPage = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [cameraAccessError, setCameraAccessError] = useState<string | null>(null);
  const [isbnInput, setIsbnInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const isNavigatingRef = useRef(false);

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">ISBNで書籍を検索</h1>

      {/* カメラ表示エリア */}
      <div className="w-full max-w-md mx-auto border-2 border-gray-300 rounded-lg overflow-hidden mb-4">
        {cameraAccessError ? (
          <div className="flex items-center justify-center h-64 bg-red-100 text-red-700">
            <p className="text-center p-4">{cameraAccessError}</p>
          </div>
        ) : (
          <div className="relative">
            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
                <ActionButton onClick={() => setIsScanning(true)}>
                  スキャン開始
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
      <form onSubmit={handleManualSubmit} className="w-full max-w-md">
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={isbnInput}
            onChange={(e) => setIsbnInput(e.target.value.replace(/\D/g, ''))}
            placeholder="ISBNコード(ハイフンなし)"
            className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <ActionButton type="submit">検索</ActionButton>
        </div>
      </form>
      
      {error && <div className="mt-4 w-full max-w-md"><MessageBox status="error" title="入力エラー" description={error} onClose={() => setError(null)} /></div>}

      <div className="mt-4">
        <FFMessageBox message={displayMessage} />
      </div>
      
      {cameraAccessError && (
        <div className="mt-4 text-center text-sm text-gray-600 max-w-md">
          <p>【トラブルシューティング】</p>
          <ul className="list-disc list-inside text-left">
            <li>ブラウザ（Chrome, Safariなど）の設定で、このサイトのカメラアクセスが「ブロック」されていないか確認してください。</li>
            <li>別のアプリがカメラを使用している場合は、そのアプリを閉じてから再度お試しください。</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ScanPage;
