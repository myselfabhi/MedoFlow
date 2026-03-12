# Medoflow Demo Build Summary

Date: 2026-03-13

---

## 1. What Was Built

Medoflow is a clinic management platform built across five modules. All five modules are implemented and demo-ready.

### Module 1 — Clinic Infrastructure
- Clinic + location data model (multi-location-ready)
- Staff management: SUPER_ADMIN provisions PROVIDER and FRONT_DESK accounts
- Discipline and service catalog with provider-level price overrides
- Provider availability management (weekly schedule + time-off)
- Role-based access control: SUPER_ADMIN, PROVIDER, FRONT_DESK, PATIENT
- Audit logging for key clinical and financial events

### Module 2 — Appointment Scheduling
- Service-first public booking flow with provider selection and slot availability
- Stripe-powered prepayment gate with slot hold + release lifecycle
- Cancellation and reschedule with policy enforcement
- Recurring appointments (weekly series)
- Waitlist with offer/claim/expiry lifecycle
- Provider calendar (week view), appointment detail page

### Module 3 — Patient Records + AI Scribe
- SOAP visit records with immutable version history
- AI Scribe: async audio → transcript → draft SOAP note (BullMQ + OpenAI)
- Provider reviews and approves draft; publishes a patient-friendly summary
- Patient sees only the published summary — not the SOAP note or transcript
- Treatment plans, intake forms (templates + patient responses)
- Patient file uploads (list, download, delete)
- Google Meet consultation link generation (requires provider Google Calendar auth)
- PHI boundary enforcement: `sanitizeVisitRecordForPatient` tested

### Module 4 — Billing + Commerce + Commissions
- Product catalog with inventory tracking
- Package catalog (session bundles) with purchase + consumption lifecycle
- Membership subscriptions via Stripe (Wellness Member, Premium Care)
  - Membership discount applies automatically at booking
  - Patient entitlements visible on appointment detail (provider view)
- Full invoice engine: line items (services, products, packages), draft → finalize → paid
- Payment flows: Stripe payment intent (online), manual recording (cash, card-manual, insurance)
- Refunds: full and partial (service-only invoices; product/package invoices block partial refund)
- Commission rules per provider → automatic ledger entry on invoice payment
- Front-desk Billing Operations: finance summary, outstanding AR, collect payments
- Front-desk Checkout (POS): walk-in sales — any mix of services, products, packages

### Module 5 — Analytics + BI
- Admin analytics dashboard: Total Revenue, Net Collected, Outstanding AR, Cancellation Rate
- Provider Utilization section (by availability vs. booked time)
- Top Services by revenue and appointment volume
- Provider-level analytics (SUPER_ADMIN can view any provider; PROVIDER locked to own scope)
- CSV export on all analytics views
- Scope enforcement tested: PROVIDER role always scoped to own providerId regardless of query param

---

## 2. Hardening Passes Completed

### Critical Remediation (pre-Phase 1)
- Refund flow implemented (was completely missing)
- Commission engine implemented (was completely missing)
- Package/membership entitlement enforcement implemented
- Patient access isolation enforced across visit records and clinical data
- Role-based authorization audited and enforced across routes

### Release Hardening
- Webhook idempotency (cart + appointment payment flows)
- Stripe webhook signature verification enforced
- Patient package session refund-after-use block
- Invoice financial state consistency (`syncInvoiceStatusFromPayments`)
- PARTIALLY_REFUNDED payment status added to Prisma schema

### Phase 1 Launch Hardening (2026-03-12)
- `charge.refunded` webhook fixed: now syncs invoice and appointment state when refunds issued via Stripe dashboard
- Appointment webhook idempotency tightened: single-condition check instead of fragile triple-condition
- `STRIPE_WEBHOOK_SECRET` absence now produces startup warning (was silent)
- `GET /patients/packages` unauthorized access fixed (added `authorize(Role.PATIENT)`)
- Commission + membership routes: added `requireClinic` middleware, replaced string literals with `Role` enum
- Front-desk POS label fixed: "Card (manual/offline)" → "Card (manually recorded — no terminal)"
- 13 new backend tests (95 total, all passing)

### Client Demo Hardening (2026-03-13)
- Invoices page CARD_PRESENT label fixed (was missed in launch pass)
- Packages and memberships pages: removed developer jargon from tooltips and body copy
- Memberships page: "Incomplete" stat card → "Pending Activation" (removes Stripe internal state name)
- Commissions page description: clarified that marking paid does not initiate a bank transfer
- Sidebar: "Point of Sale" → "Checkout" (avoids implying hardware terminal)
- Demo data plan, demo script, pre-demo checklist, and output report created

---

## 3. Current Test Status

- **Backend tests**: 95 passing, 0 failing
- **TypeScript build**: clean
- **Test runner**: Node.js built-in (`node:test`)
- **Test file**: `backend/src/tests/phase1LaunchHardening.test.ts` (most recent — 13 tests)

Coverage: webhook idempotency, env validation, commission scope, analytics scope, invoice financial state, patient access, refund flow, entitlement enforcement.

No browser E2E tests exist. Critical flows are covered by manual smoke tests.

---

## 4. Demo Test Data

### Clinic
- **Name**: Harmony Wellness Clinic
- **Location**: Main Clinic — 100 Health Street, Suite 4

### Demo Accounts
| Role | Name | Email | Password |
|------|------|-------|----------|
| SUPER_ADMIN | Alex Admin | alex@harmony.demo | Demo1234! |
| PROVIDER | Dr. Sarah Chen | sarah@harmony.demo | Demo1234! |
| PROVIDER | Dr. Marcus Rivera | marcus@harmony.demo | Demo1234! |
| FRONT_DESK | Jordan Front | jordan@harmony.demo | Demo1234! |
| PATIENT | Emma Patient | emma@harmony.demo | Demo1234! |
| PATIENT | Liam Patient | liam@harmony.demo | Demo1234! |

### Services
| Name | Duration | Price |
|------|----------|-------|
| Initial Physiotherapy Consultation | 60 min | $150 |
| Follow-up Physiotherapy Session | 30 min | $80 |
| Sports Massage | 45 min | $95 |
| Online Wellness Consult | 30 min | $65 |

### Products
| Name | Price |
|------|-------|
| Resistance Band Set | $35 |
| Foam Roller (Pro) | $28 |
| Hot/Cold Therapy Pack | $22 |

### Packages
| Name | Sessions | Price |
|------|---------|-------|
| 5-Session Physio Package | 5 | $650 |
| 10-Session Physio Package | 10 | $1,200 |

### Memberships
| Name | Price | Billing | Discount |
|------|-------|---------|---------|
| Wellness Member | $49 | Monthly | 15% |
| Premium Care | $89 | Monthly | 25% |

### Commission Rules
| Provider | Type | Value |
|----------|------|-------|
| Dr. Sarah Chen | Percentage | 30% |
| Dr. Marcus Rivera | Percentage | 25% |

### Pre-existing Appointments for Analytics
- Emma Patient + Dr. Sarah Chen: 5 completed with PAID invoices, 2 upcoming CONFIRMED, 1 CANCELLED
- Liam Patient + Dr. Marcus Rivera: 3 completed with PAID invoices, 1 upcoming CONFIRMED
- Front-desk standalone invoices: 1 PAID (Emma, cash), 1 OPEN (Liam — for live Collect demo)

### Patient State
- Emma Patient: Active "Wellness Member" subscription; 5-Session Physio Package with 3 sessions remaining
- All commission records in PENDING state (leave for admin Mark-as-Paid demo)
- AI Scribe draft in DRAFT_GENERATED state for one of Emma's upcoming appointments:
```json
{
  "subjective": "Patient reports mild lower back discomfort that began 3 weeks ago following increased activity. Pain is 4/10 at rest, 7/10 with prolonged sitting. No radiation down the legs.",
  "objective": "ROM: lumbar flexion 70°, extension 15°. Mild tenderness at L4-L5 bilateral paraspinals. SLR negative bilaterally. Posture: mild forward head position.",
  "assessment": "Mechanical lower back pain, likely secondary to postural dysfunction and overuse. No signs of neurological involvement.",
  "plan": "6 sessions of physiotherapy targeting core stabilization and postural correction. Home program: 3x daily hip flexor stretches, pelvic tilts. Reassess at session 3."
}
```

---

## 5. Demo Script (25–35 minutes)

### Opening Narrative (1 min)
> "Medoflow is an integrated clinic management platform. It handles scheduling, clinical documentation, billing, and analytics in one unified system. Let me walk you through the four key roles — admin, provider, front desk, and patient — so you can see how everything connects."

### Section 1 — Admin View (5–7 min)
**Account**: Alex Admin — `alex@harmony.demo`

**1.1 Analytics Dashboard**
1. Navigate to **Analytics**
2. Point out: Total Revenue, Net Collected, Outstanding AR, Cancellation Rate
3. Show Provider Utilization section
4. Show Top Services section
5. "This dashboard is built from live data — appointments, payments, memberships, packages. Nothing is estimated."

**1.2 Commissions**
1. Navigate to **Commissions** → Rules tab
2. Show Dr. Sarah Chen's rule: 30% on all invoice items
3. Switch to Ledger tab — show summary cards: Total, Pending, Paid
4. Point out disclaimer: "Marking records as paid updates payout tracking only — it doesn't initiate a bank transfer."

**1.3 Memberships Overview (30 sec)**
1. Navigate to **Memberships**
2. Show stat cards: Active, Past Due, Pending Activation, Cancel At Period End
3. Show membership catalog and Recent Subscription Activity

### Section 2 — Patient View (5–7 min)
**Account**: Emma Patient — `emma@harmony.demo`

**2.1 Appointments** — Show upcoming and past appointments with statuses

**2.2 Memberships** — Show active Wellness Member subscription, 15% discount, renewal date

**2.3 Booking Flow** (only if Stripe configured)
- Open public booking page → Follow-up Physiotherapy Session → Dr. Sarah Chen
- Show membership discount applied at booking
- Stripe test card: `4242 4242 4242 4242`

If Stripe not configured:
> "The patient selects their service, time, and provider from the public booking page. Once they complete payment through Stripe, the appointment is confirmed instantly. I'll skip the live payment step today, but the full flow is functional."

### Section 3 — Provider View (7–8 min)
**Account**: Dr. Sarah Chen — `sarah@harmony.demo`

**3.1 Calendar** — Show week view, click Emma Patient's appointment

**3.2 Appointment Detail**
- Walk through service, date/time, status
- Point out **Patient Entitlements** card: "The provider sees Emma's membership discount and remaining package sessions before the appointment — no need to ask the patient."
- Show Invoice section (draft invoice with line items)
- Show Visit Record section

**3.3 AI Scribe Demo**
1. Show the pre-loaded SOAP draft (Subjective, Objective, Assessment, Plan)
2. "This draft was generated from a session recording. The provider reviews and can edit any section."
3. Click **Approve Note** → "Note approved and finalized."
4. "Emma hasn't seen this yet — the SOAP note is internal."

**3.4 Publish Patient Summary**
1. Click **Publish Patient Summary**
2. Switch to Emma's account → her appointment
3. Show Emma sees only the published summary — not the SOAP note, not the transcript
> "The provider controls exactly what the patient sees. Internal clinical detail stays internal."

### Section 4 — Front-Desk View (5–7 min)
**Account**: Jordan Front — `jordan@harmony.demo`

**4.1 Billing Operations**
1. Navigate to **Invoices**
2. Show finance summary: Total Invoiced, Collected, Open Balances
3. Find Liam Patient's outstanding invoice → **Collect** → Cash → Record Payment
4. Show success toast and updated invoice status

**4.2 Checkout (walk-in sale)**
1. Navigate to **Checkout**
2. Select Liam Patient → add "Resistance Band Set" ($35) → Cash → Submit
3. "The front desk can handle any combination of services, products, and packages at checkout."

### Section 5 — Closing (2 min)
Switch back to Alex Admin:
1. Analytics — revenue numbers reflect the payments just recorded
2. Commissions → Ledger — new commission records generated

> "Every payment — whether from patient self-booking, front-desk checkout, or a walk-in sale — flows into one consistent ledger. Analytics, commissions, and billing all reflect the same ground truth."

---

## 6. Pre-Demo Checklist

### Infrastructure
- [ ] Backend running, no startup errors
- [ ] Frontend running
- [ ] Database running (PostgreSQL)

### Environment (Demo Minimum)
| Variable | Required |
|----------|---------|
| `DATABASE_URL` | Yes |
| `JWT_SECRET` | Yes |
| `CORS_ORIGIN` | Yes (if separate hosts) |
| `NEXT_PUBLIC_API_URL` | Yes |
| `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes if showing payment flows |

### Data
- [ ] All 6 demo accounts created and can log in
- [ ] Clinic, location, services, products, packages, memberships seeded
- [ ] Commission rules active for both providers
- [ ] 8+ completed appointments with paid invoices (analytics shows >$1,000 revenue)
- [ ] At least 1 outstanding invoice (for live Collect demo)
- [ ] Emma Patient: active Wellness Member subscription + 5-Session package with 3 remaining
- [ ] 5+ commission records in PENDING state
- [ ] AI Scribe draft in DRAFT_GENERATED state

### Browser Setup
- [ ] 4 browser windows/profiles open (admin, provider, front-desk, patient), each logged in
- [ ] Analytics page pre-loaded (avoids slow initial load)
- [ ] Calendar page pre-loaded for Dr. Sarah Chen

### Fallbacks
| Problem | Fallback |
|---------|---------|
| Stripe payment fails | Describe the flow; show the form; skip the actual payment |
| AI Scribe draft not loading | Show a screenshot; describe workflow verbally |
| Analytics data missing | "In a seeded environment you'd see your actual numbers" |
| Appointment missing | Navigate to patient record; show visit history there |
| Commission records empty | Manually pay one invoice before demo to trigger commission |

---

## 7. What NOT to Demo

| Feature | What to say if asked |
|---------|---------------------|
| Membership refund | "Membership refunds are handled directly in Stripe for safety" |
| Subscription upgrade/swap | "Plan changes are cancel-and-resubscribe today; proration is on the roadmap" |
| Card-present terminal | "Manual recording now; terminal integration is straightforward to add" |
| Email delivery | Describe the flow; don't execute live |
| Live AI Scribe recording | Use pre-generated draft (requires Redis + OpenAI in demo env) |

---

## 8. Architecture Reference

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express, TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Payments | Stripe (payment intents + subscriptions + webhooks) |
| AI Scribe queue | BullMQ + Redis |
| AI Scribe model | OpenAI (gpt-4o-mini default) |
| File storage | Local disk (demo) / S3-compatible (production) |
| Deployment | Vercel (frontend) + Render (backend + PostgreSQL) |
