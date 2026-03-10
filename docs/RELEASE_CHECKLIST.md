# Release Checklist — Modules 1–3

Use this checklist before deploying to production.

## 1. Database

- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] If Prisma migrate fails (shadow DB ordering), run `docs/MODULE3_SCHEMA.sql` manually:
  ```sql
  ALTER TABLE "Clinic" ADD COLUMN IF NOT EXISTS "aiEnabled" BOOLEAN NOT NULL DEFAULT true;
  ALTER TABLE "AIScribeSession" ADD COLUMN IF NOT EXISTS "patientSummaryPublished" BOOLEAN NOT NULL DEFAULT false;
  ```
- [ ] Verify `DATABASE_URL` is set and correct

## 2. Environment Variables (Backend)

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Strong random string (e.g. `openssl rand -base64 32`) |
| `CORS_ORIGIN` | Yes (prod) | Frontend URL(s), comma-separated |
| `NODE_ENV` | Yes | `production` |
| `OPENAI_API_KEY` | Yes* | For AI Scribe |
| `OPENAI_MODEL` | No | Default `gpt-4o-mini` |
| `REDIS_URL` or `REDIS_HOST` | Yes* | For AI Scribe queue |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | No | If using S3 for audio; else local disk |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | No | For Google Calendar/Meet |
| `GOOGLE_TOKEN_ENCRYPTION_KEY` | No | 64-char hex for token encryption |

\* AI Scribe: Without Redis, queue jobs won't run. Without OpenAI, transcription fails.

## 3. Environment Variables (Frontend)

| Variable | Required |
|----------|----------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL |

## 4. Google Integration (Optional)

- [ ] Create OAuth credentials in Google Cloud Console
- [ ] Add authorized redirect URI: `{frontend}/dashboard/provider/meetings`
- [ ] Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` in backend
- [ ] Providers connect via Meetings page; state validation is enforced

## 5. Storage

- [ ] **Local**: `uploads/ai-scribe` writable; ephemeral on Render
- [ ] **S3**: Set `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET` for production persistence

## 6. Queue / Worker

- [ ] Redis running and `REDIS_URL` or `REDIS_HOST` set
- [ ] Worker starts with API process (same Render service) or separate worker process
- [ ] Without Redis, AI Scribe upload returns 503 on enqueue failure

## 7. AI Enablement

- [ ] `Clinic.aiEnabled` defaults to true; set false per clinic to disable AI Scribe
- [ ] AI-disabled clinics get 403 when starting a session

## 8. Manual Smoke Tests

- [ ] Public registration creates PATIENT only
- [ ] Login works (cookies + CORS)
- [ ] Patient books appointment (Any Available or specific provider)
- [ ] Provider sees appointment, can approve if required
- [ ] Provider creates visit, starts AI Scribe, uploads audio (or records)
- [ ] Provider approves note, publishes summary to patient
- [ ] Patient sees only published summary, not draft SOAP
- [ ] File upload/download works for patient and provider

## 9. Security

- [ ] CORS_ORIGIN set (production fails closed if missing)
- [ ] No privileged roles via public registration
- [ ] Staff provisioning is SUPER_ADMIN only
