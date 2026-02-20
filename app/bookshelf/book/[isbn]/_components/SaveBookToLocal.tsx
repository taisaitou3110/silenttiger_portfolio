// app/bookshelf/book/[isbn]/_components/SaveBookToLocal.tsx
"use client";

import { useEffect } from 'react';
import { addBook } from '@/app/bookshelf/utils/localStorage';
import { Book } from '@/app/bookshelf/utils/type';

interface SaveBookToLocalProps {
  book: Book;
}

const SaveBookToLocal = ({ book }: SaveBookToLocalProps) => {
  useEffect(() => {
    if (book && book.isbn) {
      addBook(book);
    }
  }, [book]);

  // このコンポーネントはUIを持たない
  return null;
};

export default SaveBookToLocal;
