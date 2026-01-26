"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { createDevelopmentLog } from "./actions";
import { DevelopmentLog } from "@prisma/client";

const ADMIN_PASSWORD = "1234";

export default function DevlogPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [logs, setLogs] = useState<DevelopmentLog[]>([]);
  const [currentDate, setCurrentDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    setCurrentDate(format(today, "yyyy-MM-dd"));

    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/devlog');
        if (!res.ok) {
          throw new Error('Failed to fetch logs');
        }
        const data = await res.json();
        setLogs(data);
      } catch (error) {
        console.error(error);
        alert("日記の読み込みに失敗しました。");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchLogs();
    }
  }, [isAuthenticated]);

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert("パスワードが違います");
      setPassword("");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    
    try {
      await createDevelopmentLog(formData);
      alert("日記を記録しました！");
      form.reset(); // フォームをリセット
      // ログを再取得
      const res = await fetch('/api/devlog');
      const data = await res.json();
      setLogs(data);
    } catch (error) {
      console.error(error);
      alert("日記の記録に失敗しました。");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold mb-6">開発日記</h1>
        <form onSubmit={handlePasswordSubmit} className="bg-white p-6 rounded shadow-md space-y-4">
          <p>開発日記にアクセスするにはパスワードが必要です。</p>
          <input
            type="password"
            placeholder="4桁のパスワード"
            className="border p-2 rounded w-full"
            maxLength={4}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded w-full">
            認証
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">開発日記</h1>
        <Link href="/" className="text-blue-500 hover:underline">トップページへ戻る</Link>
      </div>

      {/* 日記投稿フォーム */}
      <form onSubmit={handleSubmit} className="bg-gray-100 p-6 rounded shadow-md space-y-4">
        <h2 className="text-2xl font-semibold mb-4">新しい日記を投稿</h2>
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">日付</label>
          <input
            type="date"
            id="date"
            name="date"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            defaultValue={currentDate}
            required
          />
        </div>
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">タイトル (30文字以内)</label>
          <input
            type="text"
            id="title"
            name="title"
            maxLength={30}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        <div>
          <label htmlFor="progress" className="block text-sm font-medium text-gray-700">進捗 (100文字以内)</label>
          <textarea
            id="progress"
            name="progress"
            maxLength={100}
            rows={3}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            required
          ></textarea>
        </div>
        <div>
          <label htmlFor="issues" className="block text-sm font-medium text-gray-700">所管・課題 (400文字以内)</label>
          <textarea
            id="issues"
            name="issues"
            maxLength={400}
            rows={5}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            required
          ></textarea>
        </div>
        <div>
          <label htmlFor="attachment" className="block text-sm font-medium text-gray-700">添付ファイル (1つ)</label>
          <input
            type="file"
            id="attachment"
            name="attachment"
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded w-full">
          日記を記録
        </button>
      </form>

      {/* 日記一覧 */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">記録された日記</h2>
        {isLoading ? (
          <p>読み込み中...</p>
        ) : logs.length === 0 ? (
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

