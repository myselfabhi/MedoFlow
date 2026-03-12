## Module 5 Implementation Plan

Date: 2026-03-12

### Current state

The existing analytics layer is shallow and not sufficient for Module 5:
- [backend/src/services/analyticsService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/analyticsService.ts) currently exposes only a few generic aggregates and mixes invoice status with revenue truth.
- [backend/src/controllers/analyticsController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/analyticsController.ts) and [backend/src/routes/analytics.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/routes/analytics.ts) provide only a handful of coarse endpoints.
- [frontend/app/dashboard/analytics/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/analytics/page.tsx) is a thin dashboard on top of those endpoints, not a BI layer.

### Reusable foundations from Modules 1–4

The following services are now strong enough to support real analytics:
- Finance / ledger truth:
  - [backend/src/services/invoiceService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/invoiceService.ts)
  - [backend/src/services/paymentService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/paymentService.ts)
- Scheduling / lifecycle truth:
  - [backend/src/services/appointmentService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/appointmentService.ts)
  - [backend/src/services/schedulingCore.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/schedulingCore.ts)
- Membership/package operational state:
  - [backend/src/services/membershipService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/membershipService.ts)
  - [backend/src/services/packageService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/packageService.ts)
  - [backend/src/services/packageUsageService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/packageUsageService.ts)
- Commission state:
  - [backend/src/services/commissionService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/commissionService.ts)
- Core schema entities already exist in [backend/prisma/schema.prisma](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/prisma/schema.prisma):
  - appointments, invoices, payments, invoice items, products, packages, memberships, patient subscriptions, patient packages, commission rules/records, treatment plans, visit records

### Safe metric areas now

These are implementable truthfully from the current code/model:
- clinic finance summary from invoice/payment ledger
- receivables and refunded amounts
- appointment lifecycle metrics
- provider utilization based on scheduled appointment minutes vs availability minutes
- service/provider/discipline revenue and volume
- product/package/membership revenue from paid invoice items
- commission owed/paid/pending from commission records
- membership churn using current subscription statuses and period windows
- package utilization from patient package totals and usage
- patient lifetime value and repeat visit rates from paid invoices and completed appointments
- business alerts as deterministic period-over-period or threshold rules

### Metrics that need narrowed definitions

- `average revenue per patient`
  - narrow to `collected revenue / distinct patients with invoices in range`
- `average revenue per visit`
  - narrow to `collected revenue / completed appointments in range`
- `provider revenue`
  - narrow to invoice/provider-linked collected revenue for that provider
- `follow-up conversion rate`
  - narrow to patients with a completed appointment who booked another later appointment with the same provider within 90 days
- `patient retention rate`
  - narrow to repeat-visit rate within the selected period, not a cohort survival model
- `drop-off risk`
  - narrow deterministic rule: previously repeat patient with no completed visit in the last 90 days and no upcoming appointment
- `attach rate`
  - only support `share of appointment-linked invoices that include at least one product item`
- `provider utilization`
  - narrow to scheduled appointment minutes divided by configured weekly availability minutes projected over the selected range

### Backend work planned

Replace the current analytics service with a backend-first analytics layer that provides:
- central date-range parsing and previous-period comparison
- clinic command-center summary
- provider personal analytics
- operations summary
- patient analytics summary
- commerce analytics summary
- membership/package analytics summary
- commission analytics summary
- business alerts
- filtered leaderboard/breakdown endpoints
- CSV export for the main supported summaries

The service layer will be implemented in [backend/src/services/analyticsService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/analyticsService.ts) rather than split into many new files unless complexity forces it.

### Frontend work planned

Reuse [frontend/app/dashboard/analytics/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/analytics/page.tsx) as the main Module 5 entry point, but rebuild it around:
- role-aware admin/provider states
- real date range filters
- finance cards
- operations cards
- provider-specific cards
- commerce cards
- membership/package cards
- commission cards
- business alerts
- leaderboards and operational tables

### Role visibility plan

Server-side enforced:
- `SUPER_ADMIN`
  - clinic-wide finance, provider comparisons, commissions, commerce, patient analytics, alerts
- `FRONT_DESK`
  - operational analytics and high-level clinic command center
  - no provider-vs-provider detailed finance breakdowns unless already appropriate; keep provider comparison/admin finance in admin scope
- `PROVIDER`
  - personal analytics only
  - no clinic-wide finance or other providers’ detailed metrics
- `PATIENT`
  - no analytics endpoints

### Likely files to change

Backend:
- [backend/src/services/analyticsService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/analyticsService.ts)
- [backend/src/controllers/analyticsController.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/controllers/analyticsController.ts)
- [backend/src/routes/analytics.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/routes/analytics.ts)

Frontend:
- [frontend/lib/analyticsApi.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/lib/analyticsApi.ts)
- [frontend/app/dashboard/analytics/page.tsx](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/frontend/app/dashboard/analytics/page.tsx)

Tests:
- new Module 5 analytics test file(s) under [backend/src/tests](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/tests)

Docs:
- [docs/MODULE5_IMPLEMENTATION_PLAN.md](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/docs/MODULE5_IMPLEMENTATION_PLAN.md)
- [docs/MODULE5_METRIC_DEFINITIONS.md](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/docs/MODULE5_METRIC_DEFINITIONS.md)
- [docs/MODULE5_IMPLEMENTATION_OUTPUT.md](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/docs/MODULE5_IMPLEMENTATION_OUTPUT.md)

### Schema changes expected

Current investigation does not require a Prisma schema change.

The current schema already contains the entities needed for operational analytics. The gap is in filtered, role-aware aggregation and in exposing it coherently.
