/*
  Warnings:

  - You are about to drop the `MealLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "MealLog";

-- CreateTable
CREATE TABLE "CalorieLog" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "foodName" TEXT NOT NULL,
    "calories" INTEGER NOT NULL,
    "imagePath" TEXT,
    "advice" TEXT,
    "inputSource" TEXT,
    "userId" TEXT,

    CONSTRAINT "CalorieLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "targetCalories" INTEGER NOT NULL DEFAULT 2000,
    "weight" DOUBLE PRECISION,
    "activityLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomFood" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "calories" INTEGER NOT NULL,
    "userId" TEXT,

    CONSTRAINT "CustomFood_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomFood_name_key" ON "CustomFood"("name");

-- AddForeignKey
ALTER TABLE "CalorieLog" ADD CONSTRAINT "CalorieLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserSettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFood" ADD CONSTRAINT "CustomFood_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserSettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
