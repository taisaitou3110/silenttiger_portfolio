"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getBookDetails } from './actions';
import { Book, LibraryStatus } from '@/app/bookshelf/utils/type';
import BookCard from '@/app/bookshelf/components/BookCard';
import ScanResult from '@/app/bookshelf/components/ScanResult';
import { ActionButton } from '@/components/ActionButton';
import MessageBox from '@/components/MessageBox';

const BookDetails = () => {
  const params = useParams();
  const isbn = Array.isArray(params.isbn) ? params.isbn[0] : params.isbn;

  const [book, setBook] = useState<Book | null>(null);
  const [libraryStatuses, setLibraryStatuses] = useState<LibraryStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isbn) return;
    let ignore = false;

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      const result = await getBookDetails(isbn);

      if (!ignore) {
        if (result.error) {
          setError(result.error);
        } else if(result.book && result.libraryStatuses) {
          setBook(result.book);
          setLibraryStatuses(result.libraryStatuses);
        }
        setLoading(false);
      }
    };

    fetchDetails();

    return () => {
      ignore = true;
    };
  }, [isbn]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">読み込み中...</div>;
  }

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <MessageBox status="error" title="エラー" description={error} onClose={() => {}} />
            <div className="mt-8 w-full max-w-md">
                <Link href="/bookshelf/scan" passHref>
                    <ActionButton>
                        再スキャンする
                    </ActionButton>
                </Link>
            </div>
        </div>
    );
  }

  if (!book) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <BookCard book={book} />
        <div className="mt-4">
          <ScanResult 
            libraryStatuses={libraryStatuses} 
            isLoading={false} 
            book={book} 
          />
        </div>
        <div className="mt-8 w-full">
            <Link href="/bookshelf/scan" passHref>
                <ActionButton>
                    別の本をスキャンする
                </ActionButton>
            </Link>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
