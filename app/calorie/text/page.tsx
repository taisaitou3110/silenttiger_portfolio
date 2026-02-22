// app/calorie/text/page.tsx
"use client";

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom'; // Import useFormStatus
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import LoadingButton from '@/components/LoadingButton'; // Import LoadingButton
import { saveCalorieLogFromText } from '@/app/calorie/text/actions';

// New SubmitButton component
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <LoadingButton
      type="submit"
      isLoading={pending}
      loadingText="登録中..."
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
    >
      登録
    </LoadingButton>
  );
}

export default function TextCalorieInputPage() {
  const [state, formAction] = useActionState(saveCalorieLogFromText, { success: false });

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="p-4 sm:p-8 max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/calorie" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            アプリポータルへ戻る
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8">テキストでカロリーを登録</h1>
        <form action={formAction} className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <label htmlFor="foodDescription" className="block text-gray-700 text-sm font-bold mb-2">
              食事内容を入力してください:
            </label>
            <textarea
              id="foodDescription"
              name="foodDescription"
              rows={5}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="例: 牛丼と卵、いつもの野菜炒めを半分"
              required
            ></textarea>
          </div>
          <SubmitButton /> {/* Use the new SubmitButton component */}

          {state?.success === true && (
            <p className="text-green-500 mt-4">登録しました！</p>
          )}
          {state?.success === false && state.error && (
            <p className="text-red-500 mt-4">{state.error}</p>
          )}
        </form>
      </main>
    </div>
  );
}