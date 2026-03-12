## Module 4B Billing Output

Date: 2026-03-12

This pass stayed limited to real billing and operational payment flows:

1. real front-desk checkout
2. explicit manual/offline invoice payment recording
3. partial refunds for supported Stripe-backed flows
4. tighter appointment payment webhook idempotency
5. basic AR / outstanding balance visibility

## Area-by-area remediation summary

### 1. Front-desk checkout

Implemented as a real invoice-backed flow, not a simulated POS.

What changed:

- [frontend/app/dashboard/front-desk/pos/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/front-desk/pos/page.tsx) now acts as a real `Front-Desk Checkout` screen.
- It loads real patients, services, products, and packages.
- It creates a real invoice through [backend/src/services/invoiceService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/invoiceService.ts).
- It adds real line items using catalog-backed invoice item creation.
- It finalizes the invoice.
- It optionally records a real manual/offline payment instead of simulating checkout success.

Truthful limitation:

- This is still not a card-present Stripe Terminal flow.
- It is a clinic staff invoice checkout flow with optional manual/offline collection recording.

### 2. Manual invoice payment semantics

Implemented as an explicit ledger action instead of a document-only status flip.

What changed:

- [backend/src/services/invoiceService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/invoiceService.ts) now exposes `recordInvoiceManualPayment(...)`.
- Manual payments create real `Payment` rows with:
  - `paymentChannel = MANUAL`
  - `paymentMethod`
  - `recordedById`
  - `recordedAt`
  - `notes`
- Invoice finance state is now derived from ledger rows instead of trusting document status alone.
- The old `payInvoice()` path was kept only as a legacy wrapper and now routes through manual payment recording instead of directly flipping status.
- [frontend/app/dashboard/front-desk/invoices/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/front-desk/invoices/page.tsx) now supports collecting manual payments with amount, method, and notes.

### 3. Partial refunds

Implemented for supported Stripe-backed flows, with explicit limits.

What changed:

- [backend/src/services/paymentService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/paymentService.ts) now accepts an optional refund amount.
- Refund logic now:
  - calculates remaining refundable amount from prior refund ledger rows
  - rejects over-refunds
  - creates negative local refund ledger rows
  - updates original payment status to `PARTIALLY_REFUNDED` or `REFUNDED`
  - syncs invoice status from ledger after refund
- Full refund side effects still run for supported store/cart invoices:
  - pending commission cancellation
  - inventory restock
  - unused package cancellation

Truthful limitation:

- Partial refunds are intentionally rejected for invoices containing products or packages because proportional inventory/package reversal is not safely modeled yet.

### 4. Appointment payment/webhook tightening

Implemented as stricter idempotent success handling.

What changed:

- [backend/src/controllers/webhookController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/webhookController.ts) now short-circuits already-processed appointment payment intents.
- Replayed payment success events no longer duplicate:
  - payment ledger changes
  - appointment updates
  - invoice updates
  - confirmation email sends
- Stripe-backed payment ledger rows now consistently persist:
  - `paymentChannel`
  - `paymentMethod`
  - `recordedAt`
- [backend/src/services/appointmentService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/appointmentService.ts) and [backend/src/services/cartService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/cartService.ts) now stamp pending Stripe payment rows with explicit channel/method metadata.

### 5. AR / outstanding balance visibility

Implemented as a real operational billing surface, not a finance dashboard.

What changed:

- [backend/src/services/invoiceService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/invoiceService.ts) now derives and returns:
  - `totalPaid`
  - `totalRefunded`
  - `netCollected`
  - `outstandingAmount`
  - `financialStatus`
- Added receivables summary API in [backend/src/controllers/invoiceController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/invoiceController.ts) and [backend/src/routes/invoices.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/routes/invoices.ts).
- [frontend/app/dashboard/front-desk/invoices/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/front-desk/invoices/page.tsx) now shows:
  - outstanding receivables
  - unpaid / partially paid / paid / partially refunded / refunded visibility
  - per-invoice outstanding amount
  - collection and refund actions

Also fixed:

- fully refunded invoices were incorrectly still contributing to outstanding AR in the first implementation; [backend/src/services/invoiceService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/invoiceService.ts) now zeros outstanding balance for `REFUNDED` and `CANCELLED` financial states.

## What was implemented

- real front-desk invoice-backed checkout UI
- generic catalog invoice item support for services, products, and packages
- clinic patient list endpoint for front-desk checkout
- manual/offline invoice payment recording with ledger metadata
- derived invoice finance status and outstanding balance calculations
- AR summary endpoint
- partial refunds for supported Stripe-backed flows
- over-refund protection
- appointment payment webhook idempotency tightening
- explicit payment metadata on Stripe-backed ledger rows

## What was intentionally narrowed

- No Stripe Terminal/card-present integration was built.
- Front-desk checkout is invoice + optional manual/offline collection, not a true hardware POS.
- Partial refunds remain unsupported for invoices with products or packages.
- Memberships were not expanded in this phase.
- This is still not a full accounting system or GL.

## Files changed

Backend:

- [backend/prisma/schema.prisma](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/prisma/schema.prisma)
- [backend/prisma/migrations/20260312_module4b_billing_payment_metadata/migration.sql](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/prisma/migrations/20260312_module4b_billing_payment_metadata/migration.sql)
- [backend/src/controllers/invoiceController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/invoiceController.ts)
- [backend/src/controllers/patientController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/patientController.ts)
- [backend/src/controllers/paymentController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/paymentController.ts)
- [backend/src/controllers/webhookController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/webhookController.ts)
- [backend/src/routes/invoices.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/routes/invoices.ts)
- [backend/src/routes/patients.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/routes/patients.ts)
- [backend/src/services/appointmentService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/appointmentService.ts)
- [backend/src/services/cartService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/cartService.ts)
- [backend/src/services/invoiceService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/invoiceService.ts)
- [backend/src/services/paymentService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/paymentService.ts)
- [backend/src/tests/module4Remediation.test.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/tests/module4Remediation.test.ts)

Frontend:

- [frontend/app/dashboard/front-desk/invoices/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/front-desk/invoices/page.tsx)
- [frontend/app/dashboard/front-desk/pos/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/front-desk/pos/page.tsx)
- [frontend/components/common/StatusBadge.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/components/common/StatusBadge.tsx)
- [frontend/lib/invoiceApi.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/lib/invoiceApi.ts)

Docs:

- [docs/MODULE4B_BILLING_PLAN.md](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/docs/MODULE4B_BILLING_PLAN.md)
- [docs/MODULE4B_BILLING_OUTPUT.md](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/docs/MODULE4B_BILLING_OUTPUT.md)

## Schema changes made

Added to `Payment` in [backend/prisma/schema.prisma](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/prisma/schema.prisma):

- `stripeRefundId`
- `paymentChannel`
- `paymentMethod`
- `recordedById`
- `recordedAt`
- `notes`

Also exposed the reverse invoice relation:

- `Invoice.payments`

Migration artifact:

- [backend/prisma/migrations/20260312_module4b_billing_payment_metadata/migration.sql](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/prisma/migrations/20260312_module4b_billing_payment_metadata/migration.sql)

## Tests added or updated

Updated and expanded in [backend/src/tests/module4Remediation.test.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/tests/module4Remediation.test.ts):

- invoice finalize + legacy pay path now asserts real manual ledger creation
- Stripe-backed full refund still updates local ledger and full-reversal side effects
- duplicate refund rejection
- partial refund success on supported service-only invoices
- over-refund rejection
- manual invoice payment partial collection behavior
- receivables summary / outstanding balance calculation
- appointment payment webhook idempotency

## Verification

Verified:

- `backend: npx prisma generate`
- `backend: npm test`
- `frontend: npm run build`

Result:

- backend tests passed
- frontend build passed

## Remaining Module 4 limitations after this phase

- No live card-present Stripe Terminal flow
- No partial refund support for merchandise/package invoices
- No line-level refund allocator
- No full accounts receivable aging report
- No true recurring membership billing work in this phase
- Appointment-side remaining balance is operationally safer, but still not exposed as a dedicated finance timeline

## Readiness judgment

Module 4 is materially more honest and usable for front-desk billing than it was before this pass.

It is ready for the next sub-phase only if that next work does not assume:

- Stripe Terminal/card-present checkout already exists
- memberships are now recurring-billing complete
- merchandise/package partial refunds are supported

If the next phase is focused on narrower commerce expansion on top of this ledger-first billing model, this pass is sufficient.
