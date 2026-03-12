# Medoflow

Integrated clinic management platform — scheduling, clinical documentation, billing, analytics, and patient self-serve in one system.

---

## Running Locally for Demo

### Prerequisites

- Node.js 18+
- PostgreSQL (running locally or via Docker)

### Backend

```bash
cd backend
cp .env.example .env   # then fill in values below
npm install
npx prisma migrate deploy
npm run dev
```

**Minimum `.env` for demo:**

```
DATABASE_URL=postgresql://user:pass@localhost:5432/medoflow
JWT_SECRET=any-strong-string-here
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development

# Required only if showing payment flows:
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Required only if showing live AI Scribe (use pre-generated draft instead):
OPENAI_API_KEY=sk-...
REDIS_URL=redis://localhost:6379
```

### Frontend

```bash
cd frontend
cp .env.example .env.local   # or create it
# Set: NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev
```

App runs at `http://localhost:3000`. Backend at `http://localhost:4000`.

---

## Demo Accounts

Seed data per `docs/DEMO_BUILD_SUMMARY.md` → Section 4 (Test Data).

| Role | Name | Email | Password |
|------|------|-------|----------|
| SUPER_ADMIN | Alex Admin | alex@harmony.demo | Demo1234! |
| PROVIDER | Dr. Sarah Chen | sarah@harmony.demo | Demo1234! |
| PROVIDER | Dr. Marcus Rivera | marcus@harmony.demo | Demo1234! |
| FRONT_DESK | Jordan Front | jordan@harmony.demo | Demo1234! |
| PATIENT | Emma Patient | emma@harmony.demo | Demo1234! |
| PATIENT | Liam Patient | liam@harmony.demo | Demo1234! |

Stripe test card for payment flows: `4242 4242 4242 4242` (any future expiry, any CVV)

---

## Demo Flows

The guided demo covers four roles in ~30 minutes:

1. **Admin** — Analytics dashboard, commission rules + ledger, memberships overview
2. **Patient** — Appointments, active membership, self-serve booking (Stripe)
3. **Provider** — Calendar, appointment detail + patient entitlements, AI Scribe approve + publish
4. **Front-desk** — Billing operations + collect, walk-in checkout

Full script: `docs/DEMO_BUILD_SUMMARY.md` → Demo Script section
Pre-demo checklist: `docs/DEMO_BUILD_SUMMARY.md` → Demo Checklist section

---

## Deployment (Vercel + Render)

- **Frontend**: Vercel. Root directory: `frontend`. Set `NEXT_PUBLIC_API_URL` to your backend URL.
- **Backend**: Render Web Service. Root directory: `backend`. Start command: `npx prisma migrate deploy && npm start`.
- **Database**: Render PostgreSQL addon.

Set `CORS_ORIGIN` on the backend to your Vercel frontend URL after deploy.

Local file uploads are ephemeral on Render — use S3-compatible storage for production audio/file persistence.

---

## Tests

```bash
cd backend
npm test
```

95 tests passing. TypeScript build is clean.

---

## Known Limitations Before Production

See `docs/POST_ONBOARDING_GAP_PLAN.md` for the complete list of unsupported features, production requirements, and the post-onboarding roadmap.
