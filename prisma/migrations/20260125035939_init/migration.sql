-- CreateTable
CREATE TABLE "Word" (
    "id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealLog" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "foodName" TEXT NOT NULL,
    "calories" INTEGER NOT NULL,
    "imagePath" TEXT,
    "advice" TEXT,

    CONSTRAINT "MealLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodPreset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "calories" INTEGER NOT NULL,

    CONSTRAINT "FoodPreset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PokerAchiever" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalGold" INTEGER NOT NULL DEFAULT 10000,

    CONSTRAINT "PokerAchiever_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Word_term_key" ON "Word"("term");

-- CreateIndex
CREATE UNIQUE INDEX "FoodPreset_name_key" ON "FoodPreset"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PokerAchiever_name_key" ON "PokerAchiever"("name");
