-- AlterTable Service: add prepayment fields
ALTER TABLE "Service" ADD COLUMN "prepaymentType" TEXT NOT NULL DEFAULT 'NONE';
ALTER TABLE "Service" ADD COLUMN "depositAmount" DECIMAL(10,2);
ALTER TABLE "Service" ADD COLUMN "requirePrepayment" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable Appointment: add payment/slot hold fields
ALTER TABLE "Appointment" ADD COLUMN "paymentStatus" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "paymentDueAt" TIMESTAMP(3);
ALTER TABLE "Appointment" ADD COLUMN "slotHeldUntil" TIMESTAMP(3);

-- CreateTable Payment
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Payment_appointmentId_idx" ON "Payment"("appointmentId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
