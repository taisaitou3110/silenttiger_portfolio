// app/bookshelf/utils/type.ts

/**
 * LocalStorageに保存する書籍データの型
 */
export interface Book {
  isbn: string;
  title: string;
  author: string;
  imageUrl: string;
  addedAt: string;
  rereadScore: number;
}

/**
 * 図書館の蔵書状況を示す型
 */
export interface LibraryStatus {
  libraryName: string;
  status: '貸出可' | '蔵書あり' | '館内のみ' | '貸出中' | '準備中' | '蔵書なし' | '不明';
  reserveUrl: string | null;
}

/**
 * カーリルAPIのレスポンスを整形した後の蔵書ステータス型
 */
export interface CalilStatus {
  systemid: string;
  libkeys: { [library: string]: string };
  reserveurl: string;
  status: 'OK' | 'Cache' | 'Error' | 'Running';
}
