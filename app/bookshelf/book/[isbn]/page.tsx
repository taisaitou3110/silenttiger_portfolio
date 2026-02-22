// app/bookshelf/book/[isbn]/page.tsx
import Link from 'next/link';
import { getBookDetails } from './actions';
import BookCard from '@/app/bookshelf/components/BookCard';
import ScanResult from '@/app/bookshelf/components/ScanResult';
import { ActionButton } from '@/components/ActionButton';
import MessageBox from '@/components/MessageBox';
import SaveBookToLocal from './_components/SaveBookToLocal';

interface BookDetailsPageProps {
  params: {
    isbn: string;
  };
}

const BookDetailsPage = async ({ params }: BookDetailsPageProps) => {
  const result = await getBookDetails(params.isbn);

  if (result.error || !result.book || !result.libraryStatuses) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <MessageBox 
              status="error" 
              title="エラー" 
              description={result.error || "書籍情報の取得に失敗しました。"} 
            />
            <div className="mt-8 w-full max-w-md">
                <Link href="/bookshelf/scan" passHref>
                    <ActionButton>
                        再スキャンまたは別のISBNを試す
                    </ActionButton>
                </Link>
            </div>
        </div>
    );
  }

  const { book, libraryStatuses } = result;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <BookCard book={book} />
        <div className="mt-4">
          <ScanResult libraryStatuses={libraryStatuses} />
        </div>
        
        {/* localStorageへの保存はクライアントサイドでのみ行われる */}
        <SaveBookToLocal book={book} />

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

export default BookDetailsPage;
