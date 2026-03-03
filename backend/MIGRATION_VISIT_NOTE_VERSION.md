# Migration: VisitNoteVersion and VisitRecord versioning

## Summary

- Adds `VisitNoteVersion` model for immutable SOAP note history.
- Adds `VisitRecord.currentVersionId` and `VisitRecord.isFinalized`.
- Backfills one version per existing `VisitRecord` and sets `currentVersionId`.
- Sets `isFinalized = true` where `status = 'FINAL'`.

## Steps

1. **Apply migration**

   ```bash
   cd backend
   npx prisma migrate deploy
   ```

   If using custom SQL instead:

   ```bash
   psql $DATABASE_URL -f prisma/migrations/20260303120000_add_visit_note_version/migration.sql
   ```

2. **Regenerate Prisma client**

   ```bash
   npx prisma generate
   ```

## Backfill notes

- `createdById` for backfilled versions uses the provider’s `userId`, or the visit’s `patientId` if the provider has no linked user.
- PostgreSQL 13+ is required for `gen_random_uuid()`. On older PostgreSQL, enable `uuid-ossp` and replace `gen_random_uuid()::text` with `uuid_generate_v4()::text` in the migration SQL.

## After migration

- Create visit: creates `VisitRecord` and first `VisitNoteVersion`, sets `currentVersionId`.
- Update visit: creates new `VisitNoteVersion`, updates `currentVersionId` and SOAP fields; blocked if `isFinalized` is true.
- Finalize: sets `isFinalized = true` and logs `VISIT_FINALIZED`.
- GET visit: returns current version fields; use `?includeHistory=true` for version list.
