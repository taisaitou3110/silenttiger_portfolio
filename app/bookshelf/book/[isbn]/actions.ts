"use server";

import { checkLibraryStock, LibraryStatus } from '@/app/bookshelf/utils/calil';
import prisma from "@/lib/prisma";

export interface BookDetail {
  isbn: string;
  title: string;
  author: string;
  imageUrl: string;
  description: string;
  publisher: string;
  publishedDate: string;
  isSaved?: boolean;
  savedStatus?: string;
}

const getBookInfo = async (isbn: string): Promise<{ bookData: BookDetail | null, error: string | null }> => {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}${apiKey ? `&key=${apiKey}` : ''}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return { bookData: null, error: `Google Books API request failed: ${res.status}` };
    }
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      const item = data.items[0].volumeInfo;
      const bookData: BookDetail = {
        isbn: isbn,
        title: item.title,
        author: item.authors ? item.authors.join(', ') : '著者不明',
        imageUrl: item.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
        description: item.description || '概要情報はありません。',
        publisher: item.publisher || '不明',
        publishedDate: item.publishedDate || '不明',
      };
      return { bookData, error: null };
    } else {
      return { bookData: null, error: 'Google Books APIに書籍が見つかりませんでした。' };
    }
  } catch (err) {
    return { bookData: null, error: `An unexpected error occurred: ${err}` };
  }
};

export const getBookDetails = async (isbn: string) => {
    try {
        const { bookData, error } = await getBookInfo(isbn);
        if(error || !bookData) {
            return { error };
        }

        // DBに既に存在するかチェック
        const settings = await prisma.userSettings.findFirst();
        let isSaved = false;
        let savedStatus = "UNREAD";

        if (settings) {
            const existing = await prisma.book.findUnique({
                where: {
                    userId_isbn: {
                        userId: settings.id,
                        isbn: isbn
                    }
                }
            });
            if (existing) {
                isSaved = true;
                savedStatus = existing.status;
            }
        }

        const libraryStatuses = await checkLibraryStock(isbn);

        return { 
            book: { ...bookData, isSaved, savedStatus }, 
            libraryStatuses 
        };

    } catch (err) {
        return { error: '詳細の取得中に予期せぬエラーが発生しました。' };
    }
}
