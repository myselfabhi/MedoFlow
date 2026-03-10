# Module 3 + AI Scribe Plan (Phase 4)

## Part A — Plan

### 1. What We Are Changing

- **Patient record access**: Fix file and form access for patients using PatientClinicMembership; add patient file list/download routes.
- **Form clinic scoping for patients**: Patients have no clinicId; derive clinic from membership or query param for getResponsesByPatient.
- **Draft vs final note boundary**: Harden sanitizeVisitRecordForPatient; ensure patientSummary is only shown when explicitly published.
- **AI queue failures**: Stop swallowing enqueue failures; surface them to the API response so providers see when processing did not start.
- **Durable audio storage**: Store S3 key/path as durable reference; generate signed URL only when worker needs it.
- **Patient summary publishing**: Add explicit publish step; approval creates final note but does not auto-publish summary to patient.
- **Google integration**: Repair OAuth/redirect; add clinic-level AI enablement hook; isolate integration logic.
- **Transcript-to-template flow**: Ensure provider-triggered; transcript separate from note; manual fallback when transcript fails.

### 2. Files/Modules Affected

**Backend:**
- `backend/src/services/fileService.ts` — patient download validation
- `backend/src/controllers/fileController.ts` — patient routes
- `backend/src/routes/files.ts` — add PATIENT for list/download with membership check
- `backend/src/services/formService.ts` — submitResponse clinic from template
- `backend/src/controllers/formController.ts` — getResponsesByPatient clinic derivation for patients
- `backend/src/controllers/visitController.ts` — patient masking, patientSummary only when published
- `backend/src/services/aiScribeService.ts` — publish flow, clinic AI hook
- `backend/src/controllers/aiScribeController.ts` — queue failure surfacing
- `backend/src/queues/aiScribeQueue.ts` — durable storage key resolution
- `backend/src/services/storageService.ts` — return durable key, add resolveForWorker
- `backend/prisma/schema.prisma` — patientSummaryPublished on AIScribeSession, Clinic.aiEnabled
- `backend/src/services/googleCalendarService.ts` — OAuth repair, meeting creation
- `backend/src/controllers/googleCalendarController.ts` — redirect/state
- `backend/src/validation/module3Schemas.ts` — new validation schemas

**Frontend:**
- `frontend/app/dashboard/patient/*` — file access, form responses, visit display
- `frontend/app/dashboard/provider/visits/[id]/scribe/*` — consultation workspace, status display
- `frontend/app/dashboard/provider/appointments/[id]/*` — meeting link, transcript status

### 3. Schema Changes Required

- **AIScribeSession**: Add `patientSummaryPublished Boolean @default(false)` — patient only sees summary when true.
- **Clinic**: Add `aiEnabled Boolean @default(true)` — clinic-level AI feature gate.
- **Storage**: No schema change; storageService returns durable key; AIScribeSession.audioUrl stores key/path.

### 4. Module 1 / Module 2 Foundations Reused

- **PatientClinicMembership**: File and form access use assertPatientBelongsToClinic / membership checks.
- **ProviderLocationAssignment**: Unchanged.
- **Appointment model**: Visit records link to appointment; meeting metadata on GoogleCalendarEvent.
- **Provider-aware slots**: Unchanged.

### 5. Highest-Risk Areas

| Area | Risk | Mitigation |
|------|------|------------|
| Note visibility | Patient sees draft | Strict sanitize; patientSummaryPublished gate |
| Patient access | Wrong clinic scope | Membership-based clinic resolution |
| AI queue | Silent failure | Return error when enqueue fails; session status FAILED |
| External integration | OAuth/redirect bugs | Validate state; isolate in integration layer |
| Storage | Expiring URL in job | Store key; resolve at job runtime |

### 6. Google Integration: Repair vs Replace

**Repair** the existing integration:
- Fix OAuth redirect/state validation.
- Add calendar.events.insert + conferenceData for Meet creation when provider approves virtual consultation.
- Keep sync of existing events; extend with create-on-approval flow.
- Transcript: continue to come from AI Scribe (audio upload or future Meet transcript API); no fragile browser capture.
