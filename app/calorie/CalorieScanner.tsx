"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingButton from '@/components/LoadingButton';
import { saveMealLog } from '@/app/calorie/actions';
import ErrorHandler from '@/components/ErrorHandler';
import MessageBox from '@/components/MessageBox';
import { IMAGE_CONFIG } from '@/constants/config';
import { AIProcessOverlay, AIMetrics } from '@/components/AI/AIProcessOverlay';

export default function CalorieScanner({ mode = 'estimate' }: { mode?: 'estimate' | 'train' }) {
  const router = useRouter();
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [manualCalories, setManualCalories] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [estimation, setEstimation] = useState<any>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [thoughtText, setThoughtText] = useState('');

  // メトリクス状態
  const [aiMetrics, setAiMetrics] = useState<AIMetrics>({
    input_tokens: 0,
    thought_seconds: 0,
    current_tps: 0,
    total_latency: 0,
    status: 'idle',
    debug_log: '',
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(null);
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('VALIDATION_IMAGE_TYPE');
        setImage(null);
        setImagePreview(null);
        return;
      }

      if (file.size > IMAGE_CONFIG.MAX_FILE_SIZE_BYTES) {
        setError({message:`VALIDATION_IMAGE_SIZE` });
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
    if (!image) {
      setError({ message: 'VALIDATION_IMAGE_REQUIRED' });
      return;
    }

    setLoading(true);
    setError(null);
    setEstimation(null);
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
      debug_log: 'Uploading image...',
    });

    try {
      const base64EncodedImage = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(image);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      });

      const response = await fetch('/api/ai/calorie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'image',
          data: base64EncodedImage,
          mimeType: image.type,
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
              debug_log: 'Analyzing nutrition...'
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
                setAiMetrics(prev => ({ ...prev, status: 'generating', debug_log: 'Calculating calories...' }));
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
            setEstimation(JSON.parse(jsonMatch[0]));
          }

          if (data.type === 'error') {
            setAiMetrics(prev => ({ ...prev, status: 'error', debug_log: data.message }));
            return;
          }
        }
      }
    } catch (err: any) {
      console.error("Error during estimation:", err);
      setAiMetrics(prev => ({ ...prev, status: 'error', debug_log: err.message }));
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterMeal = async () => {
    if (!estimation) {
      setError({ message: 'VALIDATION_MISSING_ESTIMATION' });
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
      const errorToSet = err.message ? err : { message: 'DATA_SAVE_FAILED' };
      setError(errorToSet);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto bg-white rounded-lg shadow-md mt-10 text-gray-900">
      <AIProcessOverlay metrics={aiMetrics} thoughtText={thoughtText} title="Nutritional Sync Link" modelName="Gemini 2.5 Flash" />
      
      {successMessage && (
        <MessageBox
          status="success"
          title="保存完了"
          description={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}
      <button onClick={() => router.back()} className="mb-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">
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
                      ファイルサイズ: {(image.size / IMAGE_CONFIG.BYTES_PER_MB).toFixed(2)} MB (タイプ: {image.type})
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
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
          isLoading={loading}
          loadingText="推定中..."
          disabled={!image || loading}
        >
          {mode === 'train' ? '画像とカロリーを送信' : 'AIでカロリー推定'}
        </LoadingButton>
      </form>

      {error && (<ErrorHandler 
        error={error} 
        onClose={() => setError(null)} />)}        
      {estimation && (
        <div className="mt-6 p-4 bg-gray-50 rounded-md shadow-inner border border-gray-200 animate-in fade-in slide-in-from-top duration-500">
          <h2 className="text-xl font-semibold mb-2 text-indigo-900">推定結果:</h2>
          <p className="text-sm mb-1"><strong>料理名:</strong> {estimation.foodName}</p>
          <p className="text-sm mb-1"><strong>推定合計:</strong> <span className="text-lg text-red-600 font-bold">{estimation.calories}</span> kcal</p>
          <p className="text-sm mb-1"><strong>内訳:</strong> {estimation.breakdown}</p>
          <p className="text-sm text-green-700 font-medium"><strong>💡 アドバイス:</strong> {estimation.advice}</p>

          <LoadingButton
            onClick={handleRegisterMeal}
            className="mt-4 w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 transition-colors"
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