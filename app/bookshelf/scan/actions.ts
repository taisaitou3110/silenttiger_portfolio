// app/bookshelf/scan/actions.ts
"use server";

import { redirect } from 'next/navigation';

/**
 * ISBNコードを受け取り、書籍詳細ページへリダイレクトします。
 * @param isbn - スキャンされたISBNコード
 */
export async function scan(isbn: string) {
  if (isbn) {
    redirect(`/bookshelf/book/${isbn}`);
  }
  // ISBNがなければ何もしない（エラーはクライアント側でハンドリング）
}
