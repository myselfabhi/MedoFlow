# Booking Policy Migration

## Migration instructions

1. Run migration (development):

```bash
cd backend
npx prisma migrate dev --name add_booking_policy
```

2. For production:

```bash
npx prisma migrate deploy
```

3. Generate Prisma client (if not auto-run):

```bash
npx prisma generate
```

## Schema changes

- **Service**: Added `minimumNoticeMinutes Int? @default(0)`, `maxFutureBookingDays Int? @default(365)`

## Policy validations

- **Same patient overlap**: Rejects if patient has another non-cancelled appointment in the same time window
- **Minimum notice**: Rejects if `startTime - now < minimumNoticeMinutes`
- **Max future booking**: Rejects if `startTime > now + maxFutureBookingDays`

## Error messages

- "You already have another appointment during this time."
- "This service requires at least X hour(s) notice."
- "Appointments cannot be booked more than X days in advance."
