# MedoFlow Deployment Guide

Deploy MedoFlow with **Vercel** (frontend) and **Render** (backend).

## Architecture

- **Frontend**: Next.js 14 → Vercel
- **Backend**: Express + Prisma → Render
- **Database**: PostgreSQL (Render addon or external)

---

## 1. Deploy Backend to Render

### 1.1 Create a PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com)
2. **New** → **PostgreSQL**
3. Name it `medoflow-db` (or similar)
4. Choose a region close to your users
5. Create. Copy the **Internal Database URL** (use this for Render services)

### 1.2 Create Web Service

1. **New** → **Web Service**
2. Connect your GitHub/GitLab repo
3. Configure:
   - **Name**: `medoflow-backend`
   - **Region**: Same as database
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`
   - **Release Command**: `npx prisma migrate deploy`

### 1.3 Environment Variables (Render Dashboard → Environment)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Internal Database URL from your PostgreSQL instance |
| `JWT_SECRET` | Yes | Strong random string, e.g. `openssl rand -base64 32` |
| `NODE_ENV` | Yes | `production` |
| `CORS_ORIGIN` | Yes* | Your Vercel frontend URL, e.g. `https://medoflow.vercel.app` |
| `STRIPE_SECRET` | No | If using Stripe payments |
| `FILE_SIZE_LIMIT_MB` | No | Default `10` |

\* Required for cross-origin auth (cookies). Use your exact Vercel URL.

### 1.4 Deploy

Click **Create Web Service**. Render will build and deploy. Note the service URL (e.g. `https://medoflow-backend.onrender.com`).

---

## 2. Deploy Frontend to Vercel

### 2.1 Create Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. **Add New** → **Project**
3. Import your MedoFlow repository
4. Configure:
   - **Root Directory**: `frontend` (important!)
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build` (default)

### 2.2 Environment Variables (Vercel → Settings → Environment Variables)

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | Your Render backend URL, e.g. `https://medoflow-backend.onrender.com` |

### 2.3 Deploy

Click **Deploy**. Vercel will build and deploy. Note your frontend URL (e.g. `https://medoflow.vercel.app`).

---

## 3. Connect Frontend and Backend

1. In **Render** → your backend service → **Environment**:
   - Add/update `CORS_ORIGIN` = your Vercel URL (e.g. `https://medoflow.vercel.app`)
   - For multiple origins: `https://app1.vercel.app,https://app2.vercel.app`

2. Redeploy the backend so the new env var is picked up.

---

## 4. Post-Deploy Checklist

- [ ] Backend health: `https://your-backend.onrender.com/api/v1/health` (if you have a health route)
- [ ] Frontend loads and can reach the API
- [ ] Login works (cookies require `CORS_ORIGIN` and HTTPS)
- [ ] Database migrations ran (check Render logs for `prisma migrate deploy`)

---

## 5. Important Notes

### File Uploads (Patient Files)

The backend stores files on local disk (`uploads/`). On Render, the filesystem is **ephemeral**—files are lost on redeploy. For production:

- Consider [Render Disk](https://render.com/docs/disks) for persistent storage, or
- Migrate to cloud storage (e.g. AWS S3, Cloudflare R2)

### Render Free Tier

- Services spin down after ~15 minutes of inactivity
- First request after spin-down can take 30–60 seconds
- Upgrade to a paid plan for always-on instances

### Custom Domains

- **Vercel**: Add custom domain in Project Settings → Domains
- **Render**: Add custom domain in Service Settings → Custom Domains
- Update `NEXT_PUBLIC_API_URL` and `CORS_ORIGIN` accordingly

---

## 6. Using Blueprint (Optional)

A `render.yaml` is included for [Render Blueprint](https://render.com/docs/blueprint-spec) deployment:

1. **New** → **Blueprint**
2. Connect repo and select `render.yaml`
3. Add a PostgreSQL database and link `DATABASE_URL`
4. Set environment variables in the dashboard
5. Deploy

---

## Quick Reference

| Service | URL Example |
|---------|-------------|
| Frontend | `https://medoflow.vercel.app` |
| Backend | `https://medoflow-backend.onrender.com` |
| Database | (Internal to Render) |
