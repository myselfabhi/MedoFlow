# Release Hardening Plan — Modules 1–3

## Part A — Plan

### 1. What We Are Checking/Fixing

- **Cross-module consistency**: Identity/clinic scope, status semantics, query invalidation, API contracts, shared rendering
- **Security**: CORS fail-open, privileged registration paths, role enforcement, patient data boundaries, OAuth safety, log sanitization, AI-disabled clinic gates
- **Audit logging**: AI session approve/publish, meeting sync failure, structured error logging
- **UI/UX**: Loading, empty, error, permission-denied states; status badge consistency; misleading UI removal
- **Testing**: Auth, scheduling, patient record, integration resilience
- **Deployment**: Env validation, safer defaults, release checklist, known limitations

### 2. Cross-Module Risk Hotspots

| Area | Risk |
|------|------|
| CORS | fail-open when CORS_ORIGIN unset in production |
| Provider clinicId | setClinicFromUser uses user.clinicId; providers may have null |
| Provider appointment page | visit query key uses `id` (appointment id); scribe invalidates `visitRecordId` — mismatch |
| PatientFilesSection | asPatient invalidation uses ['files','patient',patientId]; patient query key ['files','me',patientId,clinicId] — partial match may not refetch |
| Patient appointment | clinicId in forms; getPatientForms fallback when clinicId missing |

### 3. Files/Modules Likely Affected

- `backend/src/app.ts` — CORS
- `backend/src/server.ts` — env validation, worker startup
- `backend/src/controllers/*` — audit, error codes
- `backend/src/services/aiScribeService.ts` — audit already present
- `frontend/components/PatientFilesSection.tsx` — invalidation fix
- `frontend/app/dashboard/provider/appointments/[id]/page.tsx` — visit query key alignment
- `frontend/app/dashboard/provider/visits/[id]/scribe/page.tsx` — invalidate appointment visit
- `backend/src/tests/*` — new tests
- `docs/RELEASE_CHECKLIST.md`, `docs/KNOWN_LIMITATIONS.md`

### 4. Hard Blockers vs Polish

| Item | Type |
|------|------|
| CORS fail-open in production | Hard blocker |
| Public registration not patient-only | Hard blocker (verify only) |
| Audit for AI approve/publish | Already done |
| PatientFilesSection invalidation for asPatient | Fix |
| Provider appointment visit invalidation | Fix |
| Env validation for production | Hard blocker |
| Test coverage expansion | Hard blocker |
| Release checklist | Hard blocker |
| UI polish | Polish |

### 5. "Release Candidate" Definition

For this repo:

- Modules 1–3 work together coherently
- No known privilege escalation or data leakage paths
- Critical paths are tested
- CORS and env are not fail-open in production
- Release docs and known limitations are explicit
- Builds pass
