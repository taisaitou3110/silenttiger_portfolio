import { getAiStats } from "./actions/get-stats";
import prisma from "@/lib/prisma";
import { TestButton } from "./actions/_components/test-button";

// 直近の生ログを取得する関数（画面下部に表示）
async function getRecentLogs() {
  return await prisma.aiUsageLog.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
  });
}

export default async function AiDashboardPage() {
  const stats = await getAiStats();
  const recentLogs = await getRecentLogs();

  const totalCost = stats.reduce((acc, s) => acc + s.estimatedCost, 0);
  const totalRequests = stats.reduce((acc, s) => acc + s.requestCount, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Fleet Command</h1>
          <p className="text-gray-500">12個のAIエージェントの稼働状況を監視中</p>
        </div>
        <div className="flex gap-4 items-center">
          <TestButton />
          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
            ● System Live
          </span>
        </div>
      </header>

      {/* 1. サマリーメトリクス */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-10">
        <StatCard title="Total Estimated Cost" value={`¥${totalCost.toFixed(2)}`} sub="今月の累計単価（概算）" />
        <StatCard title="Total Requests" value={totalRequests.toLocaleString()} sub="全アプリの総実行回数" />
        <StatCard title="Active Agents" value={stats.length.toString()} sub="現在稼働中のアプリ数" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 2. アプリ別利用状況テーブル */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-semibold text-gray-700">App Usage Ranking</h2>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-400 uppercase text-xs">
                <th className="px-6 py-4">App ID</th>
                <th className="px-6 py-4 text-right">Reqs</th>
                <th className="px-6 py-4 text-right">Tokens</th>
                <th className="px-6 py-4 text-right">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.map((s) => (
                <tr key={s.appId} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-blue-600 uppercase">{s.appId}</td>
                  <td className="px-6 py-4 text-right text-gray-600">{s.requestCount}</td>
                  <td className="px-6 py-4 text-right text-gray-600">{s.totalTokens.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">¥{s.estimatedCost.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 3. 直近の実行ログ */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-semibold text-gray-700">Recent Activity Log</h2>
          </div>
          <div className="p-0">
            {recentLogs.map((log) => (
              <div key={log.id} className="px-6 py-4 border-b border-gray-50 flex justify-between items-center text-xs">
                <div>
                  <span className={`px-2 py-0.5 rounded mr-2 font-mono ${log.status === 'SUCCESS' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {log.status}
                  </span>
                  <span className="text-gray-900 font-medium uppercase">{log.appId}</span>
                </div>
                <div className="text-gray-400 italic">
                  {new Date(log.createdAt).toLocaleTimeString()} - {log.durationMs}ms
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// サブコンポーネント：統計カード
function StatCard({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <p className="text-4xl font-bold text-gray-900 mb-2">{value}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  );
}
