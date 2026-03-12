## Module 4B Billing Plan

Date: 2026-03-12

This pass is limited to real billing and operational payment flows:

1. real front-desk checkout
2. manual invoice payment semantics
3. partial refunds
4. appointment payment/webhook tightening
5. AR/outstanding balance visibility

## 1. Real Walk-In POS / Front-Desk Checkout

### Confirmed?

Yes.

Evidence:

- [frontend/app/dashboard/front-desk/pos/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/front-desk/pos/page.tsx) is currently an honest disabled placeholder
- [backend/src/services/invoiceService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/invoiceService.ts) only supports service invoice items
- there is no existing real front-desk mixed-catalog checkout flow

### Root cause

- The old POS was disabled because it was fake.
- The invoice service is appointment/service-centric and does not support product/package line items for front-desk checkout.
- There is no backend path that turns a front-desk catalog selection into invoice + payment records.

### Files to change

- [frontend/app/dashboard/front-desk/pos/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/front-desk/pos/page.tsx)
- [frontend/lib/invoiceApi.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/lib/invoiceApi.ts)
- [backend/src/services/invoiceService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/invoiceService.ts)
- [backend/src/controllers/invoiceController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/invoiceController.ts)
- [backend/src/routes/invoices.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/routes/invoices.ts)

### Smallest safe fix

- Reframe POS as a real front-desk checkout screen backed by invoices.
- Support creating a walk-in invoice without an appointment/provider.
- Support adding `SERVICE`, `PRODUCT`, and `PACKAGE` line items to an invoice.
- Finalize the invoice and either:
  - record a real manual/offline payment
  - leave it outstanding as a real receivable

### Tests to add

- front-desk invoice creation without appointment/provider
- adding mixed catalog items produces real invoice totals
- manual payment on front-desk invoice creates real ledger state

## 2. Manual Invoice Payment Collection Semantics

### Confirmed?

Yes.

Evidence:

- [backend/src/services/invoiceService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/invoiceService.ts) `payInvoice()` still just flips invoice status to `PAID`
- [frontend/app/dashboard/front-desk/invoices/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/front-desk/invoices/page.tsx) still exposes this as “Mark Paid”
- no payment method, notes, collector, or amount are captured

### Root cause

- Invoice payment was modeled as a document status change rather than a ledger entry.
- There is no explicit manual/offline payment recording flow.

### Files to change

- [backend/prisma/schema.prisma](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/prisma/schema.prisma)
- [backend/src/services/paymentService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/paymentService.ts)
- [backend/src/services/invoiceService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/invoiceService.ts)
- [backend/src/controllers/invoiceController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/invoiceController.ts)
- [backend/src/routes/invoices.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/routes/invoices.ts)
- [frontend/app/dashboard/front-desk/invoices/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/front-desk/invoices/page.tsx)
- [frontend/lib/invoiceApi.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/lib/invoiceApi.ts)

### Smallest safe fix

- Add an explicit manual payment recording endpoint for invoices.
- Persist:
  - payment amount
  - payment method
  - recorded/collected timestamp
  - recordedBy user
  - optional notes
- Keep Stripe-backed and manual/offline payments distinguishable in the ledger.
- Stop using invoice status alone as the source of finance truth.

### Tests to add

- manual payment creates a `Payment` row with manual metadata
- partial manual payment leaves invoice outstanding
- full manual payment moves invoice to fully paid state

## 3. Partial Refunds

### Confirmed?

Yes.

Evidence:

- [backend/src/services/paymentService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/paymentService.ts) only supports full refunds
- refund path currently creates one negative row equal to the full payment amount

### Root cause

- Refund logic assumes a single full reversal per payment.
- There is no remaining-refundable calculation or partial-amount input.
- Merchandise/package side-effect reversal is only reasonable for full reversal with the current model.

### Files to change

- [backend/src/services/paymentService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/paymentService.ts)
- [backend/src/controllers/paymentController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/paymentController.ts)
- [backend/src/controllers/webhookController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/webhookController.ts)
- [frontend/app/dashboard/front-desk/invoices/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/front-desk/invoices/page.tsx)
- [frontend/lib/invoiceApi.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/lib/invoiceApi.ts)

### Smallest safe fix

- Add refund amount input to the refund path.
- Calculate remaining refundable amount from the original payment and prior refund rows.
- Support partial refunds for:
  - appointment Stripe-backed payments
  - Stripe-backed invoices without merchandise/package side-effect reversal requirements
- Keep full refund support for cart/store flows with inventory/package reversal.
- Reject partial refunds for invoices containing products/packages when proportional side-effect reversal is not safely supported.

### Tests to add

- partial refund within remaining refundable amount succeeds
- over-refund is rejected
- partial refund updates ledger and outstanding balance coherently
- partial refund on merchandise/package invoice is rejected if unsupported

## 4. Appointment Payment / Webhook / Idempotency Tightening

### Confirmed?

Yes.

Evidence:

- [backend/src/controllers/webhookController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/webhookController.ts) `handleAppointmentPaymentIntentSucceeded()` still sends confirmation email every time the webhook is replayed
- appointment state updates are not gated on “already processed” conditions strongly enough
- deposit/full payment remaining balance is not surfaced clearly

### Root cause

- Appointment webhook logic updates appointment and sends side effects before checking whether the payment intent was already fully processed.
- Appointment finance truth is split across appointment fields and payment rows without a derived balance view.

### Files to change

- [backend/src/controllers/webhookController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/webhookController.ts)
- [backend/src/services/paymentService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/paymentService.ts)
- [backend/src/services/invoiceService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/invoiceService.ts)
- possibly [backend/src/services/appointmentService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/appointmentService.ts) for derived appointment balance exposure

### Smallest safe fix

- Make appointment webhook success idempotent:
  - no duplicate emails
  - no duplicate invoice/payment status mutation
- Compute remaining balance from payment ledger rather than assuming one full payment
- Keep appointment status semantics aligned with net collected amount and refund state

### Tests to add

- repeated appointment payment webhook does not duplicate email or ledger changes
- deposit payment and remaining balance calculation are correct
- refund changes appointment-related outstanding balance coherently

## 5. Basic AR / Outstanding Balance Visibility

### Confirmed?

Yes.

Evidence:

- [frontend/app/dashboard/front-desk/invoices/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/front-desk/invoices/page.tsx) only shows invoice status and total
- [backend/src/services/invoiceService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/invoiceService.ts) returns invoices without derived payment totals or outstanding balance
- [backend/src/services/analyticsService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/analyticsService.ts) has no receivables-specific summary

### Root cause

- Invoice document status is being used as a proxy for finance state.
- There is no derived outstanding-balance projection over invoice + payment ledger rows.

### Files to change

- [backend/src/services/invoiceService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/invoiceService.ts)
- [backend/src/controllers/invoiceController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/invoiceController.ts)
- [backend/src/services/analyticsService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/analyticsService.ts)
- [frontend/app/dashboard/front-desk/invoices/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/front-desk/invoices/page.tsx)
- [frontend/lib/invoiceApi.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/lib/invoiceApi.ts)

### Smallest safe fix

- Add derived invoice finance fields:
  - `totalPaid`
  - `totalRefunded`
  - `outstandingAmount`
  - `financialStatus`
- Add a small AR summary for clinic staff:
  - invoice counts by finance state
  - outstanding receivables total
- Show those values in the front-desk invoice list.

### Tests to add

- outstanding amount calculation is correct after manual payment
- outstanding amount calculation is correct after partial refund
- invoice financial status derivation is correct for unpaid, partially paid, paid, partially refunded, and refunded states
