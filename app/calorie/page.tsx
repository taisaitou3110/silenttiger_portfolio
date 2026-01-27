import prisma from '@/lib/prisma';
import Link from 'next/link';
import versionData from '@/app/version.json'; // Import version data
import { addQuickLog, copyPreviousDayLogs } from './actions'; // Import new actions

export const dynamic = "force-dynamic"; // これを追加

export default async function CalorieDashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of today

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7); // Set to start of 7 days ago

  // Fetch user settings (assuming a default user for now)
  const userSettings = await prisma.userSettings.findFirst();
  const targetCalories = userSettings?.targetCalories || 2000; // Default to 2000 if not set

  // Fetch today's calorie logs
  const todaysCaloriesLogs = await prisma.calorieLog.findMany({
    where: {
      date: {
        gte: today,
      },
      userId: userSettings?.id, // Filter by user if available
    },
    select: {
      calories: true,
    },
  });

  const todaysCalories = todaysCaloriesLogs.reduce((sum, log) => sum + log.calories, 0);
  const remainingCalories = targetCalories - todaysCalories;

  // Fetch past 7 days' calorie logs (including today)
  const past7DaysCaloriesLogs = await prisma.calorieLog.findMany({
    where: {
      date: {
        gte: sevenDaysAgo,
      },
      userId: userSettings?.id, // Filter by user if available
    },
    select: {
      date: true,
      calories: true,
    },
  });

  const past7DaysTotalCalories = past7DaysCaloriesLogs.reduce((sum, log) => sum + log.calories, 0);

  // Calculate 7-day average
  // Get unique days in the last 7 days
  const uniqueDates = new Set(past7DaysCaloriesLogs.map(log => new Date(log.date).toDateString()));
  const numberOfDays = uniqueDates.size > 0 ? uniqueDates.size : 1; // Avoid division by zero
  const sevenDayAverage = past7DaysTotalCalories / numberOfDays;


  // Fetch past logs to determine frequent meals for quick buttons
  const allCalorieLogs = await prisma.calorieLog.findMany({
    where: {
      userId: userSettings?.id,
    },
    select: {
      foodName: true,
      calories: true,
    },
    orderBy: {
      date: 'desc',
    },
    take: 100, // Look at recent 100 logs for frequency
  });

  const mealFrequency: { [key: string]: { count: number; totalCalories: number } } = {};
  allCalorieLogs.forEach(log => {
    if (!mealFrequency[log.foodName]) {
      mealFrequency[log.foodName] = { count: 0, totalCalories: 0 };
    }
    mealFrequency[log.foodName].count++;
    mealFrequency[log.foodName].totalCalories += log.calories;
  });

  const frequentMeals = Object.entries(mealFrequency)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5) // Top 5 frequent meals
    .map(([foodName, data]) => ({
      foodName,
      calories: Math.round(data.totalCalories / data.count), // Average calories
    }));

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">カロリー記録アプリ - ダッシュボード <span className="text-sm font-normal text-gray-500 ml-2">v{versionData.apps.calorie}</span></h1>
      
      <div className="flex flex-wrap gap-4 mb-8"> {/* Added flex container */}
        <div className="flex-1 bg-white rounded-lg shadow-md p-6 min-w-[300px]"> {/* Adjusted for flex-1 */}
          <h2 className="text-2xl font-semibold mb-4">本日のカロリー</h2>
          <p className="text-xl">登録済みカロリー: <span className="font-bold text-blue-600">{todaysCalories} kcal</span></p>
          <p className="text-xl">目標カロリー: <span className="font-bold text-indigo-600">{targetCalories} kcal</span></p>
          <p className="text-xl">残りカロリー: <span className="font-bold text-red-600">{remainingCalories} kcal</span></p>
          <p className="text-sm text-gray-500 mt-2">※目標カロリー設定は設定画面で行えます。</p>
        </div>

        <div className="flex-1 bg-white rounded-lg shadow-md p-6 min-w-[300px]"> {/* Adjusted for flex-1 */}
          <h2 className="text-2xl font-semibold mb-4">過去7日間の平均カロリー</h2>
          <p className="text-xl">平均: <span className="font-bold text-green-600">{sevenDayAverage.toFixed(0)} kcal</span></p>
        </div>
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

      {/* クイック登録ボタン */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-8">
        <h2 className="text-2xl font-semibold mb-4">クイック登録</h2>
        <div className="flex flex-wrap gap-2">
          {frequentMeals.length === 0 ? (
            <p className="text-gray-500">まだ登録がありません。食事を登録するとここに頻繁なメニューが表示されます。</p>
          ) : (
            frequentMeals.map((meal) => (
              <form key={meal.foodName} action={async () => {
                'use server';
                const { success, error } = await addQuickLog(meal.foodName, meal.calories);
                if (!success) {
                  console.error("Quick log failed:", error);
                  // Optionally, handle error display in UI
                }
                revalidatePath('/calorie');
              }}>
                <button type="submit" className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-full text-sm">
                  {meal.foodName} ({meal.calories} kcal)
                </button>
              </form>
            ))
          )}
        </div>
      </div>

      {/* 前日コピーボタン */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-8">
        <h2 className="text-2xl font-semibold mb-4">前日の記録をコピー</h2>
        <form action={async () => {
          'use server';
          const { success, error } = await copyPreviousDayLogs();
          if (!success) {
            console.error("Copy previous day failed:", error);
            // Optionally, handle error display in UI
          }
          revalidatePath('/calorie');
        }}>
          <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-md">
            前日の記録を今日にコピー
          </button>
        </form>
      </div>

      {/* TODO: ドーナツグラフ、ラインチャート、目標達成状況などを表示 */}
    </main>
  );
}
