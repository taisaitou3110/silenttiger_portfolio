// app/bookshelf/utils/localStorage.ts
"use client";

import { Book } from './type';

const STORAGE_KEY = 'bookshelf_guest_data';

/**
 * LocalStorageから書籍リストを取得します。
 * @returns {Book[]} 取得した書籍の配列。データがなければ空配列。
 */
export const getBooks = (): Book[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get books from localStorage", error);
    return [];
  }
};

/**
 * 新しい書籍をLocalStorageに追加します。
 * 同じISBNの書籍が既に存在する場合は追加しません。
 * @param {Book} newBook - 追加する新しい書籍オブジェクト。
 */
export const addBook = (newBook: Book): void => {
  try {
    const books = getBooks();
    const isExist = books.some(book => book.isbn === newBook.isbn);
    if (!isExist) {
      const updatedBooks = [...books, newBook];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBooks));
    }
  } catch (error) {
    console.error("Failed to add book to localStorage", error);
  }
};
