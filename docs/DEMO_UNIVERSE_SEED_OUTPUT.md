# Medoflow Demo Universe Seed Output

This document summarizes the seeded demo universe for Medoflow, created to provide a rich, connected, and believable clinic experience for demonstrations.

## 1. Seed Overview

- **Path**: `backend/prisma/seed_demo.ts`
- **Script**: `npm run seed:demo`
- **Clinic**: **Everwell Longevity Clinic**
- **Idempotency**: Secure (Catalog item upsert; historical data guarded by appointment count).

## 2. Seeded Entities

- **Clinic**: 1 (Everwell Longevity Clinic)
- **Locations**: 1 (Main Clinic — 1200 Wellness Drive)
- **Disciplines**: 4 (Physiotherapy, Sports Medicine, Nutrition & Wellness, Mental Performance)
- **Services**: 12 (Spread across all disciplines)
- **Users**: 21 (1 Admin, 1 Front Desk, 4 Providers, 15 Patients)
- **Providers**: 4 (Sarah Chen, Marcus Rivera, Priya Patel, James Wright)
- **Appointments**: 62 (44 Completed, 10 Confirmed, 5 Cancelled, 2 No-Show, 1 Hero Draft)
- **Invoices**: 48 (~45 from appointments, 3 standalone commerce)
- **Products**: 8 (Inventory items included)
- **Packages**: 3 (3-Session, 6-Session, 10-Session)
- **Memberships**: 2 (Monthly Wellness, Premium Longevity)
- **Commissions**: 4 Rules, 46 Records (mix of PENDING and PAID)
- **Prebuilt Carts**: 1 (Emma Hartwell — 2 items)
- **Storefront Orders**: 1 (Ryan Thompson — Mobility Roller Kit)

## 3. Demo Roles & Credentials

All accounts use the same password: **Demo1234!**

| Role | Email | Name |
|------|-------|------|
| **Admin** | `alex@everwell.demo` | Alex Thornton |
| **Front Desk** | `jordan@everwell.demo` | Jordan Walsh |
| **Provider** | `sarah@everwell.demo` | Dr. Sarah Chen |
| **Provider** | `marcus@everwell.demo` | Dr. Marcus Rivera |
| **Patient** | `emma@everwell.demo` | Emma Hartwell (Hero Patient) |

## 4. Hero Storylines

### A. The "Hero Patient" (Emma Hartwell)
- **Clinical History**: Has 3 completed appointments (Initial + 2 Follow-ups).
- **Clinical Records**: Has a finalized SOAP note with an approved AI scribe transcript and a published patient summary.
- **Entitlements**: Active Wellness Membership (15% discount) and an active 3-Session Recovery Package (1 used, 2 remaining).
- **Storefront Cart**: Has an **ACTIVE cart** pre-loaded with a Resistance Band Set and Daily Wellness Pack — ready to show the "Checkout" flow immediately.
- **Future**: Has an upcoming appointment (7 days out) with a **DRAFT AI scribe transcript** ready to be reviewed and approved during a live demo.

### B. Front-Desk Finance (Liam Nakamura)
- Has an **outstanding invoice** for a completed follow-up session.
- Perfect for demoing the "Collect Payment" flow at the front desk.

### C. Refund/Partial Refund Examples
- **Sophia Martinez**: Has a fully refunded appointment.
- **Marcus Chen**: Has a partially refunded appointment/invoice.

### D. Provider Analytics Contrast
- **Dr. Marcus Rivera**: High-volume, highest revenue.
- **Coach James Wright**: Lower utilization (~40%), providing a visible contrast in the analytics dashboard.

### E. Storefront Impact (Ryan Thompson)
- Has a **completed storefront-style order** (Mobility Roller Kit).
- Demonstrates product revenue in analytics and real-time inventory decrement (17 remaining from 18 initial).

## 5. How to Run

```bash
cd backend
npm run seed:demo
```

## 6. Verification Status

- [x] Seed script completes successfully.
- [x] Data appears consistently in database counts.
- [x] Idempotency confirmed (rerunning skips historical data creation).
- [x] Critical story threads (Hero patient, Outstanding AR, Prebuilt Cart) verified.
- [x] [Analytics Snapshot Checklist](file:///Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/docs/DEMO_ANALYTICS_SNAPSHOT_CHECKLIST.md) created.

## 7. Limitations
- AI Scribe audio files are NOT seeded (only the resulting transcripts/DRAFTs).
- Stripe-backed payments are simulated via manual recording (paymentChannel=MANUAL).
