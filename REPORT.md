# MedoFlow — Phase 0 Audit Report

_Generated 2026-04-19 on branch `claude/brave-saha-2b473d`. No code has been modified; this is a read-only audit that exists so we can decide Phase 0 step 3 (monorepo restructure) before we touch anything._

---

## 1. Current file/folder structure

The repo is **not** a monorepo. There is no root `package.json`, no `pnpm-workspace.yaml`, no `turbo.json`. Two sibling apps, plus docs and some stray root files.

```
/ (repo root)
├── README.md
├── render.yaml                  # Render.com deploy manifest
├── backend/                     # Express + Prisma API (port 3001)
│   ├── package.json             # npm (not pnpm), node --test runner
│   ├── tsconfig.json            # strict:true, but missing noUncheckedIndexedAccess/noImplicitOverride
│   ├── Dockerfile
│   ├── .env.example
│   ├── src/
│   │   ├── app.ts, server.ts
│   │   ├── config/
│   │   ├── controllers/         # 31 files
│   │   ├── middleware/          # auth, clinicScope, errorHandler, requireClinic, validateRequest
│   │   ├── queues/              # BullMQ
│   │   ├── routes/              # 35 route files
│   │   ├── scheduler/
│   │   ├── services/            # 40 service files
│   │   ├── tests/               # 10 test files (node --test)
│   │   ├── types/, utils/, validation/
│   ├── prisma/
│   │   ├── schema.prisma        # 45 models, 1287 lines
│   │   ├── migrations/          # 4 migrations
│   │   ├── seed.ts, seed_demo.ts, seed_custom.ts
│   │   └── {check_*, fix_*, restore_*, backfill_*}.ts  # one-off scripts
│   └── scripts/
├── frontend/                    # Next.js 14.2 App Router (port 3000)
│   ├── package.json
│   ├── tsconfig.json            # strict:true, paths:{ "@/*": ["./*"] }
│   ├── app/
│   │   ├── (auth)/, (public)/, dashboard/
│   ├── components/              # 22 top-level + nested by domain
│   ├── contexts/, hooks/, lib/, public/
│   └── vercel.json
├── docs/                        # 8 markdown docs (RUNBOOK, DEMO_*, POST_ONBOARDING_GAP_PLAN, UI_UX_*)
├── find_legacy.js               # Root clutter — one-off script
├── medoflow.css                 # 84 KB — stray
├── medoflow.js                  # 0 bytes — stray
├── minified.js                  # 501 KB — ⚠️ large stray asset
└── modify_schema.py             # one-off
```

**Clean-up candidates at root** (confirm before deleting): `find_legacy.js`, `medoflow.css`, `medoflow.js`, `minified.js`, `modify_schema.py`. These look like migration artifacts.

---

## 2. Prisma models — completeness

All **45 models** appear fully specified with relations and indexes; none are stubs. Categorized:

| Category       | Models                                                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Core / tenancy | Clinic, User, CustomRole, RefreshToken, PasswordSetupToken, AuditLog                                                                      |
| Catalog        | Discipline, Provider, ProviderDiscipline, ProviderLocationAssignment, Service, ProviderService, Location                                  |
| Availability   | ProviderAvailability, ProviderUnavailability, SlotHold, WaitlistEntry, AppointmentSeries                                                  |
| Appointments   | Appointment, PatientClinicMembership                                                                                                      |
| Clinical       | VisitRecord, VisitNoteVersion, AIScribeSession, Prescription, TreatmentPlan, FormTemplate, FormResponse, ConsultationSession, PatientFile |
| Commerce       | Product, InventoryItem, Package, PatientPackage, PackageSessionUsage, Membership, PatientSubscription, Cart, CartItem                     |
| Finance        | Invoice, InvoiceItem, Payment, CommissionRule, CommissionRecord                                                                           |
| Integrations   | GoogleCalendarConnection, GoogleCalendarEvent                                                                                             |

### ⚠️ Critical tenancy gap

There is **no `Tenant` model**. `clinicId` is currently the de-facto tenant boundary. Every tenanted row has `clinicId`, and `backend/src/middleware/clinicScope.ts` enforces `req.user.clinicId` matching on writes. Isolation is **application-layer only** — there is **no Postgres Row-Level Security, no session-variable isolation, no enforced guard at the DB level**.

The PRD calls for a separate `Tenant` above clinics (so one customer account can have multiple physical `Location`s and potentially multiple `Clinic`s). This is an **ambiguous design question** — see §6.

---

## 3. Tests — what exists, what's missing

**Backend** — 10 files in `backend/src/tests/`, run via `node --test dist/tests/**/*.test.js` (tests run against the compiled output, not source):

- `consultationSession.test.ts`
- `criticalRemediation.test.ts`
- `module3PatientAccess.test.ts`
- `module4Entitlements.test.ts`
- `module4Remediation.test.ts`
- `module4Reporting.test.ts`
- `module5Analytics.test.ts`
- `phase1LaunchHardening.test.ts`
- `releaseHardening.test.ts`
- `schedulingCore.test.ts`

Good coverage on entitlements, analytics, scheduling core, consultation. **Missing**:

- **Zero frontend tests** (no Vitest/Jest/Playwright configured)
- No cross-tenant leak tests (critical for the PRD multi-tenancy phase)
- No E2E tests
- No visual regression tests
- No property-based tests (no `fast-check` installed)
- No integration tests against ephemeral Postgres/Redis (no testcontainers)
- No CI running any of the above (no `.github/workflows/`)

---

## 4. TODO / FIXME / XXX / HACK

**Zero** occurrences in any `*.ts` / `*.tsx` source file across backend/src and frontend. The only hit is inside `backend/package-lock.json`, which is a dependency artifact. Codebase is remarkably clean of debt markers.

---

## 5. Tooling inventory

| Tool                       | Present?                                | Notes                                                                                             |
| -------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Package manager            | npm (`package-lock.json` in both apps)  | PRD wants pnpm                                                                                    |
| Workspaces / monorepo      | ❌ None                                 | PRD wants pnpm + Turborepo                                                                        |
| TypeScript `strict`        | ✅ both apps                            | Missing `noUncheckedIndexedAccess`, `noImplicitOverride`, `exactOptionalPropertyTypes`            |
| ESLint                     | ✅ frontend only (`eslint-config-next`) | ❌ backend has no ESLint config                                                                   |
| Prettier                   | ❌                                      | No config anywhere                                                                                |
| Commitlint                 | ❌                                      |                                                                                                   |
| Husky                      | ❌                                      |                                                                                                   |
| lint-staged                | ❌                                      |                                                                                                   |
| Vitest / Jest              | ❌                                      | Backend uses bare `node --test`                                                                   |
| Playwright                 | ❌                                      |                                                                                                   |
| `gitleaks` / `trufflehog`  | ❌                                      |                                                                                                   |
| CI (GH Actions)            | ❌ No `.github/`                        |                                                                                                   |
| `eslint-plugin-security`   | ❌                                      |                                                                                                   |
| `eslint-plugin-no-secrets` | ❌                                      |                                                                                                   |
| `.env.example`             | ✅ backend + frontend                   | Backend `.env.example` is thin (missing S3*\*, DAILY*\*, others referenced in code) — needs audit |

---

## 6. Open design questions that block Phase 1 (need your decision)

These are **security / data-model** questions where I will not guess, per the working protocol.

### Q1. What is a `Tenant` in MedoFlow?

The PRD says "Tenant" but the existing schema uses `Clinic` as the isolation boundary. Three plausible meanings:

- **(A) Tenant = Clinic** — rename `Clinic` → `Tenant`, keep `Location` as the only below-tenant entity. Simplest.
- **(B) Tenant = Customer account; one Tenant → many Clinics → many Locations** — adds a tier above Clinic. More flexible (multi-brand groups like DSOs / clinic chains), bigger migration.
- **(C) Tenant = Customer account; one Tenant → many Locations** (Clinic collapses into Tenant) — cleanest if no one actually uses multi-clinic-per-tenant today.

I need your pick before writing the migration in Phase 1.1. This decision propagates to every row in the DB.

### Q2. Monorepo — full restructure now, or incremental?

Phase 0 step 3 asks me to propose this:

- **Option α (big bang)**: Move `frontend/` → `apps/dashboard`, `backend/` → `apps/backend-api`, create empty stubs for `apps/storefront`, `apps/patient-portal`, `apps/worker`, extract `packages/db`, `packages/types`, `packages/ui`, etc. Adopt pnpm + Turborepo. **~1–2 days of churn, every import path changes, CI has to be rebuilt at the same time.**
- **Option β (incremental)**: Add root `package.json`, `pnpm-workspace.yaml`, `turbo.json` that treats existing `frontend/` and `backend/` as the first two workspaces without moving them. Extract `packages/*` over subsequent phases as we need shared code. **~2 hours, reversible, keeps all imports working.**

**My recommendation: β.** The big-bang restructure creates a 10k-line diff that no one can review, and it blocks every other PR. Incremental lets us extract packages _at the moment we need them_ (e.g., `packages/billing` appears in Phase 8, `packages/ai` in Phase 7). Same destination, much less risk.

### Q3. Renaming `SUPER_ADMIN` → `PLATFORM_ADMIN`

The PRD (Phase 1.1) says rename `SUPER_ADMIN` → `PLATFORM_ADMIN` in the Role enum. But the existing `SUPER_ADMIN` is **the owner of a single clinic**, not a platform-level super-admin. Under the PRD model, the platform-level role (MedoFlow employees who see all tenants) is different from the clinic owner.

Proposal: introduce `PLATFORM_ADMIN` as a **new** role for MedoFlow staff, rename existing `SUPER_ADMIN` → `TENANT_OWNER` (or keep `SUPER_ADMIN` but scope it clearly as per-tenant). Please confirm.

### Q4. Compliance scope for launch

Phase 1 touches PHI encryption, retention, audit. Which regimes are we gated on for the first paid tenant?

- HIPAA (US)
- DPDP (India)
- GDPR (EU)
- ISO 27001 / SOC 2 (sales asks)

Your answer drives: encryption key choice (KMS vs BYOK), data-residency model (regional Postgres), audit-log retention (HIPAA = 6y, DPDP = variable, GDPR = depends).

### Q5. Payment provider for launch

- Stripe only, or Stripe + Razorpay day-one?
- If both, which region is each tenant assigned to — inferred from address, or explicit?

### Q6. AI provider allowed-region matrix

For HIPAA tenants, only BAA-covered providers (OpenAI enterprise, Azure OpenAI, Anthropic w/ BAA, AWS Bedrock) are allowable. For DPDP/India, in-region hosting may be required. Do we want a per-tenant `aiProviderAllowlist`, or one global default?

---

## 7. Scope reality check for the 14 phases

Honest estimate (senior engineer pair, full-time):

| Phase                                                                     | Estimate                               |
| ------------------------------------------------------------------------- | -------------------------------------- |
| 0 Tooling + monorepo                                                      | 2–3 days                               |
| 1 Multi-tenancy + RLS                                                     | **2–3 weeks** (migration risk is high) |
| 2 Auth / audit / encryption / hardening                                   | 2–3 weeks                              |
| 3 Signup + custom domains (incl. ACME/CF-for-SaaS)                        | 1–2 weeks                              |
| 4 Storefront template + booking                                           | 3–4 weeks                              |
| 5 Onboarding + specialty packs                                            | 1–2 weeks                              |
| 6 Appointments hardening (incl. load test, property tests, Outlook sync)  | 2–3 weeks                              |
| 7 AI scribe overhaul (multi-provider, Temporal/Inngest, evidence linking) | 3–4 weeks                              |
| 8 Commerce + POS + consents                                               | 3–4 weeks                              |
| 9 Patient portal app                                                      | 2–3 weeks                              |
| 10 Messaging + WhatsApp                                                   | 1–2 weeks                              |
| 11 Analytics                                                              | 1–2 weeks                              |
| 12 Observability + flags + status + runbooks                              | 1–2 weeks                              |
| 13 CI/CD                                                                  | 1 week                                 |
| 14 Docs                                                                   | 1 week                                 |

**Total: ~4–6 months of paired senior engineering.** Cannot be done in a single session. Breaking it into PR-sized deliverables each gated on your review is the only sane path.

---

## 8. Recommended next step

1. You answer **Q1–Q6** above.
2. I pick up Phase 0 again, execute **Option β** (incremental monorepo), and land tooling (Prettier, Husky, lint-staged, Commitlint, Vitest for backend, Playwright scaffold, eslint backend config, root tsconfig paths, `.env.example` audit).
3. That lands as one PR, `chore: repository audit and tooling setup`.
4. Then we start Phase 1.1 with a written migration plan you review before any SQL gets generated.

No code has been changed yet. Awaiting your decisions.
