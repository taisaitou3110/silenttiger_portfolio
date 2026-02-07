import prisma from '@/lib/prisma';
import Link from 'next/link';
import versionData from '@/app/version.json';
import { addQuickLog, copyPreviousDayLogs } from './actions';
import CalorieDashboard from './CalorieDashboard';

export const dynamic = "force-dynamic";

export default async function CalorieDashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const userSettings = await prisma.userSettings.findFirst();
  const targetCalories = userSettings?.targetCalories || 2000;

  const todaysCaloriesLogs = await prisma.calorieLog.findMany({
    where: {
      date: {
        gte: today,
      },
      userId: userSettings?.id,
    },
    orderBy: {
      date: 'desc',
    },
  });

  const todaysCalories = todaysCaloriesLogs.reduce((sum, log) => sum + log.calories, 0);
  const remainingCalories = targetCalories - todaysCalories;

  const past7DaysCaloriesLogs = await prisma.calorieLog.findMany({
    where: {
      date: {
        gte: sevenDaysAgo,
      },
      userId: userSettings?.id,
    },
    select: {
      date: true,
      calories: true,
    },
  });

  const past7DaysTotalCalories = past7DaysCaloriesLogs.reduce((sum, log) => sum + log.calories, 0);

  const uniqueDates = new Set(past7DaysCaloriesLogs.map(log => new Date(log.date).toDateString()));
  const numberOfDays = uniqueDates.size > 0 ? uniqueDates.size : 1;
  const sevenDayAverage = past7DaysTotalCalories / numberOfDays;

  const allCalorieLogs = await prisma.calorieLog.findMany({
    where: {
      userId: userSettings?.id,
    },
    select: {
      foodName: true,
      calories: true,
    },
    orderBy: {
      date: 'desc',
    },
    take: 100,
  });

  const mealFrequency: { [key: string]: { count: number; totalCalories: number } } = {};
  allCalorieLogs.forEach(log => {
    if (!mealFrequency[log.foodName]) {
      mealFrequency[log.foodName] = { count: 0, totalCalories: 0 };
    }
    mealFrequency[log.foodName].count++;
    mealFrequency[log.foodName].totalCalories += log.calories;
  });

  const frequentMeals = Object.entries(mealFrequency)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)
    .map(([foodName, data]) => ({
      foodName,
      calories: Math.round(data.totalCalories / data.count),
    }));

  return (
    <CalorieDashboard
      version={versionData.apps.calorie}
      todaysCalories={todaysCalories}
      targetCalories={targetCalories}
      remainingCalories={remainingCalories}
      sevenDayAverage={sevenDayAverage}
      todaysCaloriesLogs={todaysCaloriesLogs}
      frequentMeals={frequentMeals}
    />
  );
}
