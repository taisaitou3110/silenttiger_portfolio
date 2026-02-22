// app/calorie/voice/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import LoadingButton from '@/components/LoadingButton'; // Import LoadingButton
import { saveCalorieLogFromVoice } from '@/app/calorie/voice/actions';

export default function VoiceCalorieInputPage() {
  const [transcribedText, setTranscribedText] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);

    const formData = new FormData();
    formData.append('transcribedText', transcribedText);

    const result = await saveCalorieLogFromVoice(formData);
    setResponse(result);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="p-4 sm:p-8 max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/calorie" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            アプリポータルへ戻る
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8">声でカロリーを登録</h1>
        <p className="mb-4 text-gray-700">
          現在のところ、マイク入力はシミュレーションです。下記テキストエリアに口語表現を入力して試してください。
        </p>
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <label htmlFor="transcribedText" className="block text-gray-700 text-sm font-bold mb-2">
              音声入力 (テキストシミュレーション):
            </label>
            <textarea
              id="transcribedText"
              name="transcribedText"
              rows={5}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="例: いつもの野菜炒めを半分と、ご飯"
              value={transcribedText}
              onChange={(e) => setTranscribedText(e.target.value)}
              required
            ></textarea>
          </div>
          <LoadingButton
            type="submit"
            isLoading={loading}
            loadingText="処理中..."
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            登録
          </LoadingButton>
        </form>

        {response && response.error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
            <p>エラー: {response.error}</p>
          </div>
        )}
        {response && response.success && (
          <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md">
            <p>登録しました！</p>
          </div>
        )}
         {response && response.clarificationNeeded && (
          <div className="mt-4 p-3 bg-yellow-100 text-yellow-700 rounded-md">
            <p>確認が必要です: {response.clarificationQuestion}</p>
            <p className="mt-2 text-sm">回答をテキストエリアに入力して再登録してください。</p>
          </div>
        )}
      </main>
    </div>
  );
}