# Migrations

## Run migration

```bash
cd backend
npx prisma migrate dev --name <migration_name>
```

## Schema changes

### add_location_service_provider_service
- **Location**: id, clinicId, name, address (optional), timezone, isActive, timestamps
- **Service**: id, clinicId, disciplineId, name, duration, defaultPrice, taxApplicable, isActive, timestamps. Unique (clinicId, name). Indexes on clinicId, disciplineId
- **ProviderService**: id, providerId, serviceId, priceOverride (nullable), timestamps. Unique (providerId, serviceId)
- **Discipline**: Added isActive (default true) for archive support

### add_appointment_scheduling
- **AppointmentStatus** enum: DRAFT, PENDING_PAYMENT, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW, RESCHEDULED
- **Appointment**: id, clinicId, locationId, providerId, serviceId, patientId, startTime, endTime, status, priceAtBooking, timestamps
- **Role**: Added PATIENT

### add_visit_record_prescription
- **VisitRecordStatus** enum: DRAFT, FINAL
- **VisitRecord**: id, clinicId, appointmentId (unique), providerId, patientId, subjective, objective, assessment, plan, status, timestamps
- **Prescription**: id, clinicId, appointmentId, providerId, patientId, notes, timestamps
