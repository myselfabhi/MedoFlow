-- Add structured address fields + phone to Location (existing `address` kept for backward compat)
ALTER TABLE "Location"
  ADD COLUMN "addressLine1" TEXT,
  ADD COLUMN "addressLine2" TEXT,
  ADD COLUMN "city"         TEXT,
  ADD COLUMN "state"        TEXT,
  ADD COLUMN "postalCode"   TEXT,
  ADD COLUMN "country"      TEXT,
  ADD COLUMN "phone"        TEXT;

-- Add secondary brand color (nullable; PRD §5.5)
ALTER TABLE "Brand"
  ADD COLUMN "secondaryColor" TEXT;
