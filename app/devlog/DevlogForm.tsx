"use client";

import { useState, useEffect, FormEvent } from "react";
import { format } from "date-fns";
import { DevelopmentLog } from "@prisma/client";
import LoadingButton from "@/components/LoadingButton";

const ADMIN_PASSWORD = "1234";

interface DevlogFormProps {
  initialData?: DevelopmentLog | null;
  formAction: (formData: FormData) => Promise<void>;
  buttonText: string;
}

export function DevlogForm({ initialData, formAction, buttonText }: DevlogFormProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [date, setDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      // initialDataがある場合 (編集モード)
      setDate(format(new Date(initialData.date), "yyyy-MM-dd"));
    } else {
      // initialDataがない場合 (新規作成モード)
      const today = new Date();
      setDate(format(today, "yyyy-MM-dd"));
    }
  }, [initialData]);

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
    setIsLoading(true);
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    try {
      await formAction(formData);
      if (!initialData) {
        // 新規作成の場合のみフォームをリセット
        alert("日記を記録しました！");
        form.reset();
        const today = new Date();
        setDate(format(today, "yyyy-MM-dd"));
      }
      // 更新の場合はaction内でredirectされる
    } catch (error) {
      console.error(error);
      alert("処理に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <form onSubmit={handlePasswordSubmit} className="bg-white p-4 rounded-lg shadow-md space-y-3">
        <p className="text-sm font-semibold text-center">操作を行うにはパスワードが必要です。</p>
        <input
          type="password"
          placeholder="4桁のパスワード"
          className="border p-2 rounded w-full text-sm text-gray-900"
          maxLength={4}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded w-full text-sm hover:bg-blue-600">
          認証
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg shadow-md space-y-4">
      <h2 className="text-xl font-semibold text-center">{initialData ? "日記を編集" : "新しい日記を投稿"}</h2>
      {initialData && <input type="hidden" name="id" value={initialData.id} />}
      {initialData?.attachment && <input type="hidden" name="existingAttachment" value={initialData.attachment} />}

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">日付</label>
        <input
          type="date"
          id="date"
          name="date"
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm text-gray-900"
          value={date}
          onChange={(e) => setDate(e.target.value)}
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
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm text-gray-900"
          defaultValue={initialData?.title}
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
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm text-gray-900"
          defaultValue={initialData?.progress}
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
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm text-gray-900"
          defaultValue={initialData?.issues}
          required
        ></textarea>
      </div>
      <div>
        <label htmlFor="attachment" className="block text-sm font-medium text-gray-700">添付ファイル</label>
        {initialData?.attachment && (
          <p className="text-sm text-gray-600 mb-1">
            現在のファイル: <a href={initialData.attachment} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">表示</a>
            <br />
            <span className="text-xs text-gray-500">新しいファイルをアップロードすると置き換えられます。</span>
          </p>
        )}
        <input
          type="file"
          id="attachment"
          name="attachment"
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      <LoadingButton
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded w-full hover:bg-green-700"
        isLoading={isLoading}
      >
        {buttonText}
      </LoadingButton>
    </form>
  );
}
