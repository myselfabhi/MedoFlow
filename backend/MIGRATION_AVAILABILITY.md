# Provider Availability Migration

## Migration instructions

1. Run migration (development):

```bash
cd backend
npx prisma migrate dev --name add_provider_availability
```

2. For production:

```bash
npx prisma migrate deploy
```

3. Generate Prisma client (if not auto-run):

```bash
npx prisma generate
```

## Endpoints

- **GET** `/api/v1/providers/:id/availability?date=YYYY-MM-DD&serviceDuration=30` – Public, returns available slots
- **POST** `/api/v1/providers/:id/availability` – Create availability (CLINIC_ADMIN, SUPER_ADMIN)
- **PUT** `/api/v1/providers/:id/availability/:availabilityId` – Update availability (CLINIC_ADMIN, SUPER_ADMIN)
- **POST** `/api/v1/providers/:id/unavailability` – Create unavailability (CLINIC_ADMIN, SUPER_ADMIN)
