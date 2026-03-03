# Waitlist migration steps

1. Apply migration:
   ```bash
   npx prisma migrate deploy
   ```
   Or for dev:
   ```bash
   npx prisma migrate dev --name add_waitlist_entry
   ```

2. Regenerate Prisma client:
   ```bash
   npx prisma generate
   ```

3. Optional: run `expireWaitlistOffers()` periodically (e.g. every 5–10 minutes) via a cron job or scheduler. Import from `services/waitlistService`.
