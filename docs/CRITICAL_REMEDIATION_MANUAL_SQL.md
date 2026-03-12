## Critical Remediation Manual SQL Application

Date: 2026-03-12

### Why This Is Manual

This repository does not currently contain a usable Prisma migration history, and the configured database was not reachable from this workspace for safe `prisma migrate` generation.

The remediation migration is therefore provided as a targeted SQL artifact:

- [migration.sql](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/prisma/migrations/20260312_critical_remediation_fields/migration.sql)

### Apply Order

1. Back up the target database.
2. Apply the SQL in staging first.
3. Verify schema changes and smoke tests.
4. Apply the same SQL in production.
5. Run `npx prisma generate` from [backend](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend).
6. Deploy the already-remediated application code.

### Example Apply Command

PostgreSQL example:

```bash
cd backend
set -a
source .env
set +a
# Strip ?schema=public (Prisma-specific) for psql compatibility
DB_URL="${DATABASE_URL%%\?*}"
psql "$DB_URL" -v ON_ERROR_STOP=1 -f prisma/migrations/20260312_critical_remediation_fields/migration.sql
```

### What The SQL Does

- adds `Payment.stripePaymentIntentId`
- adds `Payment.stripeClientSecret`
- creates a unique index on `Payment.stripePaymentIntentId`
- adds `ConsultationSession.joinTokenExpiresAt`
- backfills existing consultation rows (ENDED/FAILED sessions → NOW(), others → NOW() + 24h)
- enforces `NOT NULL` on `ConsultationSession.joinTokenExpiresAt`

### Rollback Considerations

Rollback should be treated as a controlled database operation, not an automatic blind revert.

If rollback is required before application code is deployed:

- drop the unique index
- drop `joinTokenExpiresAt`
- drop `stripePaymentIntentId`
- drop `stripeClientSecret`

If rollback is required after application code is deployed:

- first revert the application deployment
- then remove the schema changes only after confirming no live code paths still depend on them

### Pre-Apply Checks

- confirm no existing manual schema drift already added these columns
- confirm the database user can create indexes
- confirm no live migration runner will try to baseline the entire schema unexpectedly
