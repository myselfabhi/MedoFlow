ALTER TABLE "Payment"
ADD COLUMN IF NOT EXISTS "stripeRefundId" TEXT,
ADD COLUMN IF NOT EXISTS "paymentChannel" TEXT,
ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT,
ADD COLUMN IF NOT EXISTS "recordedById" TEXT,
ADD COLUMN IF NOT EXISTS "recordedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "notes" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Payment_stripeRefundId_key"
ON "Payment"("stripeRefundId");

CREATE INDEX IF NOT EXISTS "Payment_invoiceId_idx"
ON "Payment"("invoiceId");
