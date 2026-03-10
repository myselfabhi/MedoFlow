-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('NONE', 'PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentRequirementType" AS ENUM ('NONE', 'DEPOSIT', 'FULL');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('PUBLIC', 'PATIENT_PORTAL', 'FRONT_DESK', 'PROVIDER', 'WAITLIST');

-- CreateEnum
CREATE TYPE "SlotHoldStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CONVERTED', 'RELEASED');

-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('WAITING', 'OFFERED', 'BOOKED', 'EXPIRED');

-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'PENDING_PROVIDER_APPROVAL';

-- AlterTable
ALTER TABLE "Service"
ADD COLUMN "requireProviderApproval" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Appointment"
ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC',
ADD COLUMN "paymentRequirementType" "PaymentRequirementType" NOT NULL DEFAULT 'NONE',
ADD COLUMN "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
ADD COLUMN "bookingSource" "BookingSource" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN "depositAmount" DECIMAL(10,2),
ADD COLUMN "bookingHoldExpiresAt" TIMESTAMP(3),
ADD COLUMN "notes" TEXT,
ADD COLUMN "createdById" TEXT,
ADD COLUMN "updatedById" TEXT,
ADD COLUMN "recurringSeriesId" TEXT;

ALTER TABLE "Appointment"
ALTER COLUMN "paymentStatus" TYPE "PaymentStatus"
USING (
  CASE
    WHEN "paymentStatus" IS NULL THEN 'NONE'::"PaymentStatus"
    WHEN "paymentStatus" = 'PAID' THEN 'PAID'::"PaymentStatus"
    WHEN "paymentStatus" = 'PENDING' THEN 'PENDING'::"PaymentStatus"
    WHEN "paymentStatus" = 'FAILED' THEN 'FAILED'::"PaymentStatus"
    WHEN "paymentStatus" = 'REFUNDED' THEN 'REFUNDED'::"PaymentStatus"
    ELSE 'NONE'::"PaymentStatus"
  END
);

ALTER TABLE "Appointment"
ALTER COLUMN "paymentStatus" SET DEFAULT 'NONE';

-- AlterTable
ALTER TABLE "Payment"
ALTER COLUMN "status" TYPE "PaymentStatus"
USING (
  CASE
    WHEN "status" = 'SUCCESS' THEN 'PAID'::"PaymentStatus"
    WHEN "status" = 'PENDING' THEN 'PENDING'::"PaymentStatus"
    WHEN "status" = 'FAILED' THEN 'FAILED'::"PaymentStatus"
    WHEN "status" = 'REFUNDED' THEN 'REFUNDED'::"PaymentStatus"
    ELSE 'NONE'::"PaymentStatus"
  END
);

-- AlterTable
ALTER TABLE "SlotHold"
ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC',
ADD COLUMN "status" "SlotHoldStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "bookingSource" "BookingSource" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN "releasedAt" TIMESTAMP(3),
ADD COLUMN "expiredAt" TIMESTAMP(3),
ADD COLUMN "convertedToAppointmentId" TEXT;

-- AlterTable
ALTER TABLE "WaitlistEntry"
ADD COLUMN "preferredLocationId" TEXT,
ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC';

ALTER TABLE "WaitlistEntry"
ALTER COLUMN "status" TYPE "WaitlistStatus"
USING (
  CASE
    WHEN "status" = 'WAITING' THEN 'WAITING'::"WaitlistStatus"
    WHEN "status" = 'OFFERED' THEN 'OFFERED'::"WaitlistStatus"
    WHEN "status" = 'BOOKED' THEN 'BOOKED'::"WaitlistStatus"
    WHEN "status" = 'EXPIRED' THEN 'EXPIRED'::"WaitlistStatus"
    ELSE 'WAITING'::"WaitlistStatus"
  END
);

-- CreateTable
CREATE TABLE "AppointmentSeries" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "locationId" TEXT,
    "timezone" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "numberOfSessions" INTEGER,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppointmentSeries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Appointment_recurringSeriesId_idx" ON "Appointment"("recurringSeriesId");

-- CreateIndex
CREATE INDEX "AppointmentSeries_clinicId_idx" ON "AppointmentSeries"("clinicId");

-- CreateIndex
CREATE INDEX "AppointmentSeries_patientId_idx" ON "AppointmentSeries"("patientId");

-- CreateIndex
CREATE INDEX "AppointmentSeries_providerId_idx" ON "AppointmentSeries"("providerId");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_recurringSeriesId_fkey" FOREIGN KEY ("recurringSeriesId") REFERENCES "AppointmentSeries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentSeries" ADD CONSTRAINT "AppointmentSeries_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentSeries" ADD CONSTRAINT "AppointmentSeries_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentSeries" ADD CONSTRAINT "AppointmentSeries_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentSeries" ADD CONSTRAINT "AppointmentSeries_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
