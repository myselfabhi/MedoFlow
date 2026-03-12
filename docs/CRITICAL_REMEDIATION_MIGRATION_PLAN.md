## Critical Remediation Migration Plan

Date: 2026-03-12

### Scope

This plan covers only the schema changes introduced by the critical remediation pass for Modules 1-3:

1. consultation join token expiry support
2. explicit payment-intent persistence for idempotent reuse

### 1. Pending Schema Changes

Confirmed by [backend/prisma/schema.prisma](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/prisma/schema.prisma):

- `Payment`
  - add `stripePaymentIntentId String? @unique`
  - add `stripeClientSecret String?`
- `ConsultationSession`
  - add `joinTokenExpiresAt DateTime`
  - remove schema-level default generation from `joinToken`

### 2. Migration Classification

- `Payment.stripePaymentIntentId`
  - additive
  - low risk structurally
  - requires a unique index
- `Payment.stripeClientSecret`
  - additive
  - low risk structurally
- `ConsultationSession.joinTokenExpiresAt`
  - additive but non-null
  - medium risk because existing rows need a backfill before `NOT NULL` can be enforced
- `ConsultationSession.joinToken` default removal
  - non-destructive schema behavior change
  - no data rewrite required
  - runtime now generates the token in service code

### 3. Can Prisma Generate This Cleanly Here?

Not safely in this workspace.

Reasons:

- The repository currently has no `backend/prisma/migrations/` history directory.
- `docs/MIGRATION.md` assumes `prisma migrate`, but there is no existing migration chain to extend.
- A live-db diff attempt could not be completed here because Prisma could not reach the configured database:
  - `P1001: Can't reach database server at localhost:5432`

Because of those constraints, generating a deployment-ready migration automatically in this environment is not reliable. It risks creating an incorrect baseline migration for the entire schema rather than the narrow remediation delta.

### 4. Required Migration Shape

The safe rollout artifact is a targeted SQL migration that does only the following:

1. add nullable payment intent fields
2. add the unique index for `stripePaymentIntentId`
3. add `joinTokenExpiresAt` as nullable first
4. backfill `joinTokenExpiresAt` for existing rows
5. enforce `NOT NULL` on `joinTokenExpiresAt`

### 5. Backfill Strategy for Existing Consultation Sessions

Existing `ConsultationSession` rows may already exist in production. The backfill must avoid breaking active sessions while still closing the token-expiry gap.

Planned backfill:

- if a session is already ended or declined, set `joinTokenExpiresAt = NOW()`
- otherwise set `joinTokenExpiresAt = NOW() + INTERVAL '24 hours'`

This is a compromise:

- it avoids immediately breaking any active in-flight join links during rollout
- it still invalidates clearly completed sessions
- newly created or rotated tokens will use the service-layer expiry policy going forward

### 6. Manual SQL Need

Yes. Manual SQL is required for this pass.

Why:

- no migration history exists to anchor `prisma migrate`
- the configured database is unavailable from this environment
- the `joinTokenExpiresAt` backfill needs deliberate control

### 7. Data Risks / Rollout Risks

- If duplicate non-null `stripePaymentIntentId` values already exist in `Payment`, the unique index creation will fail.
  - expected risk is low because the field is new
- If an external environment already added one of these columns manually, the SQL will need reconciliation before apply
- Existing active consultation sessions will receive a temporary 24-hour expiry from migration time, not original creation time

### 8. Safe Rollout Order

1. apply the manual SQL migration in staging
2. run `npx prisma generate`
3. deploy backend/frontend code already using the new fields
4. execute the critical smoke tests
5. then promote to production

### 9. Validation Targets After Migration

- `Payment` has both new columns
- unique index exists on `stripePaymentIntentId`
- `ConsultationSession.joinTokenExpiresAt` exists and is non-null
- old tokens fail once expired
- explicit payment intent endpoint reuses the same intent/payment row
- appointment detail reads no longer create intents
