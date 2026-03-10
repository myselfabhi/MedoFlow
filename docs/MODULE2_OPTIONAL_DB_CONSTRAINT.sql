-- Optional: PostgreSQL exclusion constraint for provider double-booking protection
-- Run manually if desired. Application-level checks provide primary protection.
-- Requires: btree_gist extension

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Appointment"
ADD CONSTRAINT "Appointment_provider_no_overlap"
EXCLUDE USING gist (
  "providerId" WITH =,
  tsrange("startTime", "endTime") WITH &&
) WHERE (status NOT IN ('CANCELLED', 'RESCHEDULED'));
