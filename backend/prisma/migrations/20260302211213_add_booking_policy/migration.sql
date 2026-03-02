-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "maxFutureBookingDays" INTEGER DEFAULT 365,
ADD COLUMN     "minimumNoticeMinutes" INTEGER DEFAULT 0;
