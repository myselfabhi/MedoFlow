## Module 4C Entitlements Output

Date: 2026-03-12

This pass stayed limited to memberships, packages, and entitlement application:

1. real recurring membership purchase
2. reliable Stripe subscription sync
3. package/membership operational visibility
4. benefit application in supported booking/billing flows
5. entitlement-safe cancellation/refund behavior

## Area-by-area implementation summary

### 1. Real recurring membership purchase flow

Implemented.

What changed:

- [backend/src/services/membershipService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/membershipService.ts) now creates real Stripe subscriptions with `payment_behavior=default_incomplete`.
- Local `PatientSubscription` rows are now created only after Stripe subscription creation succeeds.
- Repeated submits now safely reuse an existing incomplete subscription instead of creating another one.
- [backend/src/controllers/membershipController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/membershipController.ts) and [backend/src/routes/memberships.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/routes/memberships.ts) now expose:
  - `GET /memberships/subscriptions/me`
  - `POST /memberships/:id/purchase`
  - `POST /memberships/subscriptions/:subscriptionId/cancel`
- [frontend/app/dashboard/memberships/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/memberships/page.tsx) is now role-aware:
  - admin still sees membership catalog
  - patient now gets a real subscription purchase/cancel surface with Stripe confirmation

### 2. Reliable subscription lifecycle sync

Implemented for the supported Stripe lifecycle.

What changed:

- [backend/prisma/schema.prisma](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/prisma/schema.prisma) now models:
  - `ACTIVE`
  - `TRIALING`
  - `INCOMPLETE`
  - `PAST_DUE`
  - `CANCELED`
  - `ENDED`
- `PatientSubscription.stripeSubscriptionId` is now unique and `stripeCustomerId` is persisted.
- [backend/src/services/membershipService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/membershipService.ts) centralizes Stripe -> local status mapping.
- [backend/src/controllers/webhookController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/webhookController.ts) now routes subscription lifecycle through that shared sync logic.
- Membership recurring invoice payments now create or reuse local invoice/payment ledger rows idempotently through `recordPaidSubscriptionInvoice(...)`.

### 3. Package entitlement visibility

Implemented as operational visibility, not analytics.

What changed:

- [backend/src/services/membershipService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/membershipService.ts) now returns a patient entitlement summary with:
  - active packages
  - remaining sessions
  - active/trialing/past_due/incomplete subscriptions
  - active membership discount summary
- [backend/src/controllers/patientController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/patientController.ts) and [backend/src/routes/patients.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/routes/patients.ts) now expose:
  - `GET /patients/entitlements` for the patient
  - `GET /patients/:patientId/entitlements` for provider/front desk/admin
- The summary is now surfaced in:
  - [frontend/app/(public)/book/[serviceId]/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/(public)/book/[serviceId]/page.tsx)
  - [frontend/app/dashboard/front-desk/pos/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/front-desk/pos/page.tsx)
  - [frontend/app/dashboard/provider/appointments/[id]/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/provider/appointments/[id]/page.tsx)

### 4. Membership/package benefit application

Implemented with a narrow, explicit ruleset.

Supported rules now:

- Package-selected booking:
  - supported in the patient booking flow only
  - package takes precedence over membership
  - appointment charge becomes `$0.00`
  - appointment payment requirement becomes `NONE`
- Membership discount:
  - applies automatically when the patient has an `ACTIVE` or `TRIALING` subscription
  - applies only to service pricing
  - rule is clinic-wide percentage discount from `Membership.serviceDiscountPercent`
  - applies when no package session is selected
- Precedence:
  - `package > membership > standard price`
- Billing application:
  - [backend/src/services/invoiceService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/invoiceService.ts) now applies the same membership discount when a service invoice item is created from the catalog without an explicit price override

What changed:

- [backend/prisma/schema.prisma](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/prisma/schema.prisma) now stores `Membership.serviceDiscountPercent`.
- [backend/src/services/appointmentService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/appointmentService.ts) now:
  - prices package-backed appointments at zero
  - applies membership discount to supported service bookings
  - recalculates deposit/full prepayment from the discounted amount
- [backend/src/services/invoiceService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/invoiceService.ts) now applies membership discount to service line items when the invoice patient has an active/trialing membership and no manual price override is supplied

### 5. Entitlement-safe refunds / cancellations

Implemented for the flows this phase actually exposes.

What changed:

- [backend/src/services/appointmentService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/appointmentService.ts) now releases reserved package sessions on cancellation before completion/no-show.
- Package-backed reschedules now transfer the existing reserved session instead of consuming a second session.
- Provider-side direct status changes to `CANCELLED` also release package reservations.
- Membership cancellation is now truthful:
  - supported as `cancel_at_period_end`
  - not as fake immediate local deletion
- [backend/src/services/paymentService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/paymentService.ts) now explicitly rejects membership invoice refunds from the app with a machine-readable error instead of pretending a safe unwind exists.

## What was implemented

- real Stripe-backed recurring membership checkout
- local Stripe-linked `PatientSubscription` creation and reuse
- shared Stripe subscription status mapping
- idempotent local ledger creation for paid membership invoices
- patient/provider/front-desk entitlement summary API
- patient membership management UI
- patient booking package coverage with zero-charge pricing
- membership discount application to supported service booking
- membership discount application to service invoice items
- package session release on cancellation
- package session transfer on reschedule
- truthful membership cancel-at-period-end flow

## What benefit rules are now truly supported

- One active membership per patient per clinic is the supported model.
- Membership benefit:
  - clinic-wide percentage discount on services only
  - active/trialing subscriptions only
- Package benefit:
  - one selected package session can cover one booking
  - currently supported in the patient booking flow
- Precedence:
  - selected package session wins over membership discount

## What was intentionally narrowed

- No multiple concurrent memberships per patient/clinic
- No line-item package application in front-desk invoice creation
- No package-to-service coverage matrix; active packages are still treated as clinic-wide session bundles
- No membership refund workflow in-app
- No prorations, plan swaps, or billing-portal-grade subscription management
- `PAST_DUE` subscriptions are visible but do not grant discount benefits

## Files changed

Backend:

- [backend/prisma/schema.prisma](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/prisma/schema.prisma)
- [backend/prisma/migrations/20260312_module4c_entitlements/migration.sql](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/prisma/migrations/20260312_module4c_entitlements/migration.sql)
- [backend/src/controllers/membershipController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/membershipController.ts)
- [backend/src/controllers/patientController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/patientController.ts)
- [backend/src/controllers/webhookController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/webhookController.ts)
- [backend/src/routes/memberships.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/routes/memberships.ts)
- [backend/src/routes/patients.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/routes/patients.ts)
- [backend/src/services/appointmentService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/appointmentService.ts)
- [backend/src/services/invoiceService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/invoiceService.ts)
- [backend/src/services/membershipService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/membershipService.ts)
- [backend/src/services/packageUsageService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/packageUsageService.ts)
- [backend/src/services/paymentService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/paymentService.ts)
- [backend/src/tests/module4Entitlements.test.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/tests/module4Entitlements.test.ts)

Frontend:

- [frontend/app/(public)/book/[serviceId]/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/(public)/book/[serviceId]/page.tsx)
- [frontend/app/dashboard/front-desk/pos/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/front-desk/pos/page.tsx)
- [frontend/app/dashboard/memberships/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/memberships/page.tsx)
- [frontend/app/dashboard/provider/appointments/[id]/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/provider/appointments/[id]/page.tsx)
- [frontend/components/layout/AppSidebar.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/components/layout/AppSidebar.tsx)
- [frontend/lib/membershipApi.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/lib/membershipApi.ts)
- [frontend/lib/patientApi.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/lib/patientApi.ts)

Docs:

- [docs/MODULE4C_ENTITLEMENTS_PLAN.md](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/docs/MODULE4C_ENTITLEMENTS_PLAN.md)
- [docs/MODULE4C_ENTITLEMENTS_OUTPUT.md](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/docs/MODULE4C_ENTITLEMENTS_OUTPUT.md)

## Schema changes made

- `SubscriptionStatus` expanded with:
  - `TRIALING`
  - `INCOMPLETE`
  - `ENDED`
- `Membership.serviceDiscountPercent`
- `Invoice.stripeInvoiceId` with unique index
- `PatientSubscription.stripeCustomerId`
- `PatientSubscription.stripeSubscriptionId` made unique

Migration artifact:

- [backend/prisma/migrations/20260312_module4c_entitlements/migration.sql](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/prisma/migrations/20260312_module4c_entitlements/migration.sql)

## Tests added or updated

Added in [backend/src/tests/module4Entitlements.test.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/tests/module4Entitlements.test.ts):

- real membership purchase creates Stripe-linked local subscription
- repeated membership purchase safely reuses incomplete subscription
- Stripe subscription status mapping is honest
- recurring membership invoice paid handling is idempotent
- package remaining sessions are exposed correctly
- package-backed booking sets price to zero
- membership discount applies to supported booking
- package precedence over membership discount
- membership refund combinations fail safely
- package session is restored on cancellation

Existing backend suite still passes after this phase.

## Verification

Verified:

- `backend: npx prisma generate`
- `backend: npm test`
- `frontend: npm run build`

Result:

- backend tests passed
- frontend build passed

## Remaining Module 4 limitations after this phase

- Package coverage is still clinic-wide rather than service-specific
- Front-desk invoice flow does not yet let staff explicitly consume a package instead of charging
- No membership upgrades/downgrades or plan swaps
- No Stripe customer portal integration
- No in-app membership refund support
- No proration handling
- Recurring membership renewals now ledger cleanly, but there is still no dedicated subscription finance dashboard

## Readiness judgment

Module 4 is now materially more truthful around entitlements than it was before this pass.

It is ready for the next sub-phase only if that next work does not assume:

- service-specific package applicability already exists
- front-desk package consumption is already implemented
- membership refunds, swaps, or prorations are already supported

If the next work stays on top of this narrower entitlement model, this phase is sufficient.
