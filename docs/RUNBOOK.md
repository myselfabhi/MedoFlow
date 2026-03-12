# Medoflow Operations Runbook

This document is the authoritative source for all operational commands required to install, run, and maintain the Medoflow platform.

## 📁 Repository Structure

- `frontend/` — Next.js 14 web application.
- `backend/` — Express.js REST API using Prisma ORM.
- `docs/` — Architecture, roadmap, and demo documentation.

---

## ⚙️ Initial Setup

### 1. Install Dependencies
Run in both directories:
```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && npm install
```

### 2. Environment Variables
- Create `frontend/.env.local` (see `frontend/.env.example`).
  - Key: `NEXT_PUBLIC_API_URL=http://localhost:4000`
- Create `backend/.env` (see `backend/.env.example`).
  - Key: `DATABASE_URL=postgresql://...`
  - Key: `JWT_SECRET=any-string`

---

## 🗄️ Database & Prisma

All commands should be run from the `backend/` directory.

### Initialize Database
```bash
# Generate Prisma Client
npx prisma generate

# Apply Migrations
npx prisma migrate deploy
```

### Seed Demo Data (Medoflow Universe)
This command seeds the "Everwell Longevity Clinic" with a year of clinical and financial history. It is idempotent and safe to rerun.
```bash
npm run seed:demo
```

---

## 🚀 Running the Project

### Development Mode
```bash
# In backend/
npm run dev

# In frontend/
npm run dev
```

### Production Build
```bash
# Backend
npm run build && npm start

# Frontend
npm run build && npm start
```

---

## 🧪 Testing & Verification

### Backend Tests
```bash
cd backend
npm test
```
*Note: Ensure the backend is built (`npm run build`) before running tests if the test script points to `dist/`.*

### Build Sanity Check
```bash
# Recommended before any demo
cd backend && npm run build
cd ../frontend && npm run build
```

---

## 🛠️ Troubleshooting

| Issue | Solution |
| :--- | :--- |
| **"Cannot find module... dist/server.js"** | Run `npm run build` in the backend. |
| **Prisma schema out of sync** | Run `npx prisma generate` then `npx prisma migrate dev`. |
| **Demo data missing metrics** | Ensure you ran `npm run seed:demo`, not the default `npx prisma db seed`. |
| **Stripe webhooks not firing** | Use `stripe listen --forward-to localhost:4000/api/webhooks`. |

---

## 🔐 Production Note
This runbook is intended for local development and demonstration. For production deployment requirements (MFA, Rate Limiting, durable S3 storage), refer strictly to the [**Post-Onboarding Gap Plan**](../docs/POST_ONBOARDING_GAP_PLAN.md).
