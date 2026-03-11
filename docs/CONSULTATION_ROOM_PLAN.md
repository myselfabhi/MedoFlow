# Medoflow Native Consultation Room — Architecture Plan

## 1. Recommended Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js / TypeScript)                             │
│  ┌─────────────────┐  ┌────────────────┐  ┌───────────────┐  │
│  │ Consultation     │  │ useAudioRec-   │  │ Patient Join  │  │
│  │ Room Page        │  │ order Hook     │  │ Page          │  │
│  │ (Provider)       │  │ (MediaRecorder)│  │ (Public)      │  │
│  └────────┬────────┘  └────────┬───────┘  └───────┬───────┘  │
│           │ API calls          │ Blob               │ Token    │
├───────────┼────────────────────┼───────────────────┼──────────┤
│  BACKEND (Express / TypeScript)                              │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ consultationController → consultationService             │  │
│  │   - session lifecycle    - consent gating                │  │
│  │   - recording control    - upload to storageService      │  │
│  │   - creates AIScribeSession when transcription starts    │  │
│  └────────┬────────────────────────────────────────────────┘  │
│           │ enqueue job                                       │
│  ┌────────▼──────────────────────────────────────────┐       │
│  │ aiScribeQueue (BullMQ Worker)                      │       │
│  │   Whisper → cleanTranscript → GPT SOAP → aiDraft  │       │
│  └───────────────────────────────────────────────────┘       │
│           │ result stored on AIScribeSession                  │
│  ┌────────▼──────────────────────────────────────────┐       │
│  │ Existing Clinical Pipeline (aiScribeService)       │       │
│  │   updateDraft → approveDraft → publishSummary      │       │
│  └───────────────────────────────────────────────────┘       │
└──────────────────────────────────────────────────────────────┘
```

## 2. Frontend vs Backend vs Worker

| Layer | Responsibility |
|-------|---------------|
| **Frontend** | Consultation room UI, mic permissions, consent modal, MediaRecorder capture, blob upload, session/status display, doctor template modal |
| **Backend** | Session lifecycle, appointment authorization, consent state, recording metadata, upload storage, AIScribeSession creation, audit logging |
| **Worker** | Audio buffer → Whisper transcription → transcript cleanup → GPT SOAP draft generation (existing `aiScribeQueue.ts`) |

## 3. Module 3 Services/Pages Reused

| Existing Asset | How It's Reused |
|----------------|----------------|
| `aiScribeService.ts` | createSession, uploadAudio, updateDraft, approveDraft, publishPatientSummary — entire SOAP lifecycle |
| `aiScribeQueue.ts` | BullMQ worker for Whisper/GPT — no changes needed |
| `storageService.ts` | uploadAudio (S3 + local fallback) — reused as-is |
| `openaiService.ts` | generatePatientSummary — reused at approval |
| `visitService.ts` | createVisitRecord, validateAppointmentForProvider |
| `auditService.ts` | Audit logging for all consultation events |
| `aiScribeApi.ts` (frontend) | Session status, draft editing, approve, publish — all reused |
| `ClinicalTimelineCard.tsx` | Can display timeline on transcript panel |

## 4. Schema Changes

New `ConsultationSession` model with:
- Session status: `NOT_STARTED → READY → LIVE → RECORDING → ENDED → PROCESSING → TRANSCRIPT_READY → FAILED`
- Recording status: `NOT_STARTED → RECORDING → STOPPED → UPLOADING → STORED → FAILED`
- Consent status: `PENDING → GRANTED → DECLINED`
- Links to `Appointment`, `Provider`, `User` (patient), `Clinic`, `AIScribeSession`
- `joinToken` (unique CUID) for patient access

**No changes to existing models.** The `AIScribeSession` gains a reverse relation but no schema modifications.

## 5. MVP vs Later

### MVP (Build Now)
- ConsultationSession model + migration
- Backend session lifecycle API (11 routes)
- Consultation room page (provider)
- Patient join page (public, consent)
- Browser audio recording via MediaRecorder
- Audio upload → existing transcription pipeline
- Transcript display
- "Convert to Doctor Template" → existing AI flow
- Provider approve/publish via existing flow
- State transition tests

### Later (Phase 2+)
- Real-time WebRTC video/audio between participants
- Screen sharing
- Live transcription (streaming Whisper)
- Multi-party rooms
- Waiting room / queue management
- Chat/messaging within room
- Recording pause/resume
- Chunked upload for long recordings
- Provider reconnect/handoff

## 6. Main Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Media permissions** | Browser may block mic | Explicit permission flow, clear error states, fallback path |
| **Consent** | Legal requirement | Hard gate: recording cannot start before consent GRANTED. Audit trail. |
| **Upload reliability** | Large audio files may fail | 50MB limit (existing), retry logic, STORED/FAILED status tracking |
| **Long recordings** | Memory / file size | MVP: in-memory blob ≤50MB. Phase 2: chunked upload |
| **Partial failures** | Upload OK but transcription fails | Session tracks recording and transcript status independently. Manual documentation path remains. |
| **Patient/provider reconnects** | Session state lost | Session state is server-side. UI rehydrates from server on reconnect. |
| **AI disabled** | Clinic has `aiEnabled=false` | Consultation works, but "Convert to Template" is disabled. Manual note path available. |

## 7. Files/Modules Affected

### New Files
| File | Purpose |
|------|---------|
| `backend/src/services/consultationService.ts` | Session lifecycle service |
| `backend/src/controllers/consultationController.ts` | Express handlers |
| `backend/src/routes/consultations.ts` | Route definitions |
| `backend/src/tests/consultationSession.test.ts` | State transition + access control tests |
| `frontend/lib/consultationApi.ts` | API layer |
| `frontend/hooks/useAudioRecorder.ts` | MediaRecorder hook |
| `frontend/app/dashboard/provider/appointments/[id]/consultation/page.tsx` | Provider room |
| `frontend/app/(public)/consultation/[token]/page.tsx` | Patient join |

### Modified Files
| File | Change |
|------|--------|
| `backend/prisma/schema.prisma` | Add enums + ConsultationSession model |
| `backend/src/routes/index.ts` | Register consultation routes |
| `docs/CONSULTATION_ROOM_PLAN.md` | This file |
