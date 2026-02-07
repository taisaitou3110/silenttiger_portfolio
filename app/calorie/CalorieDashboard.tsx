"use client";

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import LoadingButton from '@/components/LoadingButton';
import { addQuickLog, copyPreviousDayLogs } from '@/app/calorie/actions';
import ErrorHandler from '@/components/ErrorHandler';

// Wrapper component for the QuickLog form to manage its own state
function QuickLogForm({ meal }: { meal: { foodName: string; calories: number } }) {
  const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
    try {
      await addQuickLog(meal.foodName, meal.calories);
      return { error: null, success: true };
    } catch (error) {
      return { error: error, success: false };
    }
  }, { error: null, success: false });

  const { pending } = useFormStatus();

  return (
    <form action={formAction}>
      <LoadingButton
        type="submit"
        isLoading={pending}
        loadingText="登録中..."
        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-full text-sm"
      >
        {meal.foodName} ({meal.calories} kcal)
      </LoadingButton>
      {state?.error && <ErrorHandler error={state.error} />}
    </form>
  );
}

// Wrapper component for the CopyLogs form
function CopyLogsForm() {
  const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
    try {
      await copyPreviousDayLogs();
      return { error: null, success: true };
    } catch (error) {
      return { error: error, success: false };
    }
  }, { error: null, success: false });

  const { pending } = useFormStatus();

  return (
    <form action={formAction}>
      <LoadingButton
        type="submit"
        isLoading={pending}
        loadingText="コピー中..."
        className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-md"
      >
        前日の記録を今日にコピー
      </LoadingButton>
      {state?.error && <ErrorHandler error={state.error} />}
    </form>
  );
}

export default function CalorieDashboard({
  version,
  todaysCalories,
  targetCalories,
  remainingCalories,
  sevenDayAverage,
  todaysCaloriesLogs,
  frequentMeals,
}: {
  version: string;
  todaysCalories: number;
  targetCalories: number;
  remainingCalories: number;
  sevenDayAverage: number;
  todaysCaloriesLogs: any[];
  frequentMeals: any[];
}) {
  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">カロリー記録アプリ - ダッシュボード <span className="text-sm font-normal text-gray-500 ml-2">v{version}</span></h1>
      
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="flex-1 bg-white rounded-lg shadow-md p-6 min-w-[300px]">
          <h2 className="text-2xl font-semibold mb-4">本日のカロリー</h2>
          <p className="text-xl">登録済みカロリー: <span className="font-bold text-blue-600">{todaysCalories} kcal</span></p>
          <p className="text-xl">目標カロリー: <span className="font-bold text-indigo-600">{targetCalories} kcal</span></p>
          <p className="text-xl">残りカロリー: <span className="font-bold text-red-600">{remainingCalories} kcal</span></p>
          <p className="text-sm text-gray-500 mt-2">※目標カロリー設定は設定画面で行えます。</p>
        </div>

        <div className="flex-1 bg-white rounded-lg shadow-md p-6 min-w-[300px]">
          <h2 className="text-2xl font-semibold mb-4">過去7日間の平均カロリー</h2>
          <p className="text-xl mb-4">平均: <span className="font-bold text-green-600">{sevenDayAverage.toFixed(0)} kcal</span></p>
          <Link href="/calorie/log" className="text-sm text-blue-600 hover:underline">
            詳細なログを見る →
          </Link>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">本日登録した食事</h2>
        {todaysCaloriesLogs.length === 0 ? (
          <p className="text-gray-500">まだ登録がありません。</p>
        ) : (
          <ul className="space-y-2">
            {todaysCaloriesLogs.map((log) => (
              <li key={log.id} className="flex justify-between items-center p-2 rounded-md bg-gray-50">
                <div>
                  <span className="font-semibold">{log.foodName}</span>
                  <span className="text-sm text-gray-500 ml-2">({log.inputSource})</span>
                </div>
                <span className="font-bold text-blue-600">{log.calories} kcal</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mt-8">
        <h2 className="text-2xl font-semibold mb-4">食事とカロリーを登録する</h2>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/calorie/scan" className="flex-1 min-w-[120px] max-w-[200px] text-center bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 transition duration-300">
            <span className="mr-2">📸</span> 写真
          </Link>
          <Link href="/calorie/scan?mode=train" className="flex-1 min-w-[120px] max-w-[200px] text-center bg-purple-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-purple-700 transition duration-300">
            <span className="mr-2">📈</span> 写真 (学習用)
          </Link>
          <Link href="/calorie/text" className="flex-1 min-w-[120px] max-w-[200px] text-center bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300">
            <span className="mr-2">📝</span> テキスト
          </Link>
          <Link href="/calorie/voice" className="flex-1 min-w-[120px] max-w-[200px] text-center bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-emerald-700 transition duration-300">
            <span className="mr-2">🎤</span> 音声
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mt-8">
        <h2 className="text-2xl font-semibold mb-4">クイック登録</h2>
        <div className="flex flex-wrap gap-2">
          {frequentMeals.length === 0 ? (
            <p className="text-gray-500">まだ登録がありません。食事を登録するとここに頻繁なメニューが表示されます。</p>
          ) : (
            frequentMeals.map((meal) => (
              <QuickLogForm key={meal.foodName} meal={meal} />
            ))
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mt-8">
        <h2 className="text-2xl font-semibold mb-4">前日の記録をコピー</h2>
        <CopyLogsForm />
      </div>
    </main>
  );
}