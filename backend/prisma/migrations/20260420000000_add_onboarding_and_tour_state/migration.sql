-- Add tenant onboarding tracking
ALTER TABLE "Tenant"
  ADD COLUMN "onboardingStep" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);

-- Existing tenants (including the 'default' seed tenant and any already-provisioned
-- customers) have completed setup — mark them complete so they don't get routed
-- through the wizard on next login.
UPDATE "Tenant" SET "onboardingCompletedAt" = NOW() WHERE "onboardingCompletedAt" IS NULL;

-- Add per-user tour + preferences state
ALTER TABLE "User"
  ADD COLUMN "hasSeenTour" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "tourCompletedAt" TIMESTAMP(3),
  ADD COLUMN "preferences" JSONB;

-- Existing users don't need to see the tour — mark as seen
UPDATE "User" SET "hasSeenTour" = true WHERE "hasSeenTour" = false;
