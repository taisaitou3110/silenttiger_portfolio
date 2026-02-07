'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

interface CalorieLogData {
  foodName: string;
  calories: number;
  imagePath?: string;
  advice?: string;
  date?: Date;
  inputSource?: string; // Add inputSource
  userId?: string;    // Add userId
}

/**
 * Ensures that a UserSettings entry exists. If not, creates a default one.
 * Returns the ID of the user settings.
 */
export async function ensureUserSettings(): Promise<string> {
  let userSettings = await prisma.userSettings.findFirst();
  if (!userSettings) {
    userSettings = await prisma.userSettings.create({
      data: {
        targetCalories: 2000, // Default value
      },
    });
  }
  return userSettings.id;
}

export async function saveMealLog(data: CalorieLogData) {
  try {
    const userId = await ensureUserSettings(); // Ensure user settings exist

    await prisma.calorieLog.create({
      data: {
        foodName: data.foodName,
        calories: data.calories,
        imagePath: data.imagePath,
        advice: data.advice,
        date: data.date || new Date(),
        inputSource: data.inputSource,
        userId: userId, // Associate with the ensured user
      },
    });
    revalidatePath('/calorie'); // Revalidate dashboard to show new log
    revalidatePath('/calorie/log'); // Revalidate log page
    return { success: true };
  } catch (error) {
    console.error('Failed to save meal log:', error);
    return { success: false, error: 'Failed to save meal log.' };
  }
}

export async function addQuickLog(foodName: string, calories: number) {
  try {
    await saveMealLog({
      foodName,
      calories,
      inputSource: 'quick_button',
    });
  } catch (error) {
    console.error('Failed to add quick log:', error);
    throw new Error('クイック登録に失敗しました。');
  }
}

export async function copyPreviousDayLogs() {
  try {
    const userId = await ensureUserSettings();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterdayLogs = await prisma.calorieLog.findMany({
      where: {
        userId: userId,
        date: {
          gte: yesterday,
          lt: today,
        },
      },
    });

    for (const log of yesterdayLogs) {
      await saveMealLog({
        foodName: log.foodName,
        calories: log.calories,
        advice: log.advice,
        imagePath: log.imagePath,
        inputSource: `copied_from_previous_day`,
        date: new Date(), // Set date to today
      });
    }

    revalidatePath('/calorie');
    revalidatePath('/calorie/log');
  } catch (error) {
    console.error('Failed to copy previous day logs:', error);
    throw new Error('前日の記録のコピーに失敗しました。');
  }
}
