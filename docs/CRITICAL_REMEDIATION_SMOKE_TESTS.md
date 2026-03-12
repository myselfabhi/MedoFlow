## Critical Remediation Smoke Tests

Date: 2026-03-12

Use this checklist after applying the remediation migration and deploying the remediated code.

### Preconditions

- backend SQL migration applied
- Prisma client regenerated
- backend deployed with the remediation fixes
- frontend deployed with the remediation fixes
- Stripe test credentials available if payment flow is exercised end to end
- at least one provider, patient, service, and appointment available in staging

## A. Corrected Publish Semantics

Goal: approval finalizes the clinical note only; publishing remains separate.

1. Log in as provider.
2. Open an appointment with an AI scribe draft or create a draft note.
3. Confirm the patient summary is not yet visible from the patient side.
4. Approve the final note from the provider workflow.
5. Verify provider-side result:
   - note status is finalized/approved
   - no automatic "published to patient" indicator appears unless a separate publish action is taken
6. Log in as the patient and open the same appointment outcome or record page.
7. Verify patient result before publish:
   - patient-safe summary is still absent
   - draft/internal SOAP content is still not exposed
8. Return to provider view.
9. Trigger the explicit patient-summary publish action.
10. Re-open the patient view.
11. Verify patient result after publish:
   - patient summary now appears
   - internal draft/SOAP fields still remain hidden

Pass condition:

- approval alone does not expose the summary
- explicit publish is required for patient visibility

## B. Corrected Appointment / Payment Behavior

Goal: appointment reads are pure reads; payment intent creation is explicit and idempotent.

1. Identify an appointment that requires payment and is not already fully paid.
2. Open the appointment detail page once.
3. Record the current payment rows or Stripe intent id if visible in logs/admin tools.
4. Refresh the appointment detail page multiple times.
5. Verify read behavior:
   - no new payment row is created from read-only page loads
   - no new Stripe PaymentIntent is created from read-only page loads
   - appointment lifecycle state does not mutate just from viewing
6. Trigger the explicit payment intent creation path from the payment page or the `POST /payments/:appointmentId/intent` flow.
7. Capture the returned `paymentId` and `clientSecret`.
8. Trigger the same explicit payment intent creation path again without completing payment.
9. Verify idempotency:
   - the same pending payment row is reused, or
   - the same Stripe PaymentIntent is reused
   - repeated calls do not create a new intent for the same pending obligation
10. Complete or simulate payment in the configured staging mode.
11. Verify payment result:
   - payment state becomes consistent with the backend response/webhook handling
   - appointment status reflects the authoritative lifecycle rule

Pass condition:

- reads do not create payment side effects
- explicit intent creation is repeat-safe

## C. Corrected Consultation Recording Flow

Goal: backend enters recording only after browser capture actually starts.

1. Log in as provider and open a consultation session.
2. Without patient consent granted, click the recording start control.
3. Verify blocked behavior:
   - provider receives a clear failure message
   - backend consultation session does not move into `RECORDING`
4. Grant patient consent from the patient consultation join flow.
5. Return to provider consultation view.
6. Start recording and intentionally deny tab/audio capture once to simulate browser failure.
7. Verify failed-capture behavior:
   - provider sees a capture-start failure message
   - backend consultation session remains in a non-recording state
   - no fake recording status is shown
8. Start recording again and this time allow tab/audio capture correctly.
9. Verify successful-start behavior:
   - browser capture starts first
   - backend then moves to `RECORDING`
   - provider UI and backend session state match
10. Stop recording and allow upload to proceed.
11. Verify post-stop behavior:
   - recording moves through stop/upload/store states without contradiction
   - downstream transcript/AI processing continues from the stored recording

Pass condition:

- capture failure does not create fake backend recording state
- successful capture and backend recording state remain aligned

## D. Corrected Consultation Token Behavior

Goal: join tokens are usable when current, and fail safely when expired or replaced.

1. Create or open a consultation session as provider.
2. Copy the current patient join link.
3. Open the join link as patient.
4. Verify valid-token behavior:
   - consultation page loads successfully
   - patient can see the session status/consent flow normally
5. Rotate or invalidate the token using the provider/session refresh path that reopens or regenerates the session token.
6. Attempt to use the old token again.
7. Verify old-token behavior:
   - request fails safely
   - patient sees a clear user-safe invalid/expired token error
   - old token no longer grants access
8. Use the new/current token.
9. Verify new-token behavior:
   - access works normally
10. If expiry timing is configurable in staging, wait for expiry or force expiry via DB/admin tooling.
11. Attempt to use the expired token.
12. Verify expired-token behavior:
   - access fails safely
   - patient sees a clear expired-token message

Pass condition:

- only the current non-expired token works
- replaced or expired tokens fail safely

## E. Corrected Lifecycle Precedence

Goal: appointment lifecycle status is deterministic when payment and provider approval are both relevant.

1. Create or identify an appointment where:
   - provider approval is pending
   - payment is also pending
2. Inspect the appointment detail from backend API or admin/provider UI.
3. Verify the derived lifecycle status before payment:
   - appointment status shows the authoritative pending-payment lifecycle state
   - approval state remains visible separately if surfaced
4. Complete or simulate payment while leaving provider approval pending.
5. Re-fetch the appointment.
6. Verify the derived lifecycle status after payment:
   - payment is no longer the blocking lifecycle state
   - the appointment now resolves to provider-approval-pending or the next expected state from backend tests
7. Compare frontend badge/label text with backend payload.
8. Verify frontend meaning:
   - frontend labels do not contradict backend status
   - no ambiguous dual-primary status is shown

Pass condition:

- lifecycle precedence is deterministic and matches backend-tested semantics

## Suggested Evidence To Capture

- screenshots of provider and patient views before and after publish
- network traces for repeated appointment reads versus explicit payment intent calls
- consultation session payload before failed capture, after failed capture, and after successful start
- old token and new token responses during rotation test
- appointment payloads before payment and after payment for lifecycle precedence
