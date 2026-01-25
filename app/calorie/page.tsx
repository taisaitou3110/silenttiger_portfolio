import prisma from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = "force-dynamic"; // これを追加

export default async function CalorieDashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of today

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7); // Set to start of 7 days ago

  // Fetch today's meal logs
  const todaysMeals = await prisma.mealLog.findMany({
    where: {
      date: {
        gte: today,
      },
    },
    select: {
      calories: true,
    },
  });

  const todaysCalories = todaysMeals.reduce((sum, meal) => sum + meal.calories, 0);

  // Fetch past 7 days' meal logs (including today)
  const past7DaysMeals = await prisma.mealLog.findMany({
    where: {
      date: {
        gte: sevenDaysAgo,
      },
    },
    select: {
      calories: true,
    },
  });

  const past7DaysCalories = past7DaysMeals.reduce((sum, meal) => sum + meal.calories, 0);

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">カロリー記録アプリ - ダッシュボード</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">本日のカロリー</h2>
        <p className="text-xl">登録済みカロリー: <span className="font-bold text-blue-600">{todaysCalories} kcal</span></p>
        {/* 目標カロリーを設定すれば「残りカロリー」も表示可能 */}
        <p className="text-sm text-gray-500 mt-2">※目標カロリー設定は設定画面で行えます。</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">過去7日間の合計カロリー</h2>
        <p className="text-xl">合計: <span className="font-bold text-green-600">{past7DaysCalories} kcal</span></p>
      </div>

      <div className="text-center mt-10">
        <Link href="/calorie/scan" className="inline-block bg-indigo-600 text-white text-lg font-semibold px-8 py-4 rounded-lg hover:bg-indigo-700 transition duration-300 mb-4">
          <span className="mr-2">📸</span> 写真を登録する
        </Link>
        <br />
        <Link href="/calorie/scan?mode=train" className="inline-block bg-purple-600 text-white text-lg font-semibold px-8 py-4 rounded-lg hover:bg-purple-700 transition duration-300">
          <span className="mr-2">📈</span> 写真とカロリーを登録する (推定学習用)
        </Link>
      </div>

      {/* TODO: ドーナツグラフ、ラインチャート、目標達成状況などを表示 */}
    </main>
  );
}