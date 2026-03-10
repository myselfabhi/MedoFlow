# Module 2 Cleanup Plan (Phase 3)

## Part A — Plan

### 1. What We Are Changing

- **Provider-aware public availability**: Slots already carry `providerId` and `locationId`; ensure booking always uses the exact surfaced slot, never a fallback.
- **Location-aware scheduling**: Availability and booking carry `locationId` explicitly; single-location clinics default safely.
- **Timezone-aware scheduling**: Use `Location.timezone` as source of truth in slot generation and display.
- **Slot hold lifecycle**: Active holds block availability; hold creation validates live availability transactionally; expired holds do not block.
- **Double-booking protection**: Add PostgreSQL exclusion constraint for provider overlap + application-level transactional checks.
- **Reschedule flow**: Already slot-based; ensure it uses valid surfaced slots only.
- **Appointment states**: Enums already exist; ensure DRAFT, PENDING_PROVIDER_APPROVAL, PENDING_PAYMENT, CONFIRMED, etc. are enforced.
- **API contracts**: Machine-readable error codes, separate public vs staff DTOs, zod validation at boundaries.

### 2. Files/Modules Affected

**Backend:**
- `backend/src/services/schedulingCore.ts` — fix duplicate import, timezone handling
- `backend/src/services/availabilityService.ts` — location/timezone, active holds
- `backend/src/services/slotHoldService.ts` — hold lifecycle, validation
- `backend/src/services/appointmentService.ts` — double-booking, location, lifecycle
- `backend/src/controllers/publicController.ts` — error codes, validation
- `backend/src/controllers/appointmentController.ts` — error codes
- `backend/src/validation/module2Schemas.ts` — deduplicate, normalize
- `backend/prisma/schema.prisma` — optional tweaks
- `backend/prisma/migrations/` — new migration for exclusion constraint

**Frontend:**
- `frontend/app/(public)/book/[serviceId]/page.tsx` — confirm step provider display, "Any Available" clarity
- `frontend/components/calendar/RescheduleDialog.tsx` — already slot-based; minor polish
- `frontend/lib/appointmentApi.ts` — error code handling
- `frontend/lib/types/booking.ts` — slot type alignment

### 3. Schema Changes

- **Appointment**: Already has required fields. No structural changes.
- **SlotHold**: Already has `locationId`, `timezone`, `status`. No structural changes.
- **DB exclusion constraint** (optional, manual): Add PostgreSQL `EXCLUDE` constraint for provider overlap. See `docs/MODULE2_OPTIONAL_DB_CONSTRAINT.sql`. Migration history has ordering constraints; apply manually if desired. Application-level checks provide primary protection.

### 4. Module 1 Reuse

- `PatientClinicMembership`: Appointment creation upserts membership; continue using.
- `ProviderLocationAssignment`: Availability and booking validate provider at location; continue using.
- `Location.timezone`: Use as source of truth for slot generation.
- SUPER_ADMIN write access: Unchanged; Module 2 scheduling is PATIENT/PROVIDER/FRONT_DESK as before.

### 5. Concurrency-Sensitive Areas (Highest Risk)

1. **Slot hold creation** — Must validate slot is still available inside transaction; advisory lock on provider.
2. **Appointment creation** — Must check provider overlap, patient overlap, active holds; advisory locks on provider + patient.
3. **Hold conversion** — Must consume hold atomically with appointment creation.
4. **Reschedule** — Must exclude old appointment from overlap checks.

### 6. Concurrency Strategy

- **DB-level**: PostgreSQL `EXCLUDE` constraint for provider time overlap (active appointments). Plus advisory locks (`pg_advisory_xact_lock`) on provider and patient during booking.
- **Application-level**: Transactional overlap checks before insert; slot hold validation and consumption in same transaction.
