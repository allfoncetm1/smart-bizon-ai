-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "chatMessages" TEXT[] DEFAULT ARRAY[]::TEXT[];
