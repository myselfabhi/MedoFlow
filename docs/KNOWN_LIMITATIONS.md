# Known Limitations — Modules 1–3

## Module 1

- **Provider clinicId**: `setClinicFromUser` uses `req.user.clinicId`. Providers without `user.clinicId` may need clinic derived from provider record.
- **Single-clinic assumption**: Current design assumes one clinic per provider user.

## Module 2

- **Slot hold expiry**: Cron-based; not real-time. Expired holds may briefly remain in blocked intervals until next run.
- **Concurrency**: Optimistic locking on booking; rare race conditions possible under heavy load.

## Module 3

- **Transcript source**: Comes from AI Scribe audio upload. No Google Meet transcript API sync yet.
- **Create-on-approval**: Virtual consultation approval does not auto-create Google Calendar event; provider uses Meetings page to sync/link.
- **Local file storage**: Ephemeral on Render; use S3 for production persistence.
- **Schema migration**: If Prisma migrate fails, run `docs/MODULE3_SCHEMA.sql` manually.

## General

- **E2E tests**: No browser E2E coverage; rely on unit/integration tests.
- **Audit scope**: Not all actions are audited; expand as needed for compliance.
- **PHI in logs**: Avoid logging full transcript, tokens, or PHI-rich payloads.
