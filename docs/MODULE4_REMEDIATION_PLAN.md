## Module 4 Remediation Plan

Date: 2026-03-12

This pass is limited to the six high-risk commerce gaps that are already present in the existing Module 4 code.

## 1. Fake Walk-In POS

### Confirmed?

Yes.

Evidence:

- [frontend/app/dashboard/front-desk/pos/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/front-desk/pos/page.tsx)

### Root cause

- The POS page builds a local cart in React state.
- `processCheckout()` does not call a billing backend.
- It waits on `setTimeout` and then shows a success toast.

### Files to change

- [frontend/app/dashboard/front-desk/pos/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/front-desk/pos/page.tsx)

### Smallest safe fix

- Disable the POS checkout path and show explicit “not enabled for live billing” messaging.
- Do not leave a fake success path in production UI.

### Tests to add

- None required for the frontend-only disable beyond build verification.
- Manual verification that the page no longer implies real payment completion.

## 2. Refund Architecture Gap

### Confirmed?

Yes.

Evidence:

- [backend/src/services/paymentService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/paymentService.ts)
- `refundPayment()` currently creates a negative local `Payment` row only.
- No Stripe refund API call is made.
- No cart/store refund-specific handling exists.

### Root cause

- Refund logic was implemented as a local ledger mutation without using `stripe.refunds.create`.
- It only understands `Payment` rows, not the Stripe-backed commerce flows holistically.
- It does not restock inventory or unwind commerce side effects.

### Files to change

- [backend/src/services/paymentService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/paymentService.ts)
- [backend/src/controllers/paymentController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/paymentController.ts)
- [backend/src/controllers/webhookController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/webhookController.ts)
- likely [backend/src/services/commissionService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/commissionService.ts)

### Smallest safe fix

- Support full Stripe-backed refunds for Stripe-backed `Payment` rows that have `stripePaymentIntentId`.
- Reuse the existing `Payment` ledger model:
  - mark original payment `REFUNDED`
  - create one negative refund payment row linked with `refundForPaymentId`
- If the refunded payment belongs to a cart/store invoice:
  - restock product inventory
  - cancel unconsumed package entitlements created from that invoice
  - reject refund if a package from that invoice has already been consumed
  - cancel commission records for that invoice
- Keep unsupported non-Stripe refunds rejected with a machine-readable error.

### Tests to add

- Stripe-backed refund success updates local ledger state coherently
- duplicate refund is rejected
- cart/store refund restocks inventory
- commission records are cancelled on refund

## 3. Missing Payment Ledger For Cart/Store Checkout

### Confirmed?

Yes.

Evidence:

- [backend/src/services/cartService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/cartService.ts)
- [backend/src/controllers/webhookController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/webhookController.ts)

### Root cause

- Cart checkout creates a Stripe PaymentIntent and an invoice, but no `Payment` row is created for cart/store payments.
- Cart webhook handling sets invoice `PAID` and performs side effects, but does not create or idempotently reuse a `Payment` ledger row.
- Repeated webhook events can re-run provisioning/inventory/commission side effects.
- Cart invoice creation currently uses `providerId: 'PENDING_ASSIGNMENT'`, which is not a real provider relation.

### Files to change

- [backend/prisma/schema.prisma](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/prisma/schema.prisma)
- [backend/src/services/cartService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/cartService.ts)
- [backend/src/controllers/webhookController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/webhookController.ts)
- [backend/src/services/commissionService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/commissionService.ts)

### Smallest safe fix

- Make `Invoice.providerId` nullable so non-provider cart/store sales are representable truthfully.
- During cart checkout:
  - create invoice with `providerId = null`
- On successful cart Stripe webhook:
  - create or reuse a `Payment` row by `stripePaymentIntentId`
  - link it to invoice/patient/clinic
  - make side effects idempotent

### Tests to add

- cart checkout creates invoice and Stripe intent metadata path correctly
- cart payment webhook creates one `Payment` row
- repeated webhook does not duplicate payment/provisioning/commission work

## 4. Package Usage Not Consumed

### Confirmed?

Yes, with nuance.

Evidence:

- [backend/src/services/appointmentService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/appointmentService.ts) contains package-consumption logic
- [frontend/app/(public)/book/[serviceId]/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/(public)/book/[serviceId]/page.tsx) sends `patientPackageId`
- [backend/src/controllers/appointmentController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/appointmentController.ts) does not pass `patientPackageId` into `CreateAppointmentContext`

### Root cause

- The booking UI exposes package selection.
- The service has a consumption path.
- The controller drops the field before it reaches the logic that uses it.

### Files to change

- [backend/src/controllers/appointmentController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/appointmentController.ts)
- possibly [backend/src/services/packageUsageService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/packageUsageService.ts) only if needed for stricter reuse checks

### Smallest safe fix

- Pass `patientPackageId` through the controller into `createAppointment()` context.
- Keep the existing consumption moment at booking time.
- Rely on the existing unique `PackageSessionUsage.appointmentId` and package counters to prevent double consumption.

### Tests to add

- appointment booking with `patientPackageId` consumes one package session
- exhausted/invalid package selection is rejected safely

## 5. Membership Subscription Linkage Gap

### Confirmed?

Yes.

Evidence:

- [backend/src/controllers/webhookController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/webhookController.ts) creates `PatientSubscription` rows on cart checkout success
- those rows are created with `status: 'ACTIVE'` and no `stripeSubscriptionId`
- later subscription webhooks update by `stripeSubscriptionId`, so those rows are not truly linked

### Root cause

- Memberships are treated like one-time cart items.
- Recurring Stripe subscription creation is not implemented.
- Webhook handlers assume a real `stripeSubscriptionId` exists later.

### Files to change

- [backend/src/services/cartService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/cartService.ts)
- [backend/src/controllers/webhookController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/webhookController.ts)

### Smallest safe fix

- Narrow the supported behavior truthfully:
  - reject `MEMBERSHIP` cart additions and checkout attempts for now
  - stop auto-creating fake `PatientSubscription` rows from cart payment webhooks
- Keep existing Stripe subscription webhook handlers for genuinely linked subscriptions only

### Tests to add

- membership cart add is rejected with a machine-readable unsupported error
- subscription webhook updates only truly linked `PatientSubscription` rows

## 6. Missing Test Coverage For Core Commerce Flows

### Confirmed?

Yes.

Evidence:

- [backend/src/tests](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/tests) currently has no Module 4 commerce workflow test file

### Root cause

- Commerce flows were implemented without corresponding service-level workflow tests

### Files to change

- add a new focused commerce test file under [backend/src/tests](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/tests)

### Smallest safe fix

- Add a single targeted test suite covering:
  - invoice finalize/pay path
  - cart payment webhook ledger creation and idempotency
  - refund flow
  - package provisioning and consumption
  - membership narrowing behavior
  - commission creation guardrails

### Tests to add

- required as part of this remediation pass
