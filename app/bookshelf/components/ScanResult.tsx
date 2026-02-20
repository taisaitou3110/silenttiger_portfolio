// app/bookshelf/components/ScanResult.tsx
"use client";

import { useEffect } from 'react';
import { Book, LibraryStatus } from '@/app/bookshelf/utils/type';
import { addBook } from '@/app/bookshelf/utils/localStorage';
import { Circle, Library, XCircle, CheckCircle, HelpCircle, ArrowUpCircle } from 'lucide-react';

interface ScanResultProps {
  libraryStatuses: LibraryStatus[];
  isLoading: boolean;
  book: Book;
}

const StatusIcon = ({ status }: { status: LibraryStatus['status'] }) => {
  switch (status) {
    case '貸出可':
      return <CheckCircle className="text-green-500" />;
    case '蔵書あり':
      return <Circle className="text-blue-500" />;
    case '館内のみ':
      return <Library className="text-indigo-500" />;
    case '貸出中':
      return <ArrowUpCircle className="text-yellow-500" />;
    case '蔵書なし':
      return <XCircle className="text-red-500" />;
    default:
      return <HelpCircle className="text-gray-400" />;
  }
};

const ScanResult = ({ libraryStatuses, isLoading, book }: ScanResultProps) => {
  useEffect(() => {
    if (book && book.isbn) {
      addBook(book);
    }
  }, [book]);
  
  if (isLoading) {
    return (
      <div className="w-full max-w-md p-4">
        <h3 className="text-lg font-semibold mb-2">図書館の状況</h3>
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-100 rounded-lg animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-1/3"></div>
              <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-4">
      <h3 className="text-lg font-semibold mb-2">図書館の状況</h3>
      {libraryStatuses.length > 0 ? (
        <ul className="space-y-2">
          {libraryStatuses.map((lib, index) => (
            <li key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg shadow-sm">
              <span className="font-medium">{lib.libraryName}</span>
              <div className="flex items-center gap-2">
                <StatusIcon status={lib.status} />
                <span>{lib.status}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">在庫状況を取得できませんでした。</p>
      )}
    </div>
  );
};

export default ScanResult;
