-- Phase 1 PRD Compliance: Service isArchived, Provider clinicId index

-- Service: add isArchived for booking restriction (archived services remain visible in analytics/historical)
ALTER TABLE "Service" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- Provider: add clinicId index for performance
CREATE INDEX "Provider_clinicId_idx" ON "Provider"("clinicId");
