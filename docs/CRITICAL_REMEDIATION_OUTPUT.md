# Critical Remediation Output

Date: 2026-03-12

This document records the targeted implementation and verification pass for the five highest-risk correctness issues in Modules 1-3.

## 1. Issue-by-Issue Remediation Summary

### 1. Patient Summary Auto-Publish Bug

- Remediation:
  - Approval now finalizes the visit note without publishing the patient summary.
  - The explicit publish endpoint remains the only path that sets `patientSummaryPublished = true`.
  - Patient-facing record views still rely on `getPublishedPatientSummary()` and existing patient-safe visit serializers.
- Result:
  - Approve and publish are now separate actions again.

### 2. Appointment Lifecycle Precedence Bug

- Remediation:
  - Kept lifecycle derivation centralized in `resolveAppointmentLifecycle()`.
  - Locked in a single rule:
    - payment required => `status = PENDING_PAYMENT`
    - provider approval still remains visible in `approvalStatus = PENDING`
    - once payment clears, the appointment can move to `PENDING_PROVIDER_APPROVAL` or `CONFIRMED`
  - Updated tests to match the actual source of truth.
- Result:
  - Lifecycle semantics are deterministic and test-backed.

### 3. Recording Start Order Bug

- Remediation:
  - The provider consultation page now starts browser/media capture first.
  - Backend `startRecording()` is only called after browser capture succeeds.
  - If backend start fails after local capture starts, the local recording is cancelled and discarded.
  - Added a small recording-flow helper with dedicated tests.
- Result:
  - Backend no longer claims recording has started before the browser has actually started capture.

### 4. Consultation Join Token Safety

- Remediation:
  - Consultation join tokens now use a strong random token generator instead of the schema default `cuid()`.
  - Added explicit `joinTokenExpiresAt` to `ConsultationSession`.
  - Existing expired session tokens are rotated automatically when a provider reopens the session.
  - Patient join attempts now fail safely with a clear expired-token error.
- Result:
  - Patient-facing consultation access now has practical expiry and rotation semantics.

### 5. Payment Intent Idempotency / Read-Side Effect Bug

- Remediation:
  - Removed Stripe PaymentIntent creation from `GET /appointments/:id`.
  - Added an explicit payment-intent endpoint under `/payments/:appointmentId/intent`.
  - Added `stripePaymentIntentId` and `stripeClientSecret` to `Payment` so intent creation can be reused idempotently.
  - Pending payment rows are now reused and updated instead of blindly creating new payment rows in the touched flows.
  - The payment page now requests the intent explicitly instead of depending on appointment-read side effects.
- Result:
  - Appointment reads are now pure reads.
  - Re-fetching appointment detail does not create new Stripe intents.

## 2. Root Cause for Each Issue

### Patient Summary Auto-Publish

- Root cause:
  - `backend/src/services/aiScribeService.ts` approval logic finalized the note and set `patientSummaryPublished: true` in the same transaction.

### Appointment Lifecycle Precedence

- Root cause:
  - The lifecycle helper already encoded payment precedence, but the test suite expected provider-approval precedence when both states were pending.

### Recording Start Order

- Root cause:
  - `frontend/app/dashboard/provider/appointments/[id]/consultation/page.tsx` called backend `startRecording()` before `useAudioRecorder.startRecording()`.

### Consultation Join Token Safety

- Root cause:
  - `ConsultationSession.joinToken` had no expiry field and no rotation semantics; `getSessionByToken()` only checked token equality.

### Payment Intent Idempotency / Read-Side Effect

- Root cause:
  - `backend/src/controllers/appointmentController.ts` created Stripe PaymentIntents during appointment detail fetches.

## 3. Files Changed

### Backend

- `backend/prisma/schema.prisma`
- `backend/src/controllers/appointmentController.ts`
- `backend/src/controllers/paymentController.ts`
- `backend/src/controllers/webhookController.ts`
- `backend/src/routes/payments.ts`
- `backend/src/services/aiScribeService.ts`
- `backend/src/services/appointmentService.ts`
- `backend/src/services/consultationService.ts`
- `backend/src/services/paymentService.ts`
- `backend/src/tests/criticalRemediation.test.ts`
- `backend/src/tests/schedulingCore.test.ts`

### Frontend

- `frontend/app/(public)/consultation/[token]/page.tsx`
- `frontend/app/(public)/payment/[appointmentId]/page.tsx`
- `frontend/app/dashboard/provider/appointments/[id]/consultation/page.tsx`
- `frontend/hooks/useAudioRecorder.ts`
- `frontend/lib/paymentApi.ts`
- `frontend/lib/consultationRecordingFlow.js`
- `frontend/lib/consultationRecordingFlow.test.js`

### Docs

- `docs/CRITICAL_REMEDIATION_PLAN.md`
- `docs/CRITICAL_REMEDIATION_OUTPUT.md`

## 4. Schema Changes Made

- `Payment`
  - added `stripePaymentIntentId String? @unique`
  - added `stripeClientSecret String?`
- `ConsultationSession`
  - removed schema-level default token generation
  - added `joinTokenExpiresAt DateTime`

## 5. Tests Added / Updated

### Added

- `backend/src/tests/criticalRemediation.test.ts`
  - approve does not auto-publish
  - explicit publish is still required
  - expired consultation token is rejected
  - expired consultation token is rotated on reuse
  - explicit payment-intent creation is idempotent
  - explicit payment-intent creation creates a pending payment row
  - appointment detail read no longer injects `clientSecret`
- `frontend/lib/consultationRecordingFlow.test.js`
  - browser capture starts before backend state transition
  - backend-start failure rolls back local capture

### Updated

- `backend/src/tests/schedulingCore.test.ts`
  - aligned lifecycle precedence with the actual source-of-truth helper
  - added explicit post-payment approval-state test

## 6. Docs Updated

- Added targeted remediation plan and output docs for this pass.
- No broad module docs were rewritten in this pass.
- The old Module 3 documentation no longer conflicts with runtime behavior for publish semantics after the service fix.

## 7. Remaining Limitations After These Fixes

- These fixes do not introduce a full DB-level scheduling overlap constraint. Scheduling remains app-layer hardened but not database-hard.
- Consultation tokens now expire and rotate, but there is still no separate administrative revoke endpoint. Rotation and expiry cover the immediate risk for this pass.
- Recording start order is now correct, but the consultation room is still a browser recorder around an external meeting link, not a true native consultation transport.
- Payment reconciliation is improved, but the broader Stripe lifecycle is still split between simulated confirm/fail flows and webhook-driven success handling.
- No Prisma migration file was created in this pass. The schema and generated client were updated locally; deployment still needs the corresponding database migration applied.

## 8. Safe Enough to Begin Module 4A?

- Verdict:
  - Safer than before, yes.
  - Clean enough to start tightly scoped Module 4A work, probably.
  - Fully safe to treat Modules 1-3 as “done,” no.

- Why:
  - The five highest-risk correctness issues in this pass are now concretely remediated and verified.
  - The remaining material risks are mostly broader platform concerns:
    - DB-level scheduling enforcement
    - consultation architecture depth
    - fuller payment reconciliation hardening
    - more route/integration coverage across Module 3

## Verification

- Backend tests:
  - `backend: npm test`
  - Result: pass
- Frontend build:
  - `frontend: npm run build`
  - Result: pass
- Frontend recording-flow tests:
  - `node --test frontend/lib/consultationRecordingFlow.test.js`
  - Result: pass
