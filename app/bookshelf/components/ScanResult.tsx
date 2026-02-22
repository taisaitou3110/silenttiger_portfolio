// app/bookshelf/components/ScanResult.tsx
"use client";

import { LibraryStatus } from '@/app/bookshelf/utils/type';
import { Circle, Library, XCircle, CheckCircle, HelpCircle, ArrowUpCircle } from 'lucide-react';

interface ScanResultProps {
  libraryStatuses: LibraryStatus[];
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

const ScanResult = ({ libraryStatuses }: ScanResultProps) => {
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
