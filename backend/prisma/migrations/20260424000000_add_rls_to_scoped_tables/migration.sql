-- Migration: add_rls_to_scoped_tables
--
-- Extends the row-level-security pattern previously applied to Clinic and
-- Brand (see 20260419000000_add_tenant_model) to all 31 remaining
-- clinic-scoped tables. Each policy enforces:
--
--   target."clinicId" IN (
--     SELECT id FROM "Clinic"
--     WHERE "tenantId" = current_setting('app.current_tenant_id', true)
--   )
--
-- `current_setting(..., true)` returns NULL (rather than raising) when the
-- session var isn't set — this fails closed (NULL never matches), so any
-- connection that forgets to set the var sees zero rows.
--
-- Roles
-- -----
-- The application's existing connection role (the one in DATABASE_URL,
-- typically `postgres` on Railway) is a superuser, which IMPLICITLY
-- bypasses RLS. That is intentional — the app's primary tenant safety is
-- the Prisma client extension shipped in commit d1a7f4b. RLS here is a
-- secondary defense for direct-DB access (analytics, CLI, ad-hoc psql).
--
-- A non-bypassing role `tenant_isolated_role` is created with USAGE on the
-- public schema and SELECT on all scoped tables. Hand this role's
-- credentials to anyone who connects directly to Postgres and needs
-- tenant safety enforced (BI tooling, audit consumers, support tools).
--
-- To use:
--   psql ... -U tenant_isolated_role
--   SET app.current_tenant_id = '<tenant-uuid>';
--   SELECT * FROM "Patient";  -- only tenant's rows
--
-- Rollback section is at the bottom.

-- ─── Step 1: tenant_isolated_role ─────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'tenant_isolated_role') THEN
    CREATE ROLE tenant_isolated_role NOLOGIN;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO tenant_isolated_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO tenant_isolated_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO tenant_isolated_role;

-- ─── Step 2: helper macro pattern (inlined per table) ─────────────────────────
-- Each table gets:
--   ENABLE ROW LEVEL SECURITY
--   tenant_isolation_policy USING ( clinicId in tenant's clinics )
-- Tables with no clinicId column (Clinic, Brand) already have policies.

-- AIScribeSession
ALTER TABLE "AIScribeSession" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "AIScribeSession"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- Appointment
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "Appointment"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- AppointmentSeries
ALTER TABLE "AppointmentSeries" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "AppointmentSeries"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- AuditLog
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "AuditLog"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- Cart
ALTER TABLE "Cart" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "Cart"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- CommissionRecord
ALTER TABLE "CommissionRecord" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "CommissionRecord"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- CommissionRule
ALTER TABLE "CommissionRule" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "CommissionRule"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- ConsultationSession
ALTER TABLE "ConsultationSession" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "ConsultationSession"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- CustomRole
ALTER TABLE "CustomRole" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "CustomRole"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- Discipline
ALTER TABLE "Discipline" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "Discipline"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- FormResponse
ALTER TABLE "FormResponse" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "FormResponse"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- FormTemplate
ALTER TABLE "FormTemplate" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "FormTemplate"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- GoogleCalendarConnection
ALTER TABLE "GoogleCalendarConnection" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "GoogleCalendarConnection"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- GoogleCalendarEvent
ALTER TABLE "GoogleCalendarEvent" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "GoogleCalendarEvent"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- InventoryItem
ALTER TABLE "InventoryItem" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "InventoryItem"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- Invoice
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "Invoice"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- Location
ALTER TABLE "Location" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "Location"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- Membership
ALTER TABLE "Membership" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "Membership"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- Package
ALTER TABLE "Package" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "Package"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- PatientClinicMembership
ALTER TABLE "PatientClinicMembership" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "PatientClinicMembership"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- PatientFile
ALTER TABLE "PatientFile" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "PatientFile"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- PatientPackage
ALTER TABLE "PatientPackage" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "PatientPackage"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- PatientSubscription
ALTER TABLE "PatientSubscription" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "PatientSubscription"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- Payment
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "Payment"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- Prescription
ALTER TABLE "Prescription" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "Prescription"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- Product
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "Product"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- Provider
ALTER TABLE "Provider" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "Provider"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- Service
ALTER TABLE "Service" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "Service"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- SlotHold
ALTER TABLE "SlotHold" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "SlotHold"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- TreatmentPlan
ALTER TABLE "TreatmentPlan" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "TreatmentPlan"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- VisitRecord
ALTER TABLE "VisitRecord" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "VisitRecord"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- WaitlistEntry
ALTER TABLE "WaitlistEntry" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON "WaitlistEntry"
  USING ("clinicId" IN (
    SELECT id FROM "Clinic" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
  ));

-- ─── Rollback ─────────────────────────────────────────────────────────────────
-- To roll back this migration:
--
-- DO $$
-- DECLARE
--   t text;
--   tables text[] := ARRAY[
--     'AIScribeSession','Appointment','AppointmentSeries','AuditLog','Cart',
--     'CommissionRecord','CommissionRule','ConsultationSession','CustomRole',
--     'Discipline','FormResponse','FormTemplate','GoogleCalendarConnection',
--     'GoogleCalendarEvent','InventoryItem','Invoice','Location','Membership',
--     'Package','PatientClinicMembership','PatientFile','PatientPackage',
--     'PatientSubscription','Payment','Prescription','Product','Provider',
--     'Service','SlotHold','TreatmentPlan','VisitRecord','WaitlistEntry'
--   ];
-- BEGIN
--   FOREACH t IN ARRAY tables LOOP
--     EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I', t);
--     EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', t);
--   END LOOP;
-- END $$;
--
-- -- Drop the role last (it'll fail until all GRANTs are revoked):
-- REVOKE ALL ON ALL TABLES IN SCHEMA public FROM tenant_isolated_role;
-- REVOKE USAGE ON SCHEMA public FROM tenant_isolated_role;
-- DROP ROLE IF EXISTS tenant_isolated_role;
