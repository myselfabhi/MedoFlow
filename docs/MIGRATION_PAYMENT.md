# Payment & Slot Hold migration steps

1. Apply migration:
   ```bash
   npx prisma migrate deploy
   ```
   Or for dev:
   ```bash
   npx prisma migrate dev --name add_payment_and_slot_hold
   ```

2. Regenerate Prisma client:
   ```bash
   npx prisma generate
   ```

3. Run `releaseExpiredPendingPayments()` periodically (e.g. every 5 minutes) via a cron job or scheduler. Import from `services/paymentService`.
