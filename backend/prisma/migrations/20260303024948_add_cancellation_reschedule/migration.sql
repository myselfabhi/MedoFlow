-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "cancellationFeeType" TEXT DEFAULT 'NONE',
ADD COLUMN     "cancellationFeeValue" DECIMAL(10,2),
ADD COLUMN     "cancellationWindowHours" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "rescheduledFromId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_rescheduledFromId_key" ON "Appointment"("rescheduledFromId");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_rescheduledFromId_fkey" FOREIGN KEY ("rescheduledFromId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
