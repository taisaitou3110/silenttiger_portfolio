-- CreateTable
CREATE TABLE "AiUsageLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appId" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "resultTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "durationMs" INTEGER,

    CONSTRAINT "AiUsageLog_pkey" PRIMARY KEY ("id")
);

