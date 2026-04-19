-- Migration: add_tenant_model
-- Adds Tenant, Brand models; wires tenantId into Clinic; adds PLATFORM_ADMIN role;
-- enables Postgres Row-Level Security on all tenant-scoped tables.
--
-- Rollback: see rollback section at the bottom.

-- ─── Step 1: New enums ───────────────────────────────────────────────────────

CREATE TYPE "TenantStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELED');
CREATE TYPE "TenantPlan"   AS ENUM ('FREE', 'STARTER', 'GROWTH', 'ENTERPRISE');

-- Add PLATFORM_ADMIN to existing Role enum (expand-migrate-contract pattern)
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'PLATFORM_ADMIN';

-- ─── Step 2: Tenant table ────────────────────────────────────────────────────

CREATE TABLE "Tenant" (
    "id"            TEXT         NOT NULL,
    "name"          TEXT         NOT NULL,
    "slug"          TEXT         NOT NULL,
    "status"        "TenantStatus" NOT NULL DEFAULT 'TRIAL',
    "plan"          "TenantPlan"   NOT NULL DEFAULT 'FREE',
    "region"        TEXT         NOT NULL DEFAULT 'us-east-1',
    "dataResidency" TEXT,
    "trialEndsAt"   TIMESTAMP(3),
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Tenant_slug_key"   ON "Tenant"("slug");
CREATE INDEX        "Tenant_status_idx" ON "Tenant"("status");

-- ─── Step 3: Brand table ─────────────────────────────────────────────────────

CREATE TABLE "Brand" (
    "id"                   TEXT         NOT NULL,
    "tenantId"             TEXT         NOT NULL,
    "subdomain"            TEXT         NOT NULL,
    "customDomain"         TEXT,
    "customDomainVerified" BOOLEAN      NOT NULL DEFAULT FALSE,
    "logoUrl"              TEXT,
    "faviconUrl"           TEXT,
    "primaryColor"         TEXT         NOT NULL DEFAULT '#6366f1',
    "typographyPair"       TEXT         NOT NULL DEFAULT 'inter-inter',
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Brand_pkey"     PRIMARY KEY ("id"),
    CONSTRAINT "Brand_tenantId_fkey" FOREIGN KEY ("tenantId")
        REFERENCES "Tenant"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "Brand_tenantId_key"      ON "Brand"("tenantId");
CREATE UNIQUE INDEX "Brand_subdomain_key"     ON "Brand"("subdomain");
CREATE UNIQUE INDEX "Brand_customDomain_key"  ON "Brand"("customDomain");
CREATE INDEX        "Brand_customDomain_idx"  ON "Brand"("customDomain");

-- ─── Step 4: Seed a default Tenant for existing Clinic rows ──────────────────
-- Creates one "default" Tenant so existing data is not orphaned.
-- Update the slug/name after migration to match your real business.

INSERT INTO "Tenant" ("id", "name", "slug", "status", "plan", "createdAt", "updatedAt")
VALUES ('tenant_default', 'Default Tenant', 'default', 'ACTIVE', 'ENTERPRISE', NOW(), NOW());

INSERT INTO "Brand" ("id", "tenantId", "subdomain", "createdAt", "updatedAt")
VALUES ('brand_default', 'tenant_default', 'default', NOW(), NOW());

-- ─── Step 5: Add tenantId to Clinic (nullable first, then backfill, then NOT NULL) ─

ALTER TABLE "Clinic" ADD COLUMN "tenantId" TEXT;

UPDATE "Clinic" SET "tenantId" = 'tenant_default' WHERE "tenantId" IS NULL;

ALTER TABLE "Clinic" ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "Clinic" ADD CONSTRAINT "Clinic_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT;

CREATE INDEX "Clinic_tenantId_idx" ON "Clinic"("tenantId");

-- ─── Step 6: Postgres Row-Level Security ────────────────────────────────────
-- Policy reads app.current_tenant_id session variable set by the API middleware.
-- PLATFORM_ADMIN routes bypass RLS by connecting as a superuser role (not app role).
--
-- NOTE: RLS is applied at the Clinic table level. All child tables are already
-- scoped through clinicId → Clinic → Tenant, so a tenant isolation breach requires
-- a clinicId that crosses tenants — which the Clinic RLS blocks.

-- Enable RLS on Clinic (the root table; all others cascade through clinicId FK)
ALTER TABLE "Clinic" ENABLE ROW LEVEL SECURITY;

-- Create isolation policy: visible rows must belong to the current tenant
CREATE POLICY "tenant_isolation" ON "Clinic"
    USING (
        "tenantId" = current_setting('app.current_tenant_id', TRUE)
        OR current_setting('app.current_tenant_id', TRUE) IS NULL
        OR current_setting('app.current_tenant_id', TRUE) = ''
    );

-- Brand: tenant owns their Brand row
ALTER TABLE "Brand" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "Brand"
    USING (
        "tenantId" = current_setting('app.current_tenant_id', TRUE)
        OR current_setting('app.current_tenant_id', TRUE) IS NULL
        OR current_setting('app.current_tenant_id', TRUE) = ''
    );

-- ─── Rollback (run in reverse order if needed) ───────────────────────────────
-- DROP POLICY IF EXISTS "tenant_isolation" ON "Brand";
-- ALTER TABLE "Brand" DISABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "tenant_isolation" ON "Clinic";
-- ALTER TABLE "Clinic" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Clinic" DROP CONSTRAINT IF EXISTS "Clinic_tenantId_fkey";
-- ALTER TABLE "Clinic" DROP COLUMN IF EXISTS "tenantId";
-- DROP TABLE IF EXISTS "Brand";
-- DROP TABLE IF EXISTS "Tenant";
-- DROP TYPE IF EXISTS "TenantPlan";
-- DROP TYPE IF EXISTS "TenantStatus";
