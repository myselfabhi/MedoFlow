-- Add clinic patient-website branding fields. Production was previously
-- broken because schema.prisma was updated without a corresponding
-- migration; railway runs `prisma migrate deploy` so columns weren't
-- created and seed_demo crashed querying Clinic.slug.
ALTER TABLE "Clinic" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "Clinic" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE "Clinic" ADD COLUMN IF NOT EXISTS "themeColor" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Clinic_slug_key" ON "Clinic"("slug");
