"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingButton from '@/components/LoadingButton';
import { getCalorieEstimation } from '@/app/calorie/scan/actions';
import { saveMealLog } from '@/app/calorie/actions';
import ErrorHandler from './ErrorHandler';
import MessageBox from './MessageBox'; // Import MessageBox

export default function CalorieScanner({ mode = 'estimate' }: { mode?: 'estimate' | 'train' }) {
  const router = useRouter();
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [manualCalories, setManualCalories] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // State for success message
  const [estimation, setEstimation] = useState<any>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(null);
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('対応していない画像形式です。JPEG, PNG, WebP形式の画像をアップロードしてください。');
        setImage(null);
        setImagePreview(null);
        return;
      }
      const MAX_CLIENT_SIDE_FILE_SIZE_BYTES = 3 * 1024 * 1024; // 3MB
      if (file.size > MAX_CLIENT_SIDE_FILE_SIZE_BYTES) {
        setError(`ファイルサイズが大きすぎます（最大${MAX_CLIENT_SIDE_FILE_SIZE_BYTES / (1024 * 1024)}MB）。画像を圧縮するか、より小さいファイルをアップロードしてください。`);
        setImage(null);
        setImagePreview(null);
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setEstimation(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setEstimation(null);

    if (!image) {
      setError('画像をアップロードしてください。');
      setLoading(false);
      return;
    }

    try {
      const base64EncodedImage = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(image);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      });

      const mimeType = image.type;
      const geminiEstimation = await getCalorieEstimation(base64EncodedImage, mimeType);
      setEstimation(geminiEstimation);
    } catch (err: any) {
      console.error("Error during estimation:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterMeal = async () => {
    if (!estimation) {
      setError('推定結果がありません。');
      return;
    }
    setIsRegistering(true);
    setError(null);
    try {
      await saveMealLog({
        foodName: estimation.foodName,
        calories: estimation.calories,
        advice: estimation.advice,
        imagePath: imagePreview || undefined,
        inputSource: 'photo',
      });
      setSuccessMessage('食事の記録を保存しました！ダッシュボードで確認できます。');
      setImage(null);
      setImagePreview(null);
      setEstimation(null);
    } catch (err: any) {
      console.error("Error saving meal:", err);
      setError(err);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto bg-white rounded-lg shadow-md mt-10 text-gray-900">
      {successMessage && (
        <MessageBox
          status="success"
          title="保存完了"
          description={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}
      <button onClick={() => router.back()} className="mb-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
        ← 戻る
      </button>
      <h1 className="text-3xl font-bold mb-6 text-center">
        {mode === 'train' ? '写真とカロリーを登録' : 'AIカロリー推定'}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">食事の写真をアップロード</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="mx-auto h-48 w-full object-contain" />
                  {image && (
                    <p className="text-sm text-gray-500 mt-2">
                      ファイルサイズ: {(image.size / (1024 * 1024)).toFixed(2)} MB (タイプ: {image.type})
                    </p>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <span className="text-5xl mb-2">📸</span>
                  <p className="text-sm">カメラで撮影 または 選択</p>
                </div>
              )}
              <div className="flex text-sm text-gray-600 justify-center mt-4">
                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                  <span>ファイルをアップロード</span>
                  <input id="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">(対応形式: JPEG, PNG, WebP, 最大10MB)</p>
            </div>
          </div>
        </div>
        {mode === 'train' && (
          <div>
            <label htmlFor="manual-calories" className="block text-sm font-medium text-gray-700">手動でカロリーを入力 (kcal)</label>
            <input type="number" id="manual-calories" value={manualCalories || ''} onChange={(e) => setManualCalories(Number(e.target.value))} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" placeholder="例: 500" />
          </div>
        )}
                <LoadingButton
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400"
                  isLoading={loading || !image}
                  loadingText="推定中..."
                >
                  {mode === 'train' ? '画像とカロリーを送信' : 'AIでカロリー推定'}
                </LoadingButton>
              </form>
        
              {error && (<ErrorHandler 
                error={error} 
                onClose={() => setError(null)} />)}        
              {estimation && (
                <div className="mt-6 p-4 bg-gray-50 rounded-md shadow-inner border border-gray-200">
                  <h2 className="text-xl font-semibold mb-2 text-indigo-900">推定結果:</h2>
                  <p className="text-sm mb-1"><strong>料理名:</strong> {estimation.foodName}</p>
                  <p className="text-sm mb-1"><strong>推定合計:</strong> <span className="text-lg text-red-600 font-bold">{estimation.calories}</span> kcal</p>
                  <p className="text-sm mb-1"><strong>内訳:</strong> {estimation.breakdown}</p>
                  <p className="text-sm text-green-700 font-medium"><strong>💡 アドバイス:</strong> {estimation.advice}</p>
        
                  <LoadingButton
                    onClick={handleRegisterMeal}
                    className="mt-4 w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                    isLoading={isRegistering}
                    loadingText="登録中..."
                  >
                    食事を記録する
                  </LoadingButton>
        </div>
      )}
    </div>
  );
}