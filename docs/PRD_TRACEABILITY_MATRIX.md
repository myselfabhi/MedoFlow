# MedoFlow PRD Traceability Matrix

Status key: `Done` / `Partial` / `Missing`

## Module 1 - Clinic Infrastructure

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| M1-01 | Clinic + single-location launch with multi-location-ready data model | Partial | `backend/prisma/schema.prisma` (`Clinic`, `Location`), `backend/src/routes/locations.ts` |
| M1-02 | Discipline CRUD + archive behavior | Partial | `backend/src/services/disciplineService.ts`, `backend/src/routes/disciplines.ts` |
| M1-03 | Service under exactly one discipline | Done | `backend/prisma/schema.prisma` (`Service.disciplineId`), `backend/src/services/serviceService.ts` |
| M1-04 | Provider multi-discipline + multi-service assignment | Done | `ProviderDiscipline`, `ProviderService` models; `backend/src/services/providerService.ts` |
| M1-05 | Service default pricing + provider override pricing | Done | `Service.defaultPrice`, `ProviderService.priceOverride`, `backend/src/services/appointmentService.ts` |
| M1-06 | Fixed roles: Super Admin / Provider / Front Desk | Done | `Role` enum, auth middleware in `backend/src/middleware/auth.ts` |
| M1-07 | Data ownership (clinic owns patient data; provider deactivation preserves data) | Partial | record scoping via `backend/src/middleware/requireClinic.ts`; provider deactivation in `backend/src/services/providerService.ts` |
| M1-08 | Analytics tagging with provider/discipline/service/location IDs | Partial | IDs stored in `Appointment`, `VisitRecord`, `InvoiceItem`; aggregations in `backend/src/services/analyticsService.ts` |
| M1-09 | Soft-delete-first operations | Partial | service/discipline/provider/file soft flags exist; no universal restore contract |

## Module 2 - Appointment Scheduling

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| M2-01 | Service-first booking flow | Done | `frontend/app/(public)/book/[serviceId]/page.tsx` |
| M2-02 | Provider-first shortcut path | Missing | No dedicated provider-first entry flow |
| M2-03 | Prepayment policies and `PENDING_PAYMENT` confirmation gate | Done | `backend/src/services/appointmentService.ts`, `backend/src/services/paymentService.ts` |
| M2-04 | Slot hold + release lifecycle | Partial | `backend/src/routes/public.ts` hold endpoints; frontend integration incomplete before this phase |
| M2-05 | Cancellation / reschedule with policy handling | Done | `cancelAppointment`, `rescheduleAppointment` in `backend/src/services/appointmentService.ts` |
| M2-06 | Recurring appointments | Partial | `createRecurringSeries` exists (weekly); limited management lifecycle |
| M2-07 | Waitlist automation | Done | `backend/src/services/waitlistService.ts`, waitlist UI flow |
| M2-08 | Strict no-double-booking / concurrency safety | Partial | app-level overlap checks present; DB-level exclusion lock absent |
| M2-09 | Provider availability and impact preview | Done | `backend/src/services/availabilityService.ts`, provider availability page |
| M2-10 | Role-based calendar access | Partial | provider calendar strong; other role calendar experiences are limited |

## Module 3 - Patient Record + AI Scribe

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| M3-01 | Visit records and SOAP schema | Done | `VisitRecord`, `VisitNoteVersion`, `backend/src/services/visitService.ts` |
| M3-02 | AI draft generation flow | Done | `backend/src/queues/aiScribeQueue.ts`, `backend/src/services/openaiService.ts` |
| M3-03 | Draft vs final legal boundary enforcement | Partial | approval exists; draft exposure/flow hardening required |
| M3-04 | Patient-friendly summary generation | Done | `generatePatientSummary` + approval path in AI scribe service |
| M3-05 | Immutable edit history | Partial | version rows exist; no stronger tamper-proof controls |
| M3-06 | Treatment plans + progress | Done | `backend/src/services/treatmentPlanService.ts` |
| M3-07 | Intake forms templates and response storage | Done | `FormTemplate`, `FormResponse`, `backend/src/services/formService.ts` |
| M3-08 | Multi-provider access boundaries | Partial | role checks present; consistency gaps across screens/endpoints |
| M3-09 | File soft delete and searchability | Partial | soft delete available; limited API filtering/search surfaces |
| M3-10 | Compliance controls (consent/retention) | Partial | auth/audit present; explicit consent + retention controls incomplete |

## Module 4 - Storefront + Revenue Engine

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| M4-01 | Product catalog (distinct from services) | Missing | No `Product` model/routes in current schema |
| M4-02 | Inventory engine | Missing | No inventory models/services in current schema |
| M4-03 | Cart + checkout for mixed item types | Partial | appointment checkout exists, no full cart object |
| M4-04 | Package and membership commerce | Missing | No package/membership entities yet |
| M4-05 | Invoice engine with line-level controls | Done | `Invoice`, `InvoiceItem`, `backend/src/services/invoiceService.ts` |
| M4-06 | Payments + refunds | Partial | payment confirm/fail exists; refund flow was missing before this phase |
| M4-07 | Commission engine | Missing | no commission model/services pre-phase |
| M4-08 | Tax engine configurability | Partial | service tax flag + basic calculation; no rule engine |
| M4-09 | Shipping support | Missing | no shipping models/services |

## Module 5 - Analytics + BI

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| M5-01 | Core analytics dashboard | Done | `backend/src/services/analyticsService.ts`, `frontend/app/dashboard/analytics/page.tsx` |
| M5-02 | Provider performance views | Partial | partial metrics only |
| M5-03 | Role-safe analytics access | Partial | backend RBAC exists; frontend route usage mismatches existed |
| M5-04 | Exportable reports | Missing | no analytics export endpoint pre-phase |
| M5-05 | Scheduled reports and benchmark insights | Missing | no scheduling/benchmarking layer pre-phase |

## Immediate Gap Priorities

1. Role/access correctness and AI scribe legal boundary hardening
2. Slot-hold integration and availability consistency
3. Provider deactivation + discipline archive guardrails
4. Refund + analytics export baseline
5. Base commerce entities for staged rollout
