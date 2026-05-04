-- Provider profile fields (for the doctor's own settings page) and a
-- ScribeTemplate model that drives specialty-specific AI Scribe prompts.
-- All new columns are additive/nullable so existing rows keep working.

-- 1. Provider profile additions
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "bio" TEXT;
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "headshotUrl" TEXT;
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "signatureUrl" TEXT;
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "licenseNumber" TEXT;
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "languages" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "scribeTemplateId" TEXT;
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "scribeIncludeCoding" BOOLEAN NOT NULL DEFAULT true;

-- 2. ScribeTone enum (idempotent)
DO $$ BEGIN
  CREATE TYPE "ScribeTone" AS ENUM ('CONCISE', 'DETAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "scribeTone" "ScribeTone" NOT NULL DEFAULT 'CONCISE';

-- 3. ScribeTemplate table
CREATE TABLE IF NOT EXISTS "ScribeTemplate" (
  "id"           TEXT PRIMARY KEY,
  "clinicId"     TEXT,
  "specialty"    TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "description"  TEXT,
  "systemPrompt" TEXT NOT NULL,
  "outputSchema" JSONB,
  "isDefault"    BOOLEAN NOT NULL DEFAULT false,
  "isActive"     BOOLEAN NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScribeTemplate_clinicId_fkey"
    FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ScribeTemplate_clinicId_idx" ON "ScribeTemplate" ("clinicId");
CREATE INDEX IF NOT EXISTS "ScribeTemplate_specialty_idx" ON "ScribeTemplate" ("specialty");

-- 4. FK from Provider.scribeTemplateId to ScribeTemplate.id
DO $$ BEGIN
  ALTER TABLE "Provider"
    ADD CONSTRAINT "Provider_scribeTemplateId_fkey"
    FOREIGN KEY ("scribeTemplateId") REFERENCES "ScribeTemplate"("id")
    ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 5. Seed seven platform-default templates (clinicId NULL = system default).
-- These can be overridden per clinic later. The system prompt always asks
-- for the same JSON SOAP+timeline shape so the queue's resilient parser
-- keeps working — only the clinical guidance changes.
INSERT INTO "ScribeTemplate" ("id", "clinicId", "specialty", "name", "description", "systemPrompt", "isDefault", "isActive", "createdAt", "updatedAt")
VALUES
  ('seed_scribe_generic', NULL, 'GENERIC', 'General clinical SOAP', 'Default template for any clinical encounter.',
$$Convert this medical conversation into a clinical timeline and a structured SOAP note. Capture chief complaint, HPI, exam findings, assessment, and plan. Be concise and clinically accurate.

Return valid JSON only, no markdown:
{"timeline": {"symptoms": [], "duration": "", "assessment": "", "plan": []}, "soap": {"subjective": "", "objective": "", "assessment": "", "plan": ""}}$$,
   true, true, NOW(), NOW()),

  ('seed_scribe_primary_care', NULL, 'PRIMARY_CARE', 'Primary care visit', 'Adult primary care: chronic disease management, preventive care, acute concerns.',
$$You are scribing a primary-care visit. Emphasize: chief complaint, HPI with OPQRST, current medications, allergies, vitals, focused exam, problem list with assessment, and a plan that includes follow-up interval. Note any health-maintenance items addressed.

Return valid JSON only, no markdown:
{"timeline": {"symptoms": [], "duration": "", "assessment": "", "plan": []}, "soap": {"subjective": "", "objective": "", "assessment": "", "plan": ""}}$$,
   false, true, NOW(), NOW()),

  ('seed_scribe_physio', NULL, 'PHYSIOTHERAPY', 'Physiotherapy / MSK', 'Musculoskeletal assessment, ROM, strength, functional goals, home exercise program.',
$$You are scribing a physiotherapy session. Capture: pain location/quality, mechanism of injury, ROM, strength testing (MMT), special tests, posture, functional limitations, treatment performed (manual therapy, modalities), home exercise program (HEP) with sets/reps, and progression plan.

Return valid JSON only, no markdown:
{"timeline": {"symptoms": [], "duration": "", "assessment": "", "plan": []}, "soap": {"subjective": "", "objective": "", "assessment": "", "plan": ""}}$$,
   false, true, NOW(), NOW()),

  ('seed_scribe_mental_health', NULL, 'MENTAL_HEALTH', 'Mental health / therapy', 'Psychiatric and psychotherapy notes with MSE and risk assessment.',
$$You are scribing a mental health visit. Capture: presenting concerns, mood/affect, sleep/appetite/energy, suicidal/homicidal ideation (always document explicitly), substance use, stressors, mental status exam, diagnosis or formulation, therapy modality used, plan including medication changes and next session.

Return valid JSON only, no markdown:
{"timeline": {"symptoms": [], "duration": "", "assessment": "", "plan": []}, "soap": {"subjective": "", "objective": "", "assessment": "", "plan": ""}}$$,
   false, true, NOW(), NOW()),

  ('seed_scribe_derm', NULL, 'DERMATOLOGY', 'Dermatology', 'Skin findings with morphology, distribution, and procedural notes.',
$$You are scribing a dermatology visit. Capture: lesion morphology, distribution, duration, prior treatments, exam findings using dermatologic terminology (macule/papule/plaque/etc), differential, biopsy or procedure performed, post-procedure care, follow-up plan.

Return valid JSON only, no markdown:
{"timeline": {"symptoms": [], "duration": "", "assessment": "", "plan": []}, "soap": {"subjective": "", "objective": "", "assessment": "", "plan": ""}}$$,
   false, true, NOW(), NOW()),

  ('seed_scribe_peds', NULL, 'PEDIATRICS', 'Pediatrics', 'Pediatric visit with growth, development, immunizations, and parental concerns.',
$$You are scribing a pediatric visit. Capture: parental concerns, feeding/sleep/elimination as age-appropriate, growth percentiles, developmental milestones, immunization status, exam findings, anticipatory guidance discussed, follow-up plan.

Return valid JSON only, no markdown:
{"timeline": {"symptoms": [], "duration": "", "assessment": "", "plan": []}, "soap": {"subjective": "", "objective": "", "assessment": "", "plan": ""}}$$,
   false, true, NOW(), NOW()),

  ('seed_scribe_womens', NULL, 'WOMENS_HEALTH', 'Women''s health / OB-GYN', 'OB-GYN visit including menstrual, obstetric, and contraceptive history.',
$$You are scribing a women's health visit. Capture: chief complaint, LMP, GTPAL where relevant, menstrual/sexual/contraceptive history, prior pregnancies and outcomes, screening status (Pap, mammogram), exam findings, assessment, plan including contraception or pregnancy management.

Return valid JSON only, no markdown:
{"timeline": {"symptoms": [], "duration": "", "assessment": "", "plan": []}, "soap": {"subjective": "", "objective": "", "assessment": "", "plan": ""}}$$,
   false, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
