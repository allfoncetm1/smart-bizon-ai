-- AlterTable
ALTER TABLE "AgentConfig" ADD COLUMN     "googleSheetEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "googleSheetId" TEXT;
