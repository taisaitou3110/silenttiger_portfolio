import Link from "next/link";
import { format } from "date-fns";
import { getDevelopmentLogs, createDevelopmentLog } from "@/app/devlog/actions"; // createDevelopmentLog を追加
import { DevlogForm } from "@/app/devlog/DevlogForm";

interface PageProps {
  searchParams: {
    page?: string;
  };
}

export default async function DevlogPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const pageSize = 5;
  const { logs, totalLogs } = await getDevelopmentLogs(page, pageSize);

  const totalPages = Math.ceil(totalLogs / pageSize);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">開発日記</h1>
        <Link href="/" className="text-blue-500 hover:underline">トップページへ戻る</Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Main content: Log list */}
        <div className="lg:w-2/3 order-2 lg:order-1">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">記録された日記</h2>
            {logs.length === 0 ? (
              <p className="text-gray-600">まだ日記がありません。</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
                    <div>
                      <span>日付: {format(new Date(log.date), "yyyy年MM月dd日")}</span>
                    </div>
                    <Link href={`/devlog/edit/${log.id}`} className="text-sm text-blue-600 hover:underline">
                      編集
                    </Link>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{log.title}</h3>
                  <div className="text-gray-700 space-y-2">
                    <p><span className="font-semibold text-gray-600">進捗:</span> {log.progress}</p>
                    <p><span className="font-semibold text-gray-600">所管・課題:</span> {log.issues}</p>
                  </div>
                  {log.attachment && (
                    <p className="mt-3 text-sm text-blue-600 hover:underline">
                      <a href={log.attachment} target="_blank" rel="noopener noreferrer">添付ファイルを表示</a>
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalLogs > pageSize && (
            <div className="flex justify-center items-center space-x-4 mt-8">
              {page > 1 && (
                <Link href={`/devlog?page=${page - 1}`} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">
                  前へ
                </Link>
              )}
              <span className="text-gray-700">
                {page} / {totalPages} ページ
              </span>
              {page < totalPages && (
                <Link href={`/devlog?page=${page + 1}`} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">
                  次へ
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Sidebar: New log form */}
        <div className="lg:w-1/3 order-1 lg:order-2">
          <div className="sticky top-8">
            <DevlogForm 
              formAction={createDevelopmentLog}
              buttonText="日記を記録"
            />
          </div>
        </div>

      </div>
    </div>
  );
}