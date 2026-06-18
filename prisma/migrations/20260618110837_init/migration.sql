-- CreateEnum
CREATE TYPE "WebinarType" AS ENUM ('LIVE', 'AUTO');

-- CreateEnum
CREATE TYPE "WebinarStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'ERROR');

-- CreateEnum
CREATE TYPE "LeadSegment" AS ENUM ('HOT', 'WARM', 'COLD', 'PURCHASED');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bizonId" TEXT NOT NULL,
    "apiToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webinar" (
    "id" TEXT NOT NULL,
    "bizonId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "WebinarType" NOT NULL,
    "status" "WebinarStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "viewersCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Webinar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "webinarId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "ip" TEXT,
    "country" TEXT,
    "city" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "timeOnWebinar" INTEGER NOT NULL DEFAULT 0,
    "clickedButtons" JSONB,
    "viewedBanners" JSONB,
    "segment" "LeadSegment" NOT NULL DEFAULT 'COLD',
    "score" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "webinarId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "segment" "LeadSegment" NOT NULL DEFAULT 'COLD',
    "score" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "hasPurchased" BOOLEAN NOT NULL DEFAULT false,
    "crmSynced" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "webinarId" TEXT NOT NULL,
    "senderEmail" TEXT,
    "senderName" TEXT,
    "text" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "isSpam" BOOLEAN NOT NULL DEFAULT false,
    "isToxic" BOOLEAN NOT NULL DEFAULT false,
    "isQuestion" BOOLEAN NOT NULL DEFAULT false,
    "aiAnswer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebinarAnalytics" (
    "id" TEXT NOT NULL,
    "webinarId" TEXT NOT NULL,
    "totalViewers" INTEGER NOT NULL DEFAULT 0,
    "avgTimeOnWebinar" INTEGER NOT NULL DEFAULT 0,
    "chatMessagesCount" INTEGER NOT NULL DEFAULT 0,
    "spamCount" INTEGER NOT NULL DEFAULT 0,
    "questionsCount" INTEGER NOT NULL DEFAULT 0,
    "hotLeadsCount" INTEGER NOT NULL DEFAULT 0,
    "warmLeadsCount" INTEGER NOT NULL DEFAULT 0,
    "coldLeadsCount" INTEGER NOT NULL DEFAULT 0,
    "purchasesCount" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "peakViewers" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebinarAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentConfig" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "moderationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "filterSpam" BOOLEAN NOT NULL DEFAULT true,
    "filterMat" BOOLEAN NOT NULL DEFAULT true,
    "filterToxic" BOOLEAN NOT NULL DEFAULT true,
    "customBanWords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "autoAnswersEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoAnswerDelay" INTEGER NOT NULL DEFAULT 5,
    "customFaq" JSONB,
    "hotScoreThreshold" INTEGER NOT NULL DEFAULT 70,
    "warmScoreThreshold" INTEGER NOT NULL DEFAULT 40,
    "telegramEnabled" BOOLEAN NOT NULL DEFAULT false,
    "telegramChatId" TEXT,
    "notifyOnHotLead" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnPurchase" BOOLEAN NOT NULL DEFAULT true,
    "productDescription" TEXT,
    "targetAudience" TEXT,
    "salesScript" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_bizonId_key" ON "Project"("bizonId");

-- CreateIndex
CREATE UNIQUE INDEX "Webinar_bizonId_key" ON "Webinar"("bizonId");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_email_webinarId_key" ON "Participant"("email", "webinarId");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_email_webinarId_key" ON "Lead"("email", "webinarId");

-- CreateIndex
CREATE UNIQUE INDEX "WebinarAnalytics_webinarId_key" ON "WebinarAnalytics"("webinarId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentConfig_projectId_key" ON "AgentConfig"("projectId");

-- AddForeignKey
ALTER TABLE "Webinar" ADD CONSTRAINT "Webinar_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES "Webinar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES "Webinar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebinarAnalytics" ADD CONSTRAINT "WebinarAnalytics_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES "Webinar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentConfig" ADD CONSTRAINT "AgentConfig_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
