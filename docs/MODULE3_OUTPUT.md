# Module 3 + AI Scribe — Phase 4 Output

## 1. Summary of Changes Made

### Patient Record System
- **Patient visit masking**: `sanitizeVisitRecordForPatient` always masks SOAP fields (subjective, objective, assessment, plan, note, versions) for patients. Only `getPublishedPatientSummary` is returned when `patientSummaryPublished` is true.
- **Patient file access**: Added `/files/patient/me` and `/files/patient/me/:id/download` routes with membership-based access control. `PatientFilesSection` supports `asPatient` prop for patient self-access.
- **Form clinic scoping**: For PATIENT role, `getResponsesByPatient` derives `clinicId` from `getPatientPrimaryClinic` when `req.clinicId` is null. Patient appointment page passes `appointment.clinicId` for forms.

### AI Scribe
- **Queue failure surfacing**: When `aiScribeQueue.add` fails, session status is set to FAILED and an `ApiError` with `integration_failed` (503) is thrown. No silent success.
- **Durable storage**: `storageService` returns durable refs (`s3:bucket:key` or `local:path`) instead of expiring signed URLs. Worker uses `getAudioBufferFromRef` for job processing.
- **Clinic AI gate**: `aiScribeService.createSession` checks `clinic.aiEnabled`; throws when disabled.
- **Patient summary publishing**: Explicit `publishPatientSummary` step. Approval creates final note but does not auto-publish. Patient only sees summary when `patientSummaryPublished` is true.

### Google Integration
- **OAuth state validation**: `connect` endpoint requires `state` parameter. State is validated (base64-decoded userId/clinicId must match current user). Frontend passes `state` from redirect URL to connect API.

### Schema
- **Clinic**: `aiEnabled Boolean @default(true)` — clinic-level AI feature gate.
- **AIScribeSession**: `patientSummaryPublished Boolean @default(false)` — patient only sees summary when true.

---

## 2. New Data/State Model Implemented

| Model/Field | Purpose |
|-------------|---------|
| `Clinic.aiEnabled` | Clinic-level AI feature gate |
| `AIScribeSession.patientSummaryPublished` | Gate for patient-visible summary |
| Transcript states | RECORDING, TRANSCRIBING, DRAFT_GENERATED, EDITED, APPROVED, FAILED |
| Visit record states | DRAFT, FINAL |
| Storage ref format | `s3:bucket:key` or `local:path` for durable references |

---

## 3. Patient Access/Visibility Rules Now Enforced

| Rule | Implementation |
|------|----------------|
| Patient never sees draft/internal note | `sanitizeVisitRecordForPatient` masks SOAP; patientSummary only when published |
| Patient file access | Membership-based; `assertPatientCanAccessClinicFiles` |
| Patient form access | `getPatientPrimaryClinic` fallback when clinicId missing |
| Publish-to-patient | Explicit `publishPatientSummary`; never auto-publish |

---

## 4. AI Scribe Workflow Now Implemented

1. Provider starts session (or from Google Meet via start-scribe).
2. Provider records/uploads audio.
3. Queue processes; transcript → SOAP draft.
4. Provider edits draft, saves.
5. Provider approves note (finalizes visit record).
6. Provider optionally generates patient summary.
7. Provider explicitly publishes summary to patient.
8. Patient sees only published summary when `patientSummaryPublished` is true.
9. On queue failure: session marked FAILED; API returns 503; retry path available.

---

## 5. Google Integration Architecture Implemented/Repaired

- **OAuth flow**: State generated in `getGoogleAuthUrl`, echoed by Google, validated in `connect`.
- **Meeting sync**: Sync events from Calendar; link to appointments; start-scribe from event.
- **Isolation**: Google logic in `googleCalendarService`; controllers delegate.
- **State validation**: Required; rejects invalid/missing state.

---

## 6. Schema Changes Made

- `Clinic.aiEnabled` (Boolean, default true)
- `AIScribeSession.patientSummaryPublished` (Boolean, default false)

Manual migration SQL in `docs/MODULE3_SCHEMA.sql` for environments where Prisma migrate has ordering constraints.

---

## 7. Files Changed

### Backend
- `backend/prisma/schema.prisma` — aiEnabled, patientSummaryPublished
- `backend/src/utils/visitSanitize.ts` — extracted patient masking logic (testable)
- `backend/src/controllers/aiScribeController.ts` — queue failure surfacing
- `backend/src/controllers/visitController.ts` — patient masking, patientSummary
- `backend/src/controllers/formController.ts` — patient clinic derivation
- `backend/src/controllers/fileController.ts` — patient list/download
- `backend/src/controllers/googleCalendarController.ts` — OAuth state validation
- `backend/src/services/storageService.ts` — durable refs, getAudioBufferFromRef
- `backend/src/services/aiScribeService.ts` — clinic AI check, publish flow
- `backend/src/services/formService.ts` — getPatientPrimaryClinic
- `backend/src/services/fileService.ts` — patient access, getFileForPatientDownload
- `backend/src/queues/aiScribeQueue.ts` — durable storage resolution
- `backend/src/routes/files.ts` — patient routes

### Frontend
- `frontend/lib/fileApi.ts` — getMyFiles, downloadMyFile
- `frontend/lib/aiScribeApi.ts` — publishPatientSummary, patientSummaryPublished
- `frontend/lib/googleCalendarApi.ts` — connect with state param
- `frontend/components/PatientFilesSection.tsx` — asPatient prop
- `frontend/app/dashboard/patient/appointments/[id]/page.tsx` — PatientFilesSection asPatient, clinicId for forms, clearer finalized-but-no-summary message
- `frontend/app/dashboard/provider/visits/[id]/scribe/page.tsx` — Publish Summary button
- `frontend/app/dashboard/provider/meetings/page.tsx` — pass state to connect

### Docs
- `docs/MODULE3_PLAN.md` — plan
- `docs/MODULE3_SCHEMA.sql` — manual migration
- `docs/MODULE3_OUTPUT.md` — this file

---

## 8. Tests Added

- `backend/src/tests/module3PatientAccess.test.ts` — patient cannot access draft; file/forms access
- Existing `schedulingCore.test.ts` unchanged

---

## 9. Remaining Limitations / Follow-up Work Intentionally Deferred

1. **Schema migration**: Run `docs/MODULE3_SCHEMA.sql` manually if Prisma migrate fails due to shadow DB ordering.
2. **Google Meet transcript sync**: Transcript currently comes from AI Scribe (audio upload). Future: sync from Google Meet transcript API when available.
3. **Create-on-approval**: Virtual consultation approval does not yet auto-create Google Calendar event + Meet link; provider uses Meetings page to sync/link.
4. **Provider clinicId**: `setClinicFromUser` uses `req.user.clinicId`. For providers without user.clinicId, consider deriving from provider record.
5. **Full audit logging**: Audit events for meeting creation, transcript sync, note approve, publish are partially in place; expand as needed.
