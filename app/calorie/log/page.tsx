// app/calorie/log/page.tsx
import prisma from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = "force-dynamic";

export default async function CalorieLogPage() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const logs = await prisma.calorieLog.findMany({
    where: {
      date: {
        gte: sevenDaysAgo,
      },
    },
    orderBy: {
      date: 'desc',
    },
  });

  // Group logs by date
  const groupedLogs = logs.reduce((acc, log) => {
    const date = new Date(log.date).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(log);
    return acc;
  }, {} as Record<string, typeof logs>);

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">食事ログ (過去7日間)</h1>
        <Link href="/calorie" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
          ← ダッシュボードに戻る
        </Link>
      </div>

      {Object.keys(groupedLogs).length === 0 ? (
        <p className="text-gray-500">過去7日間の記録はありません。</p>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedLogs).map(([date, dailyLogs]) => (
            <div key={date}>
              <h2 className="text-2xl font-semibold mb-4 border-b-2 pb-2">
                {new Date(date).toLocaleDateString('ja-JP', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h2>
              <ul className="space-y-2">
                {dailyLogs.map((log) => (
                  <li key={log.id} className="flex justify-between items-center p-3 rounded-md bg-white shadow-sm">
                    <div>
                      <span className="font-semibold text-lg">{log.foodName}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({log.inputSource} at {new Date(log.date).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })})
                      </span>
                    </div>
                    <span className="font-bold text-lg text-blue-600">{log.calories} kcal</span>
                  </li>
                ))}
              </ul>
              <div className="text-right mt-2 font-bold text-xl">
                合計: {dailyLogs.reduce((sum, log) => sum + log.calories, 0)} kcal
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}