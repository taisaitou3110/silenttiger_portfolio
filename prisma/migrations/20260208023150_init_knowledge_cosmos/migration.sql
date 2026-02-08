/*
  Warnings:

  - You are about to drop the column `comments` on the `Word` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Word` table. All the data in the column will be lost.
  - Added the required column `meaning` to the `Word` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "gold" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Word" DROP COLUMN "comments",
DROP COLUMN "description",
ADD COLUMN     "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
ADD COLUMN     "interval" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "meaning" TEXT NOT NULL,
ADD COLUMN     "nextReview" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "phonetic" TEXT,
ADD COLUMN     "scene" TEXT;

-- CreateTable
CREATE TABLE "Example" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "collocation" TEXT,
    "audioUrl" TEXT,
    "wordId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Example_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_Confusion" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_Confusion_AB_unique" ON "_Confusion"("A", "B");

-- CreateIndex
CREATE INDEX "_Confusion_B_index" ON "_Confusion"("B");

-- AddForeignKey
ALTER TABLE "Example" ADD CONSTRAINT "Example_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Confusion" ADD CONSTRAINT "_Confusion_A_fkey" FOREIGN KEY ("A") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Confusion" ADD CONSTRAINT "_Confusion_B_fkey" FOREIGN KEY ("B") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;
