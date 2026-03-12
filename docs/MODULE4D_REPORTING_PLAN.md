## Module 4D Reporting Plan

Date: 2026-03-12

This plan is based on the current code in `backend/src/services`, `backend/src/controllers`, `backend/src/routes`, `frontend/app/dashboard`, `frontend/lib`, and `backend/prisma/schema.prisma`.

### 1. Commission Rule Management

Issue confirmed: Yes.

Root cause:
- The backend only exposes `getRules`, `createRule`, and a narrow `updateRule(id, clinicId, isActive)` toggle in [backend/src/services/commissionService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/commissionService.ts).
- There is no rule input validation for conflicting item targets, missing required target IDs, invalid percentages, or duplicate active rules.
- The frontend “Add Rule” button on [frontend/app/dashboard/commissions/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/commissions/page.tsx) is dead UI. There is no create/edit form and no deactivation workflow beyond the backend toggle route.

Files that need to change:
- [backend/src/services/commissionService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/commissionService.ts)
- [backend/src/controllers/commissionController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/commissionController.ts)
- [backend/src/routes/commissions.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/routes/commissions.ts)
- [frontend/app/dashboard/commissions/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/commissions/page.tsx)

Smallest safe fix:
- Keep the current rule model.
- Expand backend rule validation and allow full create/update/deactivate for the supported rule types already in schema: `ALL`, `SERVICE`, `PRODUCT`, `PACKAGE` with `PERCENTAGE` and `FLAT_RATE`.
- Reject structurally invalid or conflicting active rules instead of pretending any combination is supported.
- Replace the dead frontend button with a real admin form and explicit activation/deactivation controls.

Tests to add:
- rule creation validation
- duplicate/conflicting active rule rejection
- rule update/deactivation flow
- commission calculation still chooses expected rule after rule changes

### 2. Commission Record Operations

Issue confirmed: Yes.

Root cause:
- [backend/src/services/commissionService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/commissionService.ts) returns raw records without summary totals or useful filters beyond optional `providerId`.
- [frontend/app/dashboard/commissions/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/commissions/page.tsx) only shows a flat list and “Mark All Pending as Paid”.
- Current payout handling is status-only, but the UI copy does not clearly frame it that way.

Files that need to change:
- [backend/src/services/commissionService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/commissionService.ts)
- [backend/src/controllers/commissionController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/commissionController.ts)
- [frontend/app/dashboard/commissions/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/commissions/page.tsx)

Smallest safe fix:
- Add server-side filtering by `providerId`, `status`, `dateFrom`, and `dateTo`.
- Return summary totals for pending/paid amounts and counts.
- Keep mark-paid as a status operation only, but label it honestly in the page copy.

Tests to add:
- commission record filtering and summary totals
- mark-paid changes only pending records

### 3. Revenue / Receivables Reporting

Issue confirmed: Yes.

Root cause:
- [backend/src/services/invoiceService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/invoiceService.ts) already computes invoice financial state and receivables summary, but there is no broader operational finance summary for invoiced, collected, refunded, or outstanding totals.
- [frontend/app/dashboard/front-desk/invoices/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/front-desk/invoices/page.tsx) shows AR cards and an invoice table, but no clinic-level finance summary or provider/date filtering.
- [frontend/app/dashboard/analytics/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/analytics/page.tsx) mixes generic analytics and commerce stats, but it is not an operational finance page.

Files that need to change:
- [backend/src/services/invoiceService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/invoiceService.ts)
- [backend/src/controllers/invoiceController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/invoiceController.ts)
- [backend/src/routes/invoices.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/routes/invoices.ts)
- [frontend/lib/invoiceApi.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/lib/invoiceApi.ts)
- [frontend/app/dashboard/front-desk/invoices/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/front-desk/invoices/page.tsx)

Smallest safe fix:
- Add a finance summary endpoint derived from current invoice/payment ledger rules.
- Support date-range and provider filters where the schema already supports them.
- Surface total invoiced, collected, refunded, and outstanding, plus invoice counts by financial status.

Tests to add:
- finance summary calculation with mixed paid, unpaid, partially paid, and refunded invoices
- filtered finance summary correctness

### 4. Invoice / Payment / Refund Reporting Polish

Issue confirmed: Yes.

Root cause:
- The invoice table already exposes `financialStatus`, `totalPaid`, `totalRefunded`, and `outstandingAmount` through [frontend/lib/invoiceApi.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/lib/invoiceApi.ts), but the UI still hides most payment/refund history behind modal actions and does not explain manual vs Stripe-backed payments clearly.
- There is no invoice detail or inline history view on the front-desk page.

Files that need to change:
- [frontend/app/dashboard/front-desk/invoices/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/front-desk/invoices/page.tsx)
- [frontend/components/common/StatusBadge.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/components/common/StatusBadge.tsx) if additional badge states are needed

Smallest safe fix:
- Keep the current ledger semantics.
- Expand the invoice page with inline payment/refund history, explicit channel/method labels, clearer financial summaries, and better filters/empty states.

Tests to add:
- service-level finance calculations stay coherent after payments/refunds
- no dedicated UI test unless needed; manual verification note is acceptable if backend coverage is strong

### 5. Membership / Package Operational Reporting

Issue confirmed: Yes.

Root cause:
- Entitlement summaries exist in [backend/src/services/membershipService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/membershipService.ts), but they are exposed mainly through patient/provider/front-desk patient-specific flows.
- Admin pages [frontend/app/dashboard/memberships/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/memberships/page.tsx) and [frontend/app/dashboard/packages/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/packages/page.tsx) largely show catalog data, not operational subscription/package state.
- There is no admin-facing membership/package summary endpoint.

Files that need to change:
- [backend/src/services/membershipService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/membershipService.ts)
- [backend/src/services/packageService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/packageService.ts)
- [backend/src/controllers/membershipController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/membershipController.ts)
- [backend/src/controllers/packageController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/packageController.ts)
- [backend/src/routes/memberships.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/routes/memberships.ts)
- [backend/src/routes/packages.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/routes/packages.ts)
- [frontend/app/dashboard/memberships/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/memberships/page.tsx)
- [frontend/app/dashboard/packages/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/packages/page.tsx)

Smallest safe fix:
- Add operational summary endpoints:
  - membership counts by status and recent subscriptions
  - package counts, remaining sessions, exhausted and expiring packages
- Show those summaries on existing admin pages without changing the underlying entitlement engine.

Tests to add:
- membership operational summary correctness
- package operational summary correctness

### 6. Commerce Admin Polish

Issue confirmed: Yes.

Root cause:
- The touched commerce pages use inconsistent status visibility, filtering depth, empty states, and admin/operator language.
- The backend already supports enough truth to make the pages more coherent without introducing new domain models.

Files that need to change:
- [frontend/app/dashboard/commissions/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/commissions/page.tsx)
- [frontend/app/dashboard/front-desk/invoices/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/front-desk/invoices/page.tsx)
- [frontend/app/dashboard/memberships/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/memberships/page.tsx)
- [frontend/app/dashboard/packages/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/packages/page.tsx)
- [frontend/components/common/StatusBadge.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/components/common/StatusBadge.tsx) if needed

Smallest safe fix:
- Limit polish to the commerce/admin pages already touched by Module 4.
- Unify wording around manual/offline vs Stripe/online, payout status, financial state, and unsupported operations.
- Improve loading and empty states where the current pages imply more support than they really have.

Tests to add:
- backend/service tests for new query/summary behavior
- manual verification for UI clarity changes

### Planned implementation boundary

This pass should remain operational, not analytical:
- no payroll engine
- no automated commission payouts
- no advanced BI/forecasting
- no cross-sell/recommendations
- no new entitlement logic beyond reporting current state

### Expected schema changes

Current investigation does not show a required Prisma schema change for this phase. The gap appears to be service/controller/query shape and admin UI, not missing persistence structure.
