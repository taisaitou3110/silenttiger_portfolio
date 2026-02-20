"use server";

import { Book, LibraryStatus } from '@/app/bookshelf/utils/type';

// このファイルはサーバーサイドでのみ実行される
const getBookInfo = async (isbn: string): Promise<{ bookData: Partial<Book> | null, error: string | null }> => {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (!apiKey) {
    console.warn("Google Books API key is not set. Requests may be rate-limited.");
  }
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${apiKey || ''}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return { bookData: null, error: `Google Books API request failed with status ${res.status}` };
    }
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      const item = data.items[0].volumeInfo;
      const bookData: Partial<Book> = {
        isbn: isbn,
        title: item.title,
        author: item.authors ? item.authors.join(', ') : '著者不明',
        imageUrl: item.imageLinks?.thumbnail || '',
      };
      return { bookData, error: null };
    } else {
      return { bookData: null, error: 'Google Books APIに書籍が見つかりませんでした。' };
    }
  } catch (err) {
    return { bookData: null, error: `An unexpected error occurred: ${err}` };
  }
};

const getLibraryStatus = async (_isbn: string): Promise<LibraryStatus[]> => {
    // TODO: カーリルAPIのポーリング処理
    return [
        { libraryName: '呉市中央図書館', status: '貸出可', reserveUrl: null },
        { libraryName: '東広島市立中央図書館', status: '貸出中', reserveUrl: 'http://example.com' },
    ];
};

export const getBookDetails = async (isbn: string) => {
    try {
        const { bookData, error } = await getBookInfo(isbn);
        if(error) {
            return { error };
        }

        const libraryStatuses = await getLibraryStatus(isbn);

        const completeBookData: Book = {
            isbn: isbn,
            title: bookData?.title || 'タイトル不明',
            author: bookData?.author || '著者不明',
            imageUrl: bookData?.imageUrl || '',
            addedAt: new Date().toISOString(),
            rereadScore: 0,
        };

        return { book: completeBookData, libraryStatuses };

    } catch (err) {
        return { error: '詳細の取得中に予期せぬエラーが発生しました。' };
    }
}
