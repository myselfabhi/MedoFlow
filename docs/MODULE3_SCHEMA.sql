-- Module 3: Patient summary publishing + clinic AI enablement
-- Run manually if migration system has ordering constraints.

ALTER TABLE "Clinic" ADD COLUMN IF NOT EXISTS "aiEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "AIScribeSession" ADD COLUMN IF NOT EXISTS "patientSummaryPublished" BOOLEAN NOT NULL DEFAULT false;
