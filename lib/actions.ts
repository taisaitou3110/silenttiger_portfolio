"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getUserGoldData() {
  // ユーザー設定の取得（存在しなければ作成）
  let userSettings = await prisma.userSettings.findFirst();
  if (!userSettings) {
    userSettings = await prisma.userSettings.create({ data: { gold: 0 } });
  }
  return { gold: userSettings.gold };
}

export async function addGold(amount: number) {
  // 最初のユーザー設定を取得（基本1つしかない想定）
  const settings = await prisma.userSettings.findFirst();
  
  if (!settings) return;

  const updatedSettings = await prisma.userSettings.update({
    where: { id: settings.id },
    data: {
      gold: {
        increment: amount // 現在の値に加算
      }
    }
  });
  revalidatePath("/"); // Revalidate the path to update UI where gold is displayed
  return updatedSettings;
}

export async function decreaseGold(amount: number) {
  const settings = await prisma.userSettings.findFirst();
  if (!settings) return;

  const updatedSettings = await prisma.userSettings.update({
    where: { id: settings.id },
    data: {
      gold: {
        decrement: amount,
      },
    },
  });
  revalidatePath("/");
  return updatedSettings;
}