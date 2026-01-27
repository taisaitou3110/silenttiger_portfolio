"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // Add this import
import { getCalorieEstimation } from '@/app/calorie/scan/actions';
import { saveMealLog } from '@/app/calorie/actions'; // Renamed to saveCalorieLog previously

export default function CalorieScanner({ mode = 'estimate' }: { mode?: 'estimate' | 'train' }) {
  const router = useRouter(); // Initialize useRouter
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [manualCalories, setManualCalories] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimation, setEstimation] = useState<any>(null); // To store Gemini's estimation
  const [isRegistering, setIsRegistering] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setEstimation(null); // Clear previous estimation
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
      const base64Data = base64EncodedImage.split(',')[1];

      const geminiEstimation = await getCalorieEstimation(base64Data, mimeType);
      setEstimation(geminiEstimation);
    } catch (err: any) {
      console.error("Error during estimation:", err);
      setError(err.message || 'カロリー推定に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterMeal = async () => {
    if (!estimation) {
      setError('推定結果がありません。');
      return;
    }

    setIsRegistering(true); // Set loading state
    try {
      await saveMealLog({
        foodName: estimation.foodName,
        calories: estimation.calories,
        advice: estimation.advice,
        imagePath: imagePreview || undefined, // Save image preview URL
        inputSource: 'photo',
      });
      alert('食事を保存しました！');
      // Optionally, clear form or redirect
      setImage(null);
      setImagePreview(null);
      setEstimation(null);
    } catch (err: any) {
      console.error("Error saving meal:", err);
      setError(err.error || '食事の保存に失敗しました。');
    } finally {
      setIsRegistering(false); // Reset loading state
    }
  };

  // --- ここからが return 部分 ---
  return (
    <div className="p-8 max-w-2xl mx-auto bg-white rounded-lg shadow-md mt-10 text-gray-900">
      <button
        onClick={() => router.back()}
        className="mb-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
      >
        ← 戻る
      </button>
      <h1 className="text-3xl font-bold mb-6 text-center">
        {mode === 'train' ? '写真とカロリーを登録' : 'AIカロリー推定'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            食事の写真をアップロード
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="mx-auto h-48 w-full object-contain" />
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
            </div>
          </div>
        </div>

        {mode === 'train' && (
          <div>
            <label htmlFor="manual-calories" className="block text-sm font-medium text-gray-700">
              手動でカロリーを入力 (kcal)
            </label>
            <input
              type="number"
              id="manual-calories"
              value={manualCalories || ''}
              onChange={(e) => setManualCalories(Number(e.target.value))}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              placeholder="例: 500"
            />
          </div>
        )}

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400"
          disabled={loading || !image}
        >
          {loading ? '推定中...' : mode === 'train' ? '画像とカロリーを送信' : 'AIでカロリー推定'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          <p>{error}</p>
        </div>
      )}

      {estimation && (
        <div className="mt-6 p-4 bg-gray-50 rounded-md shadow-inner border border-gray-200">
          <h2 className="text-xl font-semibold mb-2 text-indigo-900">推定結果:</h2>
          <p className="text-sm mb-1"><strong>料理名:</strong> {estimation.foodName}</p>
          <p className="text-sm mb-1"><strong>推定合計:</strong> <span className="text-lg text-red-600 font-bold">{estimation.calories}</span> kcal</p>
          <p className="text-sm mb-1"><strong>内訳:</strong> {estimation.breakdown}</p>
          <p className="text-sm text-green-700 font-medium"><strong>💡 アドバイス:</strong> {estimation.advice}</p>

          <button
            onClick={handleRegisterMeal}
            className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
            disabled={isRegistering}
          >
            {isRegistering ? '登録中...' : '食事を記録する'}
          </button>
        </div>
      )}
    </div>
  );
}