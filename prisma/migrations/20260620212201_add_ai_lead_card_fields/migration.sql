-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "aiCardAt" TIMESTAMP(3),
ADD COLUMN     "objections" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "openingPhrase" TEXT,
ADD COLUMN     "painPoints" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "recommendedProduct" TEXT;
