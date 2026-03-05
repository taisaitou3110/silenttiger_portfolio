"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface BookData {
  title: string;
  author: string;
  utilizationDate: string;
}

export interface ImportResult {
  success: boolean;
  total: number;
  processed: number;
  errors: string[];
}

export async function saveImportedBooks(books: BookData[]): Promise<ImportResult> {
  if (!books || books.length === 0) {
    throw new Error("有効な貸出履歴データがありません。");
  }

  // ユーザー設定（userId）の取得
  const userSettings = await prisma.userSettings.findFirst();
  if (!userSettings) {
    throw new Error("ユーザー設定が見つかりません。");
  }

  const errors: string[] = [];
  let processed = 0;

  for (const book of books) {
    try {
      // Google Books API で詳細情報を取得 (ISBN, Thumbnail)
      const query = `intitle:${book.title}+inauthor:${book.author.replace(/／著$/, "")}`;
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`);
      const data = await response.json();
      
      let isbn = null;
      let thumbnail = null;

      if (data.items && data.items.length > 0) {
        const info = data.items[0].volumeInfo;
        thumbnail = info.imageLinks?.thumbnail || null;
        
        // ISBNの抽出 (ISBN_13を優先)
        const identifiers = info.industryIdentifiers || [];
        const isbn13 = identifiers.find((id: any) => id.type === "ISBN_13")?.identifier;
        const isbn10 = identifiers.find((id: any) => id.type === "ISBN_10")?.identifier;
        isbn = isbn13 || isbn10 || null;
      }

      // Prisma で upsert
      // 利用日のパース (YYYY/MM/DD)
      const dateParts = book.utilizationDate.split('/');
      const utilizationDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));

      if (isbn) {
        await prisma.book.upsert({
          where: {
            userId_isbn: {
              userId: userSettings.id,
              isbn: isbn,
            },
          },
          update: {
            utilizationDate: utilizationDate,
            status: "COMPLETED",
          },
          create: {
            title: book.title,
            authors: book.author,
            isbn: isbn,
            thumbnail: thumbnail,
            utilizationDate: utilizationDate,
            status: "COMPLETED",
            userId: userSettings.id,
          },
        });
      } else {
        errors.push(`ISBN未検出: ${book.title}`);
      }

      processed++;
      // API制限回避のための短い待機
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err: any) {
      console.error(`Error processing ${book.title}:`, err);
      errors.push(`処理失敗: ${book.title} (${err.message})`);
    }
  }

  revalidatePath("/bookshelf");
  
  return {
    success: true,
    total: books.length,
    processed,
    errors,
  };
}

// 既存の関数（後方互換性のため残す、または削除しても構わないが今回は残す）
export async function importLibraryHistory(text: string) {
  const books: BookData[] = [];
  
  const entryRegex = /タイトル\s*[:：]\s*(.+?)\s*\r?\n[\s\S]*?著者\s*[:：]\s*(.+?)\s*\r?\n[\s\S]*?利用日\s*[:：]\s*(\d{4}\/\d{2}\/\d{2,4})/g;
  
  let match;
  while ((match = entryRegex.exec(text)) !== null) {
    books.push({
      title: match[1].trim(),
      author: match[2].trim(),
      utilizationDate: match[3].trim(),
    });
  }

  if (books.length === 0) {
    throw new Error("有効な貸出履歴が見つかりませんでした。形式を確認してください。");
  }

  return await saveImportedBooks(books);
}
