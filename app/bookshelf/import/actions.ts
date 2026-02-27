"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface BookData {
  title: string;
  author: string;
  utilizationDate: string;
}

interface ImportResult {
  success: boolean;
  total: number;
  processed: number;
  errors: string[];
}

export async function importLibraryHistory(text: string) {
  const books: BookData[] = [];
  
  // 改良版正規表現：項目の間に他の行（出版者、評価等）が挟まってもOKにする
  // [\s\S]*? は改行を含むあらゆる文字を「次の項目が見つかるまで」最短一致でスキップします
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

      // isbn がない場合はタイトルと著者で特定を試みるか、あるいは登録をスキップ/制限するか
      // 今回は isbn がユニークキーの一部なので、isbn が取れない場合は暫定的にタイトルをキーにするか検討が必要だが
      // 要件では isbn を取得することになっているため、取得できた場合のみ upsert するか、
      // あるいは isbn がない場合用のダミーキーを作成する。
      // ここでは isbn が取得できたものとして進める。
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
        // ISBNが見つからない場合はタイトルベースで保存（重複の可能性はあるが履歴としては残す）
        // 厳密にはスキーマの unique 制約に反するため、isbnがない場合は別の手段が必要
        // 今回は要件に従い ISBN を取得して保存する流れとする。取得失敗時はエラーログへ。
        errors.push(`ISBN未検出: ${book.title}`);
      }

      processed++;
      // API制限回避のための短い待機 (任意)
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
