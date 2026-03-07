"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveBook(data: {
  isbn: string;
  title: string;
  authors: string;
  thumbnail: string;
  status: "READING" | "COMPLETED" | "UNREAD";
}) {
  try {
    // 簡易的に一人目のユーザー(settings)に紐付ける（本来はAuth連携）
    const settings = await prisma.userSettings.findFirst();
    if (!settings) throw new Error("UserSettings not found");

    const book = await prisma.book.upsert({
      where: {
        userId_isbn: {
          userId: settings.id,
          isbn: data.isbn,
        },
      },
      update: {
        status: data.status,
        updatedAt: new Date(),
      },
      create: {
        userId: settings.id,
        isbn: data.isbn,
        title: data.title,
        authors: data.authors,
        thumbnail: data.thumbnail,
        status: data.status,
      },
    });

    revalidatePath("/bookshelf");
    return { success: true, book };
  } catch (error) {
    console.error("Save book error:", error);
    return { success: false, error: "Failed to save book" };
  }
}

export async function getMyBookshelf() {
  const settings = await prisma.userSettings.findFirst();
  if (!settings) return [];

  return await prisma.book.findMany({
    where: { userId: settings.id },
    orderBy: { updatedAt: "desc" },
  });
}

export async function updateBookStatus(isbn: string, status: string) {
    const settings = await prisma.userSettings.findFirst();
    if (!settings) return { success: false };

    await prisma.book.update({
        where: {
            userId_isbn: {
                userId: settings.id,
                isbn: isbn
            }
        },
        data: { status }
    });
    revalidatePath("/bookshelf");
    return { success: true };
}
