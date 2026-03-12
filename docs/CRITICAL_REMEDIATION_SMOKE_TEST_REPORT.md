# Critical Remediation Smoke Test Execution Report

**Date:** 2026-03-12  
**Executor:** QA / Release verifier (automated + code verification)  
**Checklist source:** `docs/CRITICAL_REMEDIATION_SMOKE_TESTS.md`

---

## Phase 1 — Test Plan Confirmation

### Checklist location
- **Source:** `docs/CRITICAL_REMEDIATION_SMOKE_TESTS.md` — confirmed present and aligned with the five flows (A–E) and intended behavior described in the user request.

### Services required
- **Backend:** Node server (e.g. `npm run dev` in `backend`) on port 3001 (or `PORT` from `.env`).
- **Frontend:** Next.js (e.g. `npm run dev` in `frontend`) on port 3000 for full E2E.
- **Database:** PostgreSQL with migration applied; seed creates Super Admin and Clinic Admin only (no provider/patient/appointment/consultation fixtures).
- **Stripe:** Test credentials needed only for live payment completion (not required for “read vs intent creation” or idempotency checks).

### Fixtures / test data
- **Seed:** `backend/prisma/seed.ts` creates Super Admin and Clinic Admin. No provider, patient, service, or appointment.
- **Smoke doc preconditions:** “at least one provider, patient, service, and appointment available in staging.”
- **Implication:** Full manual E2E (login as provider/patient, open appointment, approve note, publish, etc.) requires a pre-populated environment that was not created for this pass.

### What was tested directly
- **Backend unit tests** (all 53, including `criticalRemediation.test.ts` and `schedulingCore.test.ts`): run via `cd backend && npm test`. They verify:
  - A: Approve does not set `patientSummaryPublished`; explicit publish sets it and `getPublishedPatientSummary` filters by it.
  - B: Appointment read does not inject `clientSecret`; explicit `ensurePaymentIntent` is idempotent when a pending payment exists and creates one when none exists.
  - C: Consent required to start recording; recording state machine.
  - D: Expired token throws 410 `token_expired`; token rotation on createOrGetSession (reopen).
  - E: `resolveAppointmentLifecycle` returns PENDING_PAYMENT when both approval and payment apply; provider-approval state only after payment clears.
- **Frontend unit tests** (`lib/consultationRecordingFlow.test.js`): run via `node --test lib/consultationRecordingFlow.test.js`. They verify:
  - C: Recording flow calls browser capture before backend `markRecordingStarted`; rollback on backend failure.

### What was simulated / verified by code
- **A (publish semantics):** `visitController.getById` / `getByAppointment` use `getPublishedPatientSummary` (patientSummaryPublished === true) only; `sanitizeVisitRecordForPatient` masks SOAP/note. `aiScribeService.approveDraft` does not set patientSummaryPublished; `publishPatientSummary` does.
- **B (payment):** `appointmentController.getById` only uses `appointmentService.getAppointmentById` and adds `meetLink`; no call to `paymentService.ensurePaymentIntent`. Intent creation only via `POST /api/v1/payments/:appointmentId/intent`.
- **C (recording):** `consultationService.startRecording` requires consent (else 400 `consent_required`). Frontend `startConsultationRecordingFlow` calls `startBrowserCapture()` then `markRecordingStarted()` and rolls back capture on backend failure.
- **D (tokens):** `getSessionByToken` uses `isJoinTokenExpired` and throws 410 `token_expired`; `createOrGetSession` rotates token when session exists with expired token. Public consultation page shows `err.response?.data?.message` or “invalid or expired” on join failure.
- **E (lifecycle):** `resolveAppointmentLifecycle` in `schedulingCore` and its tests define precedence (payment before approval).

### Assumptions
- Backend and frontend code paths are the source of truth for this pass; no live browser or staging DB was used.
- Unit tests use mocks and do not require a running server or DB.
- Where the checklist expects “provider/patient logs in and clicks through UI,” the result is **PARTIAL** or **BLOCKED** for full E2E; backend and frontend unit tests plus code review are the evidence.

---

## Phase 2 — Smoke Test Execution by Flow

### A. Corrected Publish Semantics

| Step | What was tested | How | Result |
|------|------------------|-----|--------|
| Approve does not publish | `aiScribeService.approveDraft` does not set `patientSummaryPublished` | Backend test: `approving a note finalizes it without auto-publishing patient summary` | **PASS** |
| Explicit publish required | `publishPatientSummary` sets `patientSummaryPublished: true`; `getPublishedPatientSummary` filters by it | Backend test: `explicit publish is still required before patient summary becomes visible` | **PASS** |
| Patient visit API only returns summary when published | `visitController` uses `getPublishedPatientSummary` for PATIENT role | Code: `visitController.ts` getById/getByAppointment | **PASS** |
| Patient cannot see SOAP/draft | `sanitizeVisitRecordForPatient` nulls subjective, objective, assessment, plan, note | Backend test: `patient cannot access draft/internal note content - SOAP fields are masked` | **PASS** |
| Full E2E: provider approves then publishes, patient sees after publish | Requires browser + provider/patient + appointment + AI session | Not run (no staged data / no browser) | **PARTIAL** — backend verified; E2E not run |

**Flow A result:** **PASS** (backend and API contract). **PARTIAL** for full manual E2E (not executed).

**Evidence:**  
- Backend: `✔ approving a note finalizes it without auto-publishing patient summary`  
- Backend: `✔ explicit publish is still required before patient summary becomes visible`  
- Backend: `✔ patient cannot access draft/internal note content - SOAP fields are masked`  
- Code: `backend/src/controllers/visitController.ts` (getById, getByAppointment use `getPublishedPatientSummary`); `backend/src/utils/visitSanitize.ts`; `backend/src/services/aiScribeService.ts` (approveDraft, publishPatientSummary, getPublishedPatientSummary).

---

### B. Corrected Appointment / Payment Behavior

| Step | What was tested | How | Result |
|------|------------------|-----|--------|
| Appointment read does not create payment / intent | Response from getById does not include clientSecret; getAppointmentById not calling payment flow | Backend test: `appointment detail read no longer injects a payment client secret` | **PASS** |
| Explicit intent creation creates payment when none exists | `ensurePaymentIntent` creates Payment row and calls Stripe when no pending payment | Backend test: `explicit payment intent creation creates a pending payment when none exists` | **PASS** |
| Explicit intent creation is idempotent when pending exists | Same clientSecret returned; Stripe create not called | Backend test: `explicit payment intent creation is idempotent when a pending intent already exists` | **PASS** |
| Repeated page loads do not create intents | Controller does not call paymentService on getById | Code: `appointmentController.getById` only getAppointmentById + meetLink | **PASS** |
| Live “open appointment N times, then POST intent twice” | Would need running server + auth + appointment with payment due | Not run | **PARTIAL** — API contract and tests only |

**Flow B result:** **PASS** (backend and API contract). **PARTIAL** for live repeated-read + intent idempotency in one session (not executed).

**Evidence:**  
- Backend: `✔ appointment detail read no longer injects a payment client secret`  
- Backend: `✔ explicit payment intent creation is idempotent when a pending intent already exists`  
- Backend: `✔ explicit payment intent creation creates a pending payment when none exists`  
- Code: `backend/src/controllers/appointmentController.ts` (getById); `backend/src/controllers/paymentController.ts` (intent → ensurePaymentIntent).

---

### C. Corrected Consultation Recording Flow

| Step | What was tested | How | Result |
|------|------------------|-----|--------|
| Recording without consent blocked | `startRecording` returns 400 consent_required when consentStatus !== GRANTED | Backend test: `recording cannot start without consent — consent PENDING should block`; `consent DECLINED should block recording` | **PASS** |
| Consent granted allows recording start | Session transitions when consent GRANTED | Backend test: `consent GRANTED allows recording start` | **PASS** |
| Browser capture before backend state change | Frontend flow calls startBrowserCapture then markRecordingStarted | Frontend test: `recording flow starts browser capture before backend state change` | **PASS** |
| Rollback on backend start failure | On markRecordingStarted throw, rollbackBrowserCapture called | Frontend test: `recording flow rolls back browser capture if backend start fails` | **PASS** |
| Live: deny capture once, then allow; verify backend RECORDING only after success | Requires browser + provider + consultation session | Not run | **PARTIAL** — order and rollback verified by tests |

**Flow C result:** **PASS** (backend consent gate; frontend order and rollback). **PARTIAL** for live “deny then allow capture” in browser (not executed).

**Evidence:**  
- Backend: `✔ recording cannot start without consent — consent PENDING should block`, `✔ consent DECLINED should block recording`, `✔ consent GRANTED allows recording start`  
- Frontend: `✔ recording flow starts browser capture before backend state change`, `✔ recording flow rolls back browser capture if backend start fails`  
- Code: `consultationService.startRecording` (consent check); `frontend/lib/consultationRecordingFlow.js` and `consultation/page.tsx` (handleStartRecording uses startConsultationRecordingFlow).

---

### D. Corrected Consultation Token Behavior

| Step | What was tested | How | Result |
|------|------------------|-----|--------|
| Expired token rejected with 410 | `getSessionByToken` throws 410, code `token_expired`, message “Consultation link has expired” | Backend test: `expired consultation join token is rejected safely` | **PASS** |
| Token rotation on reopen | createOrGetSession updates joinToken and joinTokenExpiresAt when existing session has expired token | Backend test: `expired consultation token is rotated when session is reopened` | **PASS** |
| Patient join page shows safe error | Frontend uses err.response?.data?.message or “invalid or expired” | Code: `frontend/app/(public)/consultation/[token]/page.tsx` loadSession catch | **PASS** |
| Live: join with valid token, rotate, old token fails, new works, wait/force expiry | Requires running backend + consultation session + time or DB tweak | Not run | **PARTIAL** — backend and UI error path only |

**Flow D result:** **PASS** (backend expiry and rotation; frontend error handling). **PARTIAL** for full live token rotation/expiry in browser (not executed).

**Evidence:**  
- Backend: `✔ expired consultation join token is rejected safely`, `✔ expired consultation token is rotated when session is reopened`  
- Code: `consultationService.getSessionByToken` (isJoinTokenExpired → 410); `createOrGetSession` (rotate); `consultation/[token]/page.tsx` (error message).

---

### E. Corrected Lifecycle Precedence

| Step | What was tested | How | Result |
|------|------------------|-----|--------|
| Pending payment + pending approval → PENDING_PAYMENT | `resolveAppointmentLifecycle` with both returns status PENDING_PAYMENT, approval PENDING, payment PENDING | Backend test: `pending approval and pending payment transitions behave correctly` | **PASS** |
| After payment clears, approval can govern | With requiresProviderApproval true and payment NONE, status PENDING_PROVIDER_APPROVAL | Backend test: `provider approval is the next appointment status only after payment clears` | **PASS** |
| Frontend labels vs backend status | Not compared in this pass (no live UI) | — | **PARTIAL** — backend semantics only |

**Flow E result:** **PASS** (backend lifecycle rules). **PARTIAL** for frontend badge/label vs backend (no UI run).

**Evidence:**  
- Backend: `✔ pending approval and pending payment transitions behave correctly`, `✔ provider approval is the next appointment status only after payment clears`  
- Code: `backend/src/services/schedulingCore.ts` (`resolveAppointmentLifecycle`); `backend/src/tests/schedulingCore.test.ts`.

---

## Phase 3 — Tiny Fixes

**No changes made.** No smoke test was blocked by a small fix; all executed checks passed.

---

## Phase 4 — Final Summary

### 1. Smoke Test Summary Table

| Flow | Result | What was verified | Evidence | Notes |
|------|--------|-------------------|----------|--------|
| **A. Publish semantics** | **PASS** (backend) / **PARTIAL** (E2E) | Approve does not publish; explicit publish sets flag; patient API uses getPublishedPatientSummary; SOAP masked for patient | Backend tests (approve, publish, patient mask); visitController and aiScribeService code | Full provider→patient E2E not run (no staged data/browser) |
| **B. Payment behavior** | **PASS** (backend) / **PARTIAL** (live) | Read does not inject clientSecret; explicit intent idempotent and creates when none | Backend tests (read no clientSecret, idempotent, create); appointmentController + paymentController code | Live “open N times + intent twice” not run |
| **C. Recording flow** | **PASS** (backend + frontend unit) / **PARTIAL** (live) | Consent required; capture-before-backend order; rollback on backend failure | Backend consent tests; frontend consultationRecordingFlow tests; service + flow code | Live “deny then allow capture” not run |
| **D. Token behavior** | **PASS** (backend + frontend code) / **PARTIAL** (live) | Expired token 410; rotation on reopen; patient page shows safe error | Backend tests (expired, rotation); getSessionByToken + consultation page code | Live rotation/expiry in browser not run |
| **E. Lifecycle precedence** | **PASS** (backend) / **PARTIAL** (UI) | PENDING_PAYMENT when both; approval after payment; resolveAppointmentLifecycle | schedulingCore tests; resolveAppointmentLifecycle code | Frontend labels not compared in this pass |

### 2. Detailed Findings

- **No FAIL or BLOCKED** items. All flows have at least **PASS** for backend (and where applicable frontend unit) verification.
- **PARTIAL** is used where the checklist implies manual/browser or live-API steps that were not executed (no staging data, no browser automation).

### 3. Tiny Fixes Made During Smoke Testing

- **None.**

### 4. Final Verdict

**GO for Module 4A**, with the following cautions.

- Remediation behavior is **verified at the backend and frontend unit-test level** and by **code review** of the critical paths.
- **Manual E2E** (real provider/patient in browser, live DB with appointments/consultations) and **live API** smoke (repeated reads + intent creation against a running server) were **not** run in this pass.

### 5. Remaining Blockers Before Module 4A

**None** that block starting Module 4A, provided the team accepts test + code evidence as sufficient for this gate.

**Recommended (non-blocking) follow-ups:**

1. **Medium:** Run the manual smoke checklist once in a staging environment with seeded provider, patient, appointment, and consultation (and Stripe test mode) to confirm E2E and live payment behavior.
2. **Low:** Confirm frontend status labels/badges match backend `resolveAppointmentLifecycle` and appointment status in one pass (flow E).
3. **Low:** Optionally run a short live-API smoke: backend up, login, get appointment by id multiple times (confirm no new Payment rows), then POST intent twice (confirm idempotent response).

---

## Test Run Evidence (Copy-Paste)

**Backend (53 tests):**
```
✔ approving a note finalizes it without auto-publishing patient summary
✔ explicit publish is still required before patient summary becomes visible
✔ patient cannot access draft/internal note content - SOAP fields are masked
✔ appointment detail read no longer injects a payment client secret
✔ explicit payment intent creation is idempotent when a pending intent already exists
✔ explicit payment intent creation creates a pending payment when none exists
✔ recording cannot start without consent — consent PENDING should block
✔ consent GRANTED allows recording start
✔ consent DECLINED should block recording
✔ expired consultation join token is rejected safely
✔ expired consultation token is rotated when session is reopened
✔ pending approval and pending payment transitions behave correctly
✔ provider approval is the next appointment status only after payment clears
... (plus remaining consultation state machine, scheduling, etc.)
ℹ tests 53  ℹ pass 53  ℹ fail 0
```

**Frontend (2 tests):**
```
✔ recording flow starts browser capture before backend state change
✔ recording flow rolls back browser capture if backend start fails
ℹ tests 2  ℹ pass 2  ℹ fail 0
```
