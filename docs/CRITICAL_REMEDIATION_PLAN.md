# Critical Remediation Plan

Date: 2026-03-12

This document captures the confirmed root cause, smallest safe fix, and required test coverage for the five highest-risk correctness issues in Modules 1-3.

## 1. Patient Summary Auto-Publish Bug

1. Is the issue confirmed in code?
Yes.

2. What is the exact root cause?
`approveDraft()` finalizes the visit record and also sets `patientSummaryPublished: true`, which makes approval implicitly publish patient-visible content.

3. Which files need to change?
- `backend/src/services/aiScribeService.ts`
- `backend/src/tests/module3PatientAccess.test.ts`
- Add targeted service-level tests for approve vs publish behavior
- `docs/MODULE3_OUTPUT.md`

4. What is the smallest safe fix?
- Remove `patientSummaryPublished: true` from the approval path.
- Keep the dedicated publish endpoint as the only path that flips `patientSummaryPublished`.
- Leave patient-facing record serializers unchanged so patients continue to see only published summaries.

5. What tests need to be added or updated?
- Approval finalizes note but does not publish summary.
- Explicit publish is still required before patient visibility.
- Patient-safe note masking still blocks draft/internal content.

## 2. Appointment Lifecycle Precedence Bug

1. Is the issue confirmed in code?
Yes.

2. What is the exact root cause?
`resolveAppointmentLifecycle()` already encodes payment precedence, but `backend/src/tests/schedulingCore.test.ts` expects provider-approval precedence when both payment and approval are pending. Code and test disagree.

3. Which files need to change?
- `backend/src/services/schedulingCore.ts`
- `backend/src/tests/schedulingCore.test.ts`
- Potentially small clarifying updates in `backend/src/services/appointmentService.ts`

4. What is the smallest safe fix?
- Keep lifecycle derivation centralized in `resolveAppointmentLifecycle()`.
- Make payment precedence explicit and test-backed:
  - If payment is required, status is `PENDING_PAYMENT`.
  - `approvalStatus` remains `PENDING` in parallel if provider approval is also required.
  - After payment confirmation, status advances to `PENDING_PROVIDER_APPROVAL` if approval is still pending, otherwise `CONFIRMED`.
- Update the tests to use that source of truth and remove ambiguity.

5. What tests need to be added or updated?
- Initial lifecycle when both approval and payment are pending.
- No-payment + approval-required lifecycle.
- Payment-confirmed transition with approval still pending.
- Full scheduling suite must pass cleanly.

## 3. Recording Start Order Bug

1. Is the issue confirmed in code?
Yes.

2. What is the exact root cause?
The provider consultation page calls `consultationApi.startRecording()` before `recorder.startRecording()`. If media capture fails, backend state may already be `RECORDING`.

3. Which files need to change?
- `frontend/app/dashboard/provider/appointments/[id]/consultation/page.tsx`
- `frontend/hooks/useAudioRecorder.ts`
- Add targeted frontend-safe helper coverage or backend-aligned tests around the start-order contract

4. What is the smallest safe fix?
- Start browser/media capture first.
- Only call backend `startRecording()` after browser capture succeeds.
- If backend start fails after local capture starts, immediately stop local recording and surface a clear error.
- Do not change backend recording state model unless needed.

5. What tests need to be added or updated?
- A focused test for the start-order contract so a capture failure does not advance backend state.
- Existing consultation tests should continue to validate consent gating and safe serialization.

## 4. Consultation Join Token Safety

1. Is the issue confirmed in code?
Yes.

2. What is the exact root cause?
`ConsultationSession.joinToken` is a `cuid()` with no explicit expiry or rotation semantics. `getSessionByToken()` accepts the token as long as it matches.

3. Which files need to change?
- `backend/prisma/schema.prisma`
- `backend/src/services/consultationService.ts`
- `backend/src/controllers/consultationController.ts`
- `frontend/app/(public)/consultation/[token]/page.tsx`
- Add consultation token tests

4. What is the smallest safe fix?
- Replace weak default token generation in service code with a strong random token.
- Add `joinTokenExpiresAt` to `ConsultationSession`.
- On session creation, issue a token with explicit expiry.
- When reusing an existing session, rotate the token if it is missing or expired.
- `getSessionByToken()` must reject expired tokens with a clear, safe error.

5. What tests need to be added or updated?
- Expired token is rejected.
- Rotation returns a new token and invalidates the old one.
- Valid token still works and patient-safe serialization remains intact.

## 5. Payment Intent Idempotency / Read-Side Effect Bug

1. Is the issue confirmed in code?
Yes.

2. What is the exact root cause?
`GET /appointments/:id` creates a Stripe PaymentIntent whenever the appointment is pending payment. That makes a read path mutate payment state externally and can create repeated client secrets and duplicated intents.

3. Which files need to change?
- `backend/src/controllers/appointmentController.ts`
- `backend/src/services/appointmentService.ts`
- `backend/src/services/paymentService.ts`
- `backend/src/routes/payments.ts`
- `backend/src/controllers/paymentController.ts`
- `frontend/app/(public)/payment/[appointmentId]/page.tsx`
- `frontend/lib/paymentApi.ts`
- `frontend/lib/patientApi.ts`
- Add explicit payment-intent tests

4. What is the smallest safe fix?
- Remove PaymentIntent creation from `GET /appointments/:id`.
- Introduce an explicit endpoint that creates or returns a pending-payment intent for an appointment.
- Store the Stripe PaymentIntent id on the internal `Payment` row so repeated calls are idempotent and can reuse the same active intent.
- Keep appointment detail as a pure read.

5. What tests need to be added or updated?
- Appointment read does not create a PaymentIntent.
- Explicit intent creation is idempotent and reuses existing pending intent.
- Pending-payment UI still works against the explicit endpoint.
