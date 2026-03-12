# Medoflow

Integrated clinic management platform — scheduling, clinical documentation, billing, analytics, and patient self-serve in one unified system.

---

## 🚀 Quick Start for Demo

To get the demo environment running in less than 5 minutes:

1.  **Dependencies**: Run `npm install` in both `backend` and `frontend` directories.
2.  **Environment**: Copy `.env.example` to `.env` in `backend` and `.env.local` in `frontend`.
3.  **Database**: Ensure PostgreSQL is running, then run `npx prisma migrate deploy` in the `backend`.
4.  **Seed Demo Data**: Run `npm run seed:demo` in the `backend`.
5.  **Run**: Start both servers with `npm run dev`.

Detailed setup instructions and all operational commands are in the [**Operations Runbook**](docs/RUNBOOK.md).

---

## 🎬 Guided Live Demo Flow

The Medoflow demo universe is pre-seeded with one year of operational history for the **Everwell Longevity Clinic**. Use this 25-minute scripted flow for a high-impact presentation.

### 1. Admin Oversight — "The Big Picture"
- **Account**: `alex@everwell.demo` (Thornton)
- **Flow**:
  - Open **Analytics**. Show the 15% cancellation rate vs. $8k+ revenue.
  - Open **Commissions**. Show the ledger of pending payouts for Dr. Sarah Chen.
  - Open **Memberships**. Show active subscriptions driving predictable revenue.

### 2. Patient Experience — "The Hero Journey"
- **Account**: `emma@everwell.demo` (Hartwell)
- **Flow**:
  - Open **Patient Portal**. Show Emma’s active Wellness Membership and 3-session recovery package.
  - Open **Checkout/Storefront**. Find Emma's **pre-loaded cart** (Resistance Bands + Wellness Pack) ready for instant checkout.
  - Open **Appointments**. Show her historical visits and upcoming physiotherapy session.

### 3. Provider Workflow — "Clinical Excellence"
- **Account**: `sarah@everwell.demo` (Dr. Chen)
- **Flow**:
  - Open **Calendar**. Locate Emma Hartwell’s upcoming appointment (7 days out).
  - Open **AI Scribe**. Show the **DRAFT_GENERATED** SOAP note ready for review.
  - **Action**: Edit, approve, and **Publish Patient Summary**.

### 4. Front Desk — "Operational Efficiency"
- **Account**: `jordan@everwell.demo` (Walsh)
- **Flow**:
  - Open **Invoices**. Find **Liam Nakamura’s** outstanding invoice.
  - **Action**: Click "Collect" -> "Cash" to record payment.
  - Open **Checkout**. Demonstrate a walk-in sale for a "Mobility Roller Kit".

---

## 🔑 Demo Access

| Role | Email | Password | Best For |
| :--- | :--- | :--- | :--- |
| **Admin** | `alex@everwell.demo` | `Demo1234!` | Analytics & Commissions |
| **Provider** | `sarah@everwell.demo` | `Demo1234!` | AI Scribe & Clinical Progress |
| **Front Desk** | `jordan@everwell.demo` | `Demo1234!` | Billing & Point of Sale |
| **Patient** | `emma@everwell.demo` | `Demo1234!` | Portal & Storefront |

---

## 🗺️ Documentation Map

- [**Operations Runbook**](docs/RUNBOOK.md) — Exact commands, environment variables, and troubleshooting.
- [**Demo Universe Seed Output**](docs/DEMO_UNIVERSE_SEED_OUTPUT.md) — Detailed breakdown of every seeded user, invoice, and storyline.
- [**Analytics Checklist**](docs/DEMO_ANALYTICS_SNAPSHOT_CHECKLIST.md) — A 2-minute verification list to run before starting a live demo.
- [**Post-Onboarding Gap Plan**](docs/POST_ONBOARDING_GAP_PLAN.md) — The authoritative roadmap for production hardening and unsupported features.
- [**Demo Build Summary**](docs/DEMO_BUILD_SUMMARY.md) — Technical overview of what was built during the initial implementation.
