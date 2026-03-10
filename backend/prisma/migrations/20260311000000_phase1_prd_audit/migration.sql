-- Phase 1 PRD Audit: Analytics tagging, location support, archive rules, indexes

-- Discipline: add isArchived
ALTER TABLE "Discipline" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- ProviderAvailability: add locationId
ALTER TABLE "ProviderAvailability" ADD COLUMN "locationId" TEXT;

-- Invoice: add locationId
ALTER TABLE "Invoice" ADD COLUMN "locationId" TEXT;

-- InvoiceItem: add disciplineId, providerId
ALTER TABLE "InvoiceItem" ADD COLUMN "disciplineId" TEXT;
ALTER TABLE "InvoiceItem" ADD COLUMN "providerId" TEXT;

-- Appointment: add disciplineId
ALTER TABLE "Appointment" ADD COLUMN "disciplineId" TEXT;

-- Payment: add providerId, invoiceId
ALTER TABLE "Payment" ADD COLUMN "providerId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "invoiceId" TEXT;

-- VisitRecord: add locationId, serviceId, disciplineId
ALTER TABLE "VisitRecord" ADD COLUMN "locationId" TEXT;
ALTER TABLE "VisitRecord" ADD COLUMN "serviceId" TEXT;
ALTER TABLE "VisitRecord" ADD COLUMN "disciplineId" TEXT;

-- Indexes for performance
CREATE INDEX "Appointment_providerId_startTime_idx" ON "Appointment"("providerId", "startTime");
CREATE INDEX "Appointment_clinicId_startTime_idx" ON "Appointment"("clinicId", "startTime");
CREATE INDEX "Invoice_clinicId_createdAt_idx" ON "Invoice"("clinicId", "createdAt");
CREATE INDEX "VisitRecord_patientId_idx" ON "VisitRecord"("patientId");
