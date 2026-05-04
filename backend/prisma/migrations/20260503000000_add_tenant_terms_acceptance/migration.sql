-- Tenant agreement / terms acceptance tracked at first login
-- Nullable + back-fill-free so existing tenants keep working until they
-- accept the new agreement. The onboarding layout guard enforces
-- acceptance before letting clinic admins reach the wizard.
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP(3);
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "termsAcceptedByUserId" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "termsVersion" TEXT;
