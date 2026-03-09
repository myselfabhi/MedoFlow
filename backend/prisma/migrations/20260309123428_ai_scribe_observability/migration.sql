-- AlterEnum
ALTER TYPE "AIScribeStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "AIScribeSession" ADD COLUMN     "aiModel" TEXT,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "processingCompletedAt" TIMESTAMP(3),
ADD COLUMN     "processingStartedAt" TIMESTAMP(3);
