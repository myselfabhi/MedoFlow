ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'TRIALING';
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'INCOMPLETE';
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'ENDED';

ALTER TABLE "Membership"
ADD COLUMN IF NOT EXISTS "serviceDiscountPercent" DECIMAL(5, 2) NOT NULL DEFAULT 0;

ALTER TABLE "Invoice"
ADD COLUMN IF NOT EXISTS "stripeInvoiceId" TEXT;

ALTER TABLE "PatientSubscription"
ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_stripeInvoiceId_key"
ON "Invoice"("stripeInvoiceId");

CREATE UNIQUE INDEX IF NOT EXISTS "PatientSubscription_stripeSubscriptionId_key"
ON "PatientSubscription"("stripeSubscriptionId");
