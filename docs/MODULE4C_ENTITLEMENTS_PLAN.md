## Module 4C Entitlements Plan

Date: 2026-03-12

This pass is limited to memberships, packages, and entitlement application:

1. real recurring membership purchase flow
2. reliable Stripe subscription lifecycle sync
3. package entitlement visibility
4. membership/package benefit application
5. entitlement-safe refunds and cancellations

## 1. Real recurring membership purchase flow

### Confirmed?

Yes.

Evidence:

- [backend/src/services/cartService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/cartService.ts) explicitly rejects `MEMBERSHIP` checkout with `membership_checkout_unsupported`
- [backend/src/services/membershipService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/membershipService.ts) only does admin CRUD
- there is no backend path creating a Stripe subscription for a membership purchase
- there is no patient-facing purchase surface for memberships

### Root cause

- Memberships were modeled as catalog/admin records only.
- `PatientSubscription` exists in schema, but there is no creation path that links it to a real Stripe subscription.
- The previous remediation intentionally blocked one-time membership sales rather than building a recurring flow.

### Files to change

- [backend/prisma/schema.prisma](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/prisma/schema.prisma)
- [backend/src/services/membershipService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/membershipService.ts)
- [backend/src/controllers/membershipController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/membershipController.ts)
- [backend/src/routes/memberships.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/routes/memberships.ts)
- [frontend/app/dashboard/memberships/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/memberships/page.tsx)
- [frontend/components/layout/AppSidebar.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/components/layout/AppSidebar.tsx)

### Smallest safe fix

- Add one real patient membership purchase flow using `stripe.subscriptions.create(...)` with `payment_behavior=default_incomplete`.
- Create or reuse a local `PatientSubscription` only after Stripe subscription creation succeeds.
- Return the initial invoice PaymentIntent client secret for card confirmation.
- Block duplicate active/trialing/incomplete subscriptions for the same patient and clinic.

### Tests to add

- membership purchase creates a real Stripe-linked local subscription record
- repeated purchase attempts reuse or reject safely instead of duplicating subscriptions

## 2. Reliable subscription lifecycle sync

### Confirmed?

Yes.

Evidence:

- [backend/src/controllers/webhookController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/webhookController.ts) updates `patientSubscription` on a few Stripe events, but only through raw `updateMany(...)`
- current status mapping is shallow:
  - `invoice.paid` -> `ACTIVE`
  - `customer.subscription.updated` -> `ACTIVE` or `PAST_DUE`
  - `customer.subscription.deleted` -> `CANCELED`
- schema only supports `ACTIVE`, `PAST_DUE`, `CANCELED`

### Root cause

- Subscription sync was added before the purchase flow existed.
- Status modeling is too weak for honest lifecycle tracking.
- Webhooks mutate rows without a shared mapping helper or invoice/payment reconciliation for recurring membership charges.

### Files to change

- [backend/prisma/schema.prisma](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/prisma/schema.prisma)
- [backend/src/controllers/webhookController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/webhookController.ts)
- [backend/src/services/membershipService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/membershipService.ts)

### Smallest safe fix

- Expand local subscription status modeling to cover:
  - `ACTIVE`
  - `TRIALING`
  - `PAST_DUE`
  - `INCOMPLETE`
  - `CANCELED`
  - `ENDED`
- Centralize Stripe subscription -> local status mapping.
- Make subscription webhook handling idempotent and authoritative.
- Create/reuse invoice and payment ledger rows for Stripe subscription invoices when they are paid.

### Tests to add

- subscription webhook updates local state correctly
- repeated webhook events are idempotent
- recurring membership invoice paid event does not duplicate local ledger rows

## 3. Package entitlement visibility

### Confirmed?

Yes.

Evidence:

- [frontend/app/(public)/book/[serviceId]/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/(public)/book/[serviceId]/page.tsx) shows packages only to the patient during booking
- [frontend/app/dashboard/front-desk/pos/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/front-desk/pos/page.tsx) does not show whether the selected patient has active packages or memberships
- provider surfaces do not show patient entitlement summary

### Root cause

- Package visibility was built only where package usage was first introduced.
- There is no shared entitlement summary endpoint for staff/provider operational use.

### Files to change

- [backend/src/controllers/patientController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/patientController.ts)
- [backend/src/routes/patients.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/routes/patients.ts)
- [backend/src/services/packageUsageService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/packageUsageService.ts)
- [backend/src/services/membershipService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/membershipService.ts)
- [frontend/app/dashboard/front-desk/pos/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/front-desk/pos/page.tsx)
- [frontend/app/dashboard/provider/appointments/[id]/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/provider/appointments/[id]/page.tsx)
- [frontend/lib/patientApi.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/lib/patientApi.ts)

### Smallest safe fix

- Add a patient entitlement summary endpoint returning:
  - active packages with remaining sessions
  - active/trialing memberships and discount info
- Show it in:
  - patient booking flow
  - front-desk checkout
  - provider appointment detail

### Tests to add

- package remaining sessions are exposed correctly
- active membership/package summary is returned correctly for operational screens

## 4. Membership / package benefit application

### Confirmed?

Yes.

Evidence:

- [backend/src/services/appointmentService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/appointmentService.ts) uses package selection only to skip prepayment, but still keeps `priceAtBooking` at full service price
- package rule is currently “any active package can be selected” with no clear persistence of applied entitlement beyond a usage row
- there is no membership benefit application anywhere in booking, invoicing, or payments

### Root cause

- Package support was introduced as a minimal consumption hook, not as a full entitlement pricing rule.
- Memberships have no benefit fields and no pricing hook.
- Appointment billing truth is not explicitly marked with applied package/membership context.

### Files to change

- [backend/prisma/schema.prisma](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/prisma/schema.prisma)
- [backend/src/services/appointmentService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/appointmentService.ts)
- [backend/src/services/invoiceService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/invoiceService.ts)
- [backend/src/services/membershipService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/membershipService.ts)
- [backend/src/services/packageUsageService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/packageUsageService.ts)
- [frontend/app/(public)/book/[serviceId]/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/(public)/book/[serviceId]/page.tsx)

### Smallest safe fix

- Support one narrow, explicit ruleset:
  - package-selected service booking: package takes precedence and sets bookable charge to `$0.00`
  - active/trialing membership: applies a clinic-wide service discount percentage
  - precedence: `package > membership > standard price`
- Persist enough appointment entitlement context to avoid later drift.
- Apply the same membership discount logic when a service line is manually added to an invoice and no explicit price override is supplied.

### Tests to add

- package-covered booking reduces charge to zero
- membership discount applies to supported service booking
- package vs membership precedence is deterministic
- service invoice item creation uses membership discount when eligible

## 5. Entitlement-safe refunds / cancellations

### Confirmed?

Yes.

Evidence:

- [backend/src/services/appointmentService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/appointmentService.ts) consumes package sessions at booking time
- cancellation and reschedule paths do not restore or transfer package usage
- [backend/src/services/paymentService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/paymentService.ts) blocks some package refunds only after usage exists, but membership flows are still absent

### Root cause

- Package consumption was wired into booking before release/transfer logic existed.
- Cancellation/reschedule logic is entitlement-unaware.
- Membership cancellation was never built because the purchase flow did not exist.

### Files to change

- [backend/src/services/packageUsageService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/packageUsageService.ts)
- [backend/src/services/appointmentService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/appointmentService.ts)
- [backend/src/services/membershipService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/membershipService.ts)
- [backend/src/controllers/membershipController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/membershipController.ts)
- [backend/src/routes/memberships.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/routes/memberships.ts)

### Smallest safe fix

- When a package-backed appointment is cancelled before completion, release the reserved session back to the package.
- When a package-backed appointment is rescheduled, transfer the reserved session to the new appointment instead of consuming a second one.
- Support membership cancellation as `cancel_at_period_end`, not immediate local deletion.
- Reject unsupported membership refund/cancellation combinations clearly rather than faking a full entitlement unwind.

### Tests to add

- package session is restored on cancellation
- package session is transferred on reschedule
- membership cancellation sets `cancelAtPeriodEnd` honestly
- unsupported entitlement refund/cancellation combinations fail safely
