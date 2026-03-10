-- Phase 1: Remove CLINIC_ADMIN and STAFF, add FRONT_DESK
-- Users belong to exactly one clinic. No multi-clinic support.
-- Create new enum and migrate in one transaction using CASE to map old->new.

CREATE TYPE "Role_new" AS ENUM ('SUPER_ADMIN', 'PROVIDER', 'FRONT_DESK', 'PATIENT');

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING (
  CASE role::text
    WHEN 'CLINIC_ADMIN' THEN 'FRONT_DESK'::"Role_new"
    WHEN 'STAFF' THEN 'FRONT_DESK'::"Role_new"
    ELSE role::text::"Role_new"
  END
);

DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";
