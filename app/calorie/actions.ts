'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

interface MealLogData {
  foodName: string;
  calories: number;
  imagePath?: string;
  advice?: string;
  date?: Date;
}

export async function saveMealLog(data: MealLogData) {
  try {
    await prisma.mealLog.create({
      data: {
        foodName: data.foodName,
        calories: data.calories,
        imagePath: data.imagePath,
        advice: data.advice,
        date: data.date || new Date(), // Use provided date or current date
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
