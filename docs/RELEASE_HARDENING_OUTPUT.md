# Release Hardening Output — Modules 1–3

## 1. Release Hardening Summary

This phase brought Modules 1–3 to release-candidate level coherence and safety. Focus areas: cross-module consistency, security hardening, audit/observability, UI/UX, testing, deployment docs, and cleanup.

## 2. Cross-Module Issues Fixed

| Issue | Fix |
|-------|-----|
| CORS fail-open in production | Production now requires `CORS_ORIGIN`; rejects cross-origin when unset |
| Scribe → appointment query invalidation | Approve/publish invalidate `['visit', appointmentId]`, `['appointment', appointmentId]`, `['patient', 'visit', appointmentId]` |
| PatientFilesSection invalidation | Upload/delete also invalidate `['files', 'me']` so patient view refreshes |
| Provider forms clinicId | getPatientForms now passes `appointment.clinicId` for consistency |
| Patient visit status badge | Use shared StatusBadge instead of custom visitStatusColors |

## 3. Security/Privacy Fixes Made

| Fix | Details |
|-----|---------|
| CORS fail-closed | Production: `CORS_ORIGIN` required; `cb(null, false)` when unset |
| Env validation | `validateProductionEnv()` at startup: DATABASE_URL, JWT_SECRET, CORS_ORIGIN required in production |
| Public registration | Schema strips unknown keys; authService hardcodes role PATIENT (verified by test) |
| OAuth state | Already enforced in Module 3 |
| AI-disabled clinic | Already enforced in aiScribeService.createSession |

## 4. Audit/Observability Improvements Made

- AI approve/publish: Already audited (VISIT_FINALIZED, PATIENT_SUMMARY_PUBLISHED)
- Worker: Structured logging (logStructured) for Processing Failed, Job Failed; no transcript/PHI
- Error handler: Logs path, method, statusCode; no request body

## 5. UI/UX Hardening Completed

| Area | Change |
|------|--------|
| Patient visit status | StatusBadge (visitRecord variant) for consistency |
| Loading/error states | Existing patterns retained |
| Query invalidation | Scribe approve/publish now refresh appointment and patient visit views |

## 6. Tests Added/Updated

| Test File | Tests |
|-----------|-------|
| `releaseHardening.test.ts` | Public registration strips role; OAuth state encode/decode; invalid state throws; durable storage ref format |
| `module3PatientAccess.test.ts` | (existing) Patient SOAP masking |
| `schedulingCore.test.ts` | (existing) Slots, holds, overlap, lifecycle |

Total: 12 tests passing.

## 7. Docs/Checklists Created

| Doc | Purpose |
|-----|---------|
| `RELEASE_HARDENING_PLAN.md` | Plan, risk hotspots, affected files |
| `RELEASE_CHECKLIST.md` | Migrations, env vars, Google, storage, queue, smoke tests |
| `KNOWN_LIMITATIONS.md` | Module 1–3 limitations, schema migration, E2E |
| `DEPLOYMENT.md` | Updated CORS note, link to RELEASE_CHECKLIST |

## 8. Files Changed

### Backend
- `src/app.ts` — CORS fail-closed in production
- `src/server.ts` — validateProductionEnv at bootstrap
- `src/config/envValidation.ts` — new
- `src/tests/releaseHardening.test.ts` — new

### Frontend
- `app/dashboard/provider/visits/[id]/scribe/page.tsx` — query invalidation for approve/publish
- `app/dashboard/provider/appointments/[id]/page.tsx` — forms clinicId
- `app/dashboard/patient/appointments/[id]/page.tsx` — StatusBadge
- `components/PatientFilesSection.tsx` — invalidate ['files', 'me']

### Docs
- `RELEASE_HARDENING_PLAN.md` — new
- `RELEASE_CHECKLIST.md` — new
- `KNOWN_LIMITATIONS.md` — new
- `RELEASE_HARDENING_OUTPUT.md` — this file
- `DEPLOYMENT.md` — CORS note, checklist link

## 9. Remaining Release Blockers

1. **CORS_ORIGIN**: Must be set in production or API rejects cross-origin requests.
2. **Schema**: Run `docs/MODULE3_SCHEMA.sql` manually if Prisma migrate fails.

## 10. Recommended Next Steps After Release Candidate

1. Add E2E smoke test (patient books → provider approves → note finalized → patient sees summary).
2. Expand audit logging for compliance-sensitive actions.
3. Consider provider clinicId derivation from provider record when user.clinicId is null.
4. Google Meet transcript API sync when available.
5. Create-on-approval for virtual consultations (auto-create Calendar event + Meet link).
