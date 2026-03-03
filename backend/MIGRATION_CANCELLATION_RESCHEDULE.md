# Cancellation & Reschedule Migration Steps

## Applied Migrations

1. `20260303024948_add_cancellation_reschedule` – Service cancellation fields, Appointment cancelledAt, cancellationReason, rescheduledFromId
2. `20260303025000_add_rescheduled_to_id` – Appointment rescheduledToId

## Deploy

```bash
npx prisma migrate deploy
npx prisma generate
```
