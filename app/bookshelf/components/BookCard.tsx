// app/bookshelf/components/BookCard.tsx
import Image from 'next/image';
import { Book } from '@/app/bookshelf/utils/type';

interface BookCardProps {
  book: Partial<Book>; // ローディング中など、全ての情報が揃っていない場合も考慮
}

const BookCard = ({ book }: BookCardProps) => {
  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md">
      <div className="w-32 h-48 relative mb-4">
        {book.imageUrl ? (
          <Image
            src={book.imageUrl}
            alt={book.title || 'Book cover'}
            layout="fill"
            objectFit="cover"
            className="rounded"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
            <span className="text-gray-500 text-sm">No Image</span>
          </div>
        )}
      </div>
      <div className="text-center">
        <h2 className="text-lg font-bold">{book.title || 'タイトル不明'}</h2>
        <p className="text-gray-600">{book.author || '著者不明'}</p>
      </div>
    </div>
  );
};

export default BookCard;
