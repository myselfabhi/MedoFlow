# Google Meet AI Scribe Integration

## What this enables

- Connect provider account to Google Calendar
- Sync upcoming Google Meet events
- Map synced Meet events to provider appointments
- Start AI Scribe session directly from a synced meeting event

## Required environment variables

Set in backend environment:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_TOKEN_ENCRYPTION_KEY` (64-char hex)

Also ensure your OAuth app allows redirect URI:

- `http://localhost:3000/dashboard/provider/meetings` (local)

## API endpoints

Base: `/api/v1/integrations/google`

- `GET /auth-url?redirectUri=...`
- `POST /connect` body: `{ code, redirectUri }`
- `POST /sync` body: `{ redirectUri, days? }`
- `GET /events`
- `GET /status`
- `DELETE /disconnect`
- `GET /events/:eventId/appointments-candidates`
- `POST /events/:eventId/link-appointment` body: `{ appointmentId }`
- `POST /events/:eventId/start-scribe`

## Provider UI

Page:

- `/dashboard/provider/meetings`

Flow:

1. Click **Connect Google Calendar**
2. Complete Google OAuth
3. Click **Sync Upcoming Meetings**
4. Click **Start AI Scribe** on a meeting with a mapped appointment
5. If no mapping exists, use **Link Appointment** and then start scribe

## Appointment mapping logic

During sync, a Google event is matched to provider appointment if:

- same clinic and provider
- appointment start is within +/- 30 minutes of meeting start
- appointment status is not cancelled/rescheduled

If no mapping is found, meeting is synced but **Start AI Scribe** remains blocked.

## Security and reliability

- OAuth tokens are encrypted at rest using AES-256-GCM when `GOOGLE_TOKEN_ENCRYPTION_KEY` is configured.
- Access tokens are refreshed automatically during sync when near expiry.
- Providers can disconnect integration from `/dashboard/provider/meetings`.
