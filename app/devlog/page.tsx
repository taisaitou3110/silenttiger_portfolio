import Link from "next/link";
import { format } from "date-fns";
import { getDevelopmentLogs } from "./actions"; // Import Server Action
import { DevelopmentLog } from "@prisma/client";

interface DevlogPageProps {
  version: string; // Add version prop
}

export default async function DevlogPage({ version }: DevlogPageProps) {
  const logs: DevelopmentLog[] = await getDevelopmentLogs();

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">開発日記 <span className="text-sm font-normal text-gray-500 ml-2">v{version}</span></h1>
        <Link href="/" className="text-blue-500 hover:underline">トップページへ戻る</Link>
      </div>

      {/* 新しい日記を投稿するボタン */}
      <div className="text-center my-8">
        <Link href="/devlog/new" className="bg-green-600 text-white py-3 px-8 rounded-lg text-xl hover:bg-green-700 transition">
          新しい日記を投稿する
        </Link>
      </div>

      {/* 日記一覧 */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">記録された日記</h2>
        {logs.length === 0 ? (
          <p className="text-gray-600">まだ日記がありません。</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="bg-white p-6 rounded shadow-md border-l-4 border-blue-500">
              <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
                <span>日付: {format(new Date(log.date), "yyyy年MM月dd日")}</span>
                <span>記録日時: {format(new Date(log.createdAt), "yyyy年MM月dd日 HH:mm")}</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{log.title}</h3>
              <div className="space-y-1 mb-2">
                <p><span className="font-semibold">進捗:</span> {log.progress}</p>
                <p><span className="font-semibold">所管・課題:</span> {log.issues}</p>
              </div>
              {log.attachment && (
                <p className="text-sm text-blue-600 hover:underline">
                  <a href={log.attachment} target="_blank" rel="noopener noreferrer">添付ファイルを表示</a>
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
