-- Production Safety: SlotHold model, Appointment(patientId, startTime) index

-- CreateTable SlotHold for optional slot locking (2-3 min hold when patient selects slot)
CREATE TABLE "SlotHold" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "patientId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlotHold_pkey" PRIMARY KEY ("id")
);

-- Indexes for SlotHold
CREATE INDEX "SlotHold_clinicId_idx" ON "SlotHold"("clinicId");
CREATE INDEX "SlotHold_expiresAt_idx" ON "SlotHold"("expiresAt");
CREATE INDEX "SlotHold_providerId_startTime_idx" ON "SlotHold"("providerId", "startTime");

-- Appointment(patientId, startTime) composite index for analytics
CREATE INDEX "Appointment_patientId_startTime_idx" ON "Appointment"("patientId", "startTime");

-- Add foreign key constraints for SlotHold
ALTER TABLE "SlotHold" ADD CONSTRAINT "SlotHold_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SlotHold" ADD CONSTRAINT "SlotHold_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SlotHold" ADD CONSTRAINT "SlotHold_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SlotHold" ADD CONSTRAINT "SlotHold_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
