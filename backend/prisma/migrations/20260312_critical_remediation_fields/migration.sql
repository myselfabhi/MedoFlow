BEGIN;

ALTER TABLE "Payment"
ADD COLUMN "stripePaymentIntentId" TEXT,
ADD COLUMN "stripeClientSecret" TEXT;

CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key"
ON "Payment"("stripePaymentIntentId");

ALTER TABLE "ConsultationSession"
ADD COLUMN "joinTokenExpiresAt" TIMESTAMP(3);

UPDATE "ConsultationSession"
SET "joinTokenExpiresAt" = CASE
  WHEN "endedAt" IS NOT NULL OR "status" IN ('ENDED', 'FAILED') THEN NOW()
  ELSE NOW() + INTERVAL '24 hours'
END
WHERE "joinTokenExpiresAt" IS NULL;

ALTER TABLE "ConsultationSession"
ALTER COLUMN "joinTokenExpiresAt" SET NOT NULL;

COMMIT;
