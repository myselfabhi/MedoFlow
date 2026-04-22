---
description: Explain what MedoFlow is — product, stack, features, roles, and architecture
---

# About MedoFlow

Respond to the user with the following overview. Use the file paths as evidence and adapt wording if the user asks for more or less depth.

## One-line pitch

MedoFlow is a clinic-management SaaS that unifies appointment scheduling, AI-assisted clinical documentation (SOAP notes), billing & commissions, patient packages / memberships, retail commerce, and analytics in a single platform.

## Tech stack

- **Frontend**: Next.js 14 (App Router) + React 18 + TypeScript, Tailwind CSS, Radix UI, TanStack Query, React Hook Form + Zod, Stripe React SDK, Recharts, Framer Motion
- **Backend**: Node.js + Express + TypeScript, Prisma ORM over PostgreSQL, BullMQ + Redis for jobs, JWT auth, AWS S3 for files
- **AI / integrations**: OpenAI (SOAP generation), `nodejs-whisper` (audio transcription), Google Calendar API, Stripe (payments + subscriptions), Nodemailer

## Major feature areas (with evidence)

1. **Clinic infrastructure & RBAC** — multi-location clinics, staff provisioning, custom roles with granular permissions, audit logging. See [backend/src/routes/roles.ts](backend/src/routes/roles.ts), [backend/src/services/roleService.ts](backend/src/services/roleService.ts).
2. **Appointments & availability** — service-first booking, provider schedules, slot holds with Stripe prepay, recurring series, waitlist, cancel/reschedule policies. See [backend/src/routes/appointments.ts](backend/src/routes/appointments.ts), [backend/src/services/availabilityService.ts](backend/src/services/availabilityService.ts), [frontend/app/dashboard/appointments](frontend/app/dashboard/appointments).
3. **Clinical records & AI Scribe** — immutable SOAP version history, AI-generated drafts from recorded consultations, treatment plans, customizable intake forms, patient file uploads, Google Meet consultations. See [backend/src/services/aiScribeService.ts](backend/src/services/aiScribeService.ts), [backend/src/controllers/visitController.ts](backend/src/controllers/visitController.ts).
4. **Billing, commerce & commissions** — invoices (draft → finalize → paid), Stripe + manual payments, refunds, inventory-tracked products, pre-paid session packages, Stripe-powered memberships with auto-discounts, provider commission rules (flat/%), front-desk POS. See [backend/src/services/invoiceService.ts](backend/src/services/invoiceService.ts), [backend/src/services/commissionService.ts](backend/src/services/commissionService.ts).
5. **Patient portal** — booking, checkout, published clinical summaries, package/membership status, file downloads. See [frontend/app/dashboard/patient](frontend/app/dashboard/patient), [frontend/app/(public)/book](<frontend/app/(public)/book>).
6. **Analytics** — revenue, collections, AR, cancellation rate, provider utilization, top services, scope-enforced (provider sees self, admin sees all), CSV export. See [backend/src/services/analyticsService.ts](backend/src/services/analyticsService.ts).

## User roles

`SUPER_ADMIN`, `PROVIDER`, `FRONT_DESK`, `ACCOUNTING`, `MARKETING`, `PATIENT`, `STAFF`, plus admin-defined **custom roles** with permission arrays (e.g. `appointments.view`, `billing.manage`). Defined in [backend/prisma/schema.prisma](backend/prisma/schema.prisma) and the `CustomRole` model.

## Architecture

```
frontend/   Next.js 14 app (port 3000) — (auth), (public), dashboard/* per role
backend/    Express + Prisma (port 3001) — routes/, controllers/, services/, queues/
  prisma/   45 models; seed_demo.ts provisions a full year of demo data
docs/       RUNBOOK.md, DEMO_BUILD_SUMMARY.md, POST_ONBOARDING_GAP_PLAN.md
```

## Key workflows

- **Booking**: patient picks service → provider + slot → Stripe prepay → confirmed
- **Visit**: provider records consult → Whisper transcribes → OpenAI drafts SOAP → provider publishes patient-facing summary (PHI boundary enforced)
- **Billing**: line items (service + product + membership discount) → Stripe/cash → commission auto-posted
- **Package consumption**: each visit deducts from the patient's prepaid session balance

End with: "Ask me for a deep dive on any of these areas."
