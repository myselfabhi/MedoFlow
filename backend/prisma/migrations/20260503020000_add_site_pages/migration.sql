-- Section-based clinic website builder. SitePage stores both a draft and
-- the published payload as JSON so the editor can save without touching
-- what the public site renders until "Publish" is clicked.

DO $$ BEGIN
  CREATE TYPE "SitePageStatus" AS ENUM ('DRAFT', 'PUBLISHED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "SitePage" (
  "id"                TEXT PRIMARY KEY,
  "clinicId"          TEXT NOT NULL,
  "slug"              TEXT NOT NULL,
  "title"             TEXT NOT NULL,
  "status"            "SitePageStatus" NOT NULL DEFAULT 'DRAFT',
  "sectionsJson"      JSONB NOT NULL DEFAULT '[]'::jsonb,
  "draftSectionsJson" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "seoTitle"          TEXT,
  "seoDescription"    TEXT,
  "publishedAt"       TIMESTAMP(3),
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SitePage_clinicId_fkey"
    FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "SitePage_clinicId_slug_key" ON "SitePage" ("clinicId", "slug");
CREATE INDEX IF NOT EXISTS "SitePage_clinicId_idx" ON "SitePage" ("clinicId");
CREATE INDEX IF NOT EXISTS "SitePage_status_idx" ON "SitePage" ("status");
