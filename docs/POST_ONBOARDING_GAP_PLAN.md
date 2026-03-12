# Post-Onboarding Gap Plan

Date: 2026-03-13

This document is the authoritative record of:
1. Features intentionally unsupported in the current build
2. Production requirements not met for demo-only deployment
3. Known backend/frontend implementation gaps
4. Roadmap candidates for post-onboarding work

---

## 1. Known Limitations (Intentionally Not Supported)

### Module 1 — Clinic Infrastructure

**Single-clinic provider assumption**
- Current design assigns one clinic per provider via `user.clinicId`. Multi-clinic provider support is not implemented.
- A provider working at multiple clinic entities requires separate user accounts.
- Roadmap: multi-clinic provider associations with per-clinic scheduling.

**Staff self-onboarding not available**
- PROVIDER and FRONT_DESK accounts must be created by a SUPER_ADMIN.
- There is no staff invitation flow or self-serve signup for staff roles.

**Location update/archive not implemented**
- Backend has `POST /locations` and `GET /locations` only. No `PUT` or `DELETE` for locations.
- To update a location, use the database directly or add the endpoint.

**Last-admin protection not enforced**
- No backend guardrail prevents a SUPER_ADMIN from demoting or deleting themselves if they are the last admin.

---

### Module 2 — Scheduling

**Slot hold expiry is cron-based, not real-time**
- Expired booking holds are cleaned by a scheduled job, not in real-time.
- A slot may briefly appear blocked until the next cron run.

**Optimistic booking concurrency**
- App-level overlap checks are present. Under high load, two concurrent booking requests for the same slot could race. No database-level row lock is used.

**Waitlist auto-conversion not implemented**
- When a cancellation opens a slot, the system creates a waitlist offer. If that offer expires, the system does NOT automatically cascade to the next person on the waitlist. Manual follow-up is required.

**Provider-first booking flow missing**
- The public booking page is service-first. No provider-first shortcut entry path exists.

**Recurring appointment lifecycle limited**
- Weekly recurring series creation exists. Managing (cancel/reschedule individual vs. all) has limited UI support.

---

### Module 3 — Patient Records / AI Scribe

**AI Scribe requires OpenAI and Redis**
- Without `OPENAI_API_KEY`: transcription and draft generation do not function.
- Without `REDIS_URL`: the BullMQ queue does not start; audio upload returns 503.
- For demo environments without these: use a pre-generated SOAP draft.

**Transcript source is audio upload only**
- No Google Meet transcript API sync. All transcripts come from provider-uploaded or in-browser recorded audio.

**Google Calendar auto-create on consultation approval not implemented**
- When a virtual consultation is approved, a Google Calendar event is NOT automatically created.
- The provider must manually sync or link the event from the Meetings page.

**Note version history not surfaced in frontend**
- Backend creates an immutable `VisitNoteVersion` on every note edit. The frontend does not expose a "Version History" modal — providers cannot see prior versions in the UI.

**Local file storage is ephemeral on cloud**
- Audio files for AI Scribe are stored on local disk by default.
- On Render (and similar PaaS), local files are lost on redeploy.
- Required for production: S3-compatible storage (`S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`).

---

### Module 4 — Billing / Commerce / Commissions

**Card-present / POS terminal not supported**
- No Stripe Terminal or hardware integration.
- Front-desk card payments are manually recorded ("Card (manually recorded — no terminal)") and do not trigger real authorization.
- Roadmap: Stripe Terminal integration.

**Membership refunds not supported in-app**
- Refunds on membership subscription payments must be processed directly in the Stripe dashboard.
- In-app refund attempt returns HTTP 400 with `membership_refund_unsupported`.

**No subscription proration or plan swap**
- Changing a patient's membership plan (upgrade/downgrade) is not supported.
- The patient must cancel the current subscription and re-subscribe to the new plan.
- Cancel-at-period-end is the only supported cancellation mode.
- Roadmap: proration + instant plan swap.

**Partial refunds blocked for product/package invoices**
- Partial refunds are supported for service-only invoices.
- Invoices containing products or packages cannot be partially refunded.

**Package refunds blocked after session use**
- Once any session from a purchased package has been consumed, the package invoice cannot be refunded.

**No multi-currency support**
- All amounts are in USD. Currency configuration is not available.

**Commission tracking only — no payroll integration**
- Commission records track what is owed. Marking records as "Paid" is a manual admin action and does not initiate any disbursement.
- No integration with payroll services (Gusto, ADP, etc.).
- Roadmap: payroll export (CSV at minimum); optional provider portal.

**No accounting system integration**
- No integration with QuickBooks, Xero, or other accounting platforms.
- Finance summaries are operational-only.

---

### Module 5 — Analytics

**Analytics are live queries, not pre-computed**
- All analytics queries run against the live database at request time.
- Performance may degrade at high data volumes. Consider materialized views or pre-aggregation at scale.

**No scheduled reports or export automation**
- CSV exports are manual and per-request. There is no scheduled delivery or automated export pipeline.

**Utilization rate uses availability windows, not billed minutes**
- Provider utilization is calculated from scheduled availability vs. booked appointment time.
- Actual billable minutes tracked in session are not used.

**No forward-looking analytics**
- No revenue forecasting or projected future metrics.

---

### General / Cross-Cutting

**No MFA**
- Authentication is email/password + JWT only. MFA is not implemented.
- Required before broad public rollout; low risk for closed pilot.

**No rate limiting**
- No per-IP or per-user rate limits on API endpoints.
- Add at infrastructure layer (nginx, Cloudflare) before public exposure.

**No E2E browser tests**
- Test suite covers unit and integration tests (95 passing).
- No browser-level (Playwright, Cypress) E2E tests exist.
- Critical flows covered by manual smoke tests.

**Audit log scope is not exhaustive**
- The audit log covers key financial and clinical events. Not all actions are audited.
- Expand as compliance requirements grow.

**No data retention policy enforcement**
- No programmatic data retention policies. Ensure hosting environment and provider satisfy applicable regulatory requirements.

**PHI in logs**
- Structured logging is implemented for AI Scribe. Do not enable verbose request body logging in production — this may capture PHI.

**SMTP required for patient-facing email**
- Without SMTP configuration, all transactional emails (appointment confirmations, invoice notifications) silently fail to send.

---

## 2. Production Requirements (Not Met for Demo-Only Deployment)

| Requirement | Status | Notes |
|-------------|--------|-------|
| `STRIPE_WEBHOOK_SECRET` set | **Required for production** | Without it, any party can spoof Stripe webhook events. Startup warns loudly if missing. |
| `SMTP_*` configured | **Required for production** | Patient email delivery (confirmations, invoices) |
| `REDIS_URL` configured | **Required for production** | AI Scribe queue; returns 503 without it |
| `OPENAI_API_KEY` set | **Required for production** | AI Scribe transcription + draft generation |
| S3-compatible storage | **Required for production** | Durable audio file storage (local disk is ephemeral on Render) |
| `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | **Required for production** | Google Calendar + Meet integration |
| Prisma migrations run on prod DB | **Required before deploy** | `npx prisma migrate deploy` |
| Strong `JWT_SECRET` (32+ chars) | **Required for production** | Use `openssl rand -base64 32` |
| Rate limiting (nginx/Cloudflare) | **Required before public rollout** | No per-endpoint rate limits in app code |
| MFA | **Required before public rollout** | Email/password only today |

---

## 3. Backend/Frontend Implementation Gaps

These are features where backend endpoints exist but no frontend UI is wired up.

### High Priority

**Provider management (edit, deactivate, service management)**
- `PUT /providers/:id` — edit provider name, email, disciplines
- `DELETE /providers/:id` — deactivate/delete provider
- `GET/POST/PUT/DELETE /providers/:id/services` — manage provider service assignments after creation

**Note**: These may be addressed already in newer frontend versions — verify against current UI before building.

### Medium Priority

**Form template CRUD**
- `POST/GET/PUT/DELETE /forms/templates` — create, edit, delete form templates in-app
- Frontend currently only responds to templates and fetches them for appointments

**Visit management**
- `GET /visits/:id` — direct visit fetch by ID
- `PUT /visits/:id` — edit visit directly
- `PUT /visits/:id/finalize` — manual finalization outside AI Scribe flow
- `GET /visits/clinic` — clinic-wide visit list

**Prescription creation**
- `POST /prescriptions` — create prescriptions
- `GET /prescriptions/provider` and `/clinic` — provider/clinic-level prescription lists

### Lower Priority

**Appointment timeline**: `GET /appointments/:id/timeline` — history/audit trail
**Treatment plan single-fetch**: `GET /treatment-plans/:id` — single plan by ID

---

## 4. PRD Features Not Fully Implemented (Partial/Missing Status)

| Item | Status | Notes |
|------|--------|-------|
| Provider-first booking path | Missing | Only service-first public booking exists |
| Provider-first shortcut | Missing | No shortcut to book by provider directly |
| Slot hold: frontend integration | Partial | Hold endpoints exist; frontend integration was incomplete as of audit |
| Recurring appointment lifecycle | Partial | Weekly creation only; limited management |
| Waitlist cascade | Partial | Offer/claim exists; next-in-line auto-cascade missing |
| Booking concurrency (DB-level lock) | Partial | App-level checks only |
| Note version history UI | Partial | Backend creates versions; no frontend UI to view them |
| Draft/final note legal boundary | Partial | Approval flow exists; stronger workflow controls would help |
| Multi-provider access boundaries | Partial | Role checks present; any PROVIDER in same clinic can view any patient's records — by design, but should be disclosed to clinic operators |
| File search/filtering | Partial | List and delete exist; limited filtering surface |
| Compliance controls (consent, retention) | Partial | Auth + audit present; explicit consent capture and retention enforcement incomplete |
| Audit log admin UI | Missing | Backend captures audit events; no SUPER_ADMIN UI to review them |
| Discipline archive | Partial | Service flag exists; not fully surfaced |
| Location update/archive | Missing | POST and GET only; no PUT or DELETE |
| Last-admin deletion protection | Missing | No guardrail preventing last SUPER_ADMIN deletion |
| Tax rule engine | Partial | Basic tax flag on services; no configurable rule engine |
| Cart/POS state sharing | Partial | Two separate flows (public cart + front-desk POS); no unified state |
| Role-based calendar for all roles | Partial | Provider calendar strong; front-desk and admin calendar limited |

---

## 5. Roadmap Candidates (Post-Onboarding)

These are items that came up during demo preparation and client Q&A. Prioritized roughly by client interest.

1. **Stripe Terminal integration** — card-present payments at front desk
2. **Subscription plan swap with proration** — upgrade/downgrade without cancel-and-resubscribe
3. **Waitlist auto-cascade** — automatically offer next slot to next person when first offer expires
4. **Payroll export** — export commission records as CSV or push to payroll provider
5. **Audit log admin UI** — SUPER_ADMIN page to view and filter audit events
6. **Note version history UI** — provider view of SOAP note edit history
7. **Prescription creation UI** — frontend for `POST /prescriptions`
8. **Form template management UI** — create/edit/delete form templates in-app
9. **Multi-clinic provider support** — providers who work at multiple clinic entities
10. **Scheduled analytics reports** — automated export delivery
11. **Native video** — WebRTC consultation room (currently Google Meet links only)
12. **Accounting integration** — QuickBooks/Xero export
13. **E2E browser tests** — Playwright or Cypress test suite for critical flows
14. **MFA** — TOTP or email-based second factor for all roles
15. **Rate limiting** — move from infrastructure-level recommendation to in-app enforcement
