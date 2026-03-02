# Audit Log Migration

## Migration instructions

1. Run migration (development):

```bash
cd backend
npx prisma migrate dev --name add_audit_log
```

2. For production:

```bash
npx prisma migrate deploy
```

3. Generate Prisma client (if not auto-run):

```bash
npx prisma generate
```
