# MedoFlow: Backend vs Frontend Implementation Audit

**Generated:** March 2025

This document lists backend API endpoints that exist but are **not yet implemented** in the frontend, organized by domain and priority.

---

## Summary

| Category | Backend Endpoints | Frontend Implemented | Gaps |
|----------|-------------------|----------------------|------|
| Auth | 6 | 6 | 0 |
| Public | 7 | 7 | 0 |
| Disciplines | 5 | 4 | 1 |
| Providers | 16 | 5 | 11 |
| Locations | 2 | 2 | 0 |
| Services | 4 | 4 | 0 |
| Appointments | 11 | 9 | 2 |
| Visits | 6 | 3 | 3 |
| Prescriptions | 4 | 2 | 2 |
| Waitlist | 3 | 3 | 0 |
| Payments | 2 | 2 | 0 |
| Treatment Plans | 6 | 5 | 1 |
| Files | 4 | 3 | 1 |
| Forms | 7 | 3 | 4 |
| Invoices | 9 | 9 | 0 |
| Analytics | 4 | 4 | 0 |
| AI Scribe | 9 | 9 | 0 |

---

## 1. Provider Management (High Priority)

Backend has full provider CRUD and provider–service management. Frontend only has list, create, and availability.

| Method | Path | Status |
|--------|------|--------|
| `PUT` | `/providers/:id` | ❌ No frontend |
| `DELETE` | `/providers/:id` | ❌ No frontend |
| `GET` | `/providers/:id/services` | ❌ No frontend |
| `POST` | `/providers/:id/services` | ❌ No frontend |
| `PUT` | `/providers/:id/services/:serviceId` | ❌ No frontend |
| `DELETE` | `/providers/:id/services/:serviceId` | ❌ No frontend |
| `POST` | `/providers/:id/availability/preview` | ❌ No frontend |
| `POST` | `/providers/:id/unavailability` | ❌ No frontend |

**Notes:**
- Add Provider dialog creates providers with services in one step; no UI to add/remove/update services after creation.
- No UI to edit provider (name, email, disciplines) or deactivate provider.
- No UI for provider unavailability (blocking time off).
- Availability preview could power a confirmation step before bulk changes.

---

## 2. File Upload (High Priority)

| Method | Path | Status |
|--------|------|--------|
| `POST` | `/files/upload` | ❌ No frontend |

**Notes:**
- `PatientFilesSection` lists, downloads, and deletes files but has no upload.
- Backend expects `multipart/form-data` with `file` and optional `patientId`, `visitRecordId`, `clinicId`, `tags`.

---

## 3. Form Templates (Medium Priority)

| Method | Path | Status |
|--------|------|--------|
| `POST` | `/forms/templates` | ❌ No frontend |
| `GET` | `/forms/templates` | ❌ No frontend |
| `PUT` | `/forms/templates/:id` | ❌ No frontend |
| `DELETE` | `/forms/templates/:id` | ❌ No frontend |

**Notes:**
- Frontend uses `GET /forms/templates/for-appointment/:appointmentId` and `POST /forms/respond`.
- No UI to create, list, edit, or delete form templates.

---

## 4. Visits (Medium Priority)

| Method | Path | Status |
|--------|------|--------|
| `GET` | `/visits/:id` | ❌ No frontend |
| `PUT` | `/visits/:id` | ❌ No frontend |
| `PUT` | `/visits/:id/finalize` | ❌ No frontend |
| `GET` | `/visits/clinic` | ❌ No frontend |

**Notes:**
- Visit creation and fetch by appointment/patient exist.
- No direct visit edit, finalize, or clinic-wide visit list.

---

## 5. Prescriptions (Medium Priority)

| Method | Path | Status |
|--------|------|--------|
| `POST` | `/prescriptions` | ❌ No frontend |
| `GET` | `/prescriptions/provider` | ❌ No frontend |
| `GET` | `/prescriptions/clinic` | ❌ No frontend |

**Notes:**
- Frontend uses `GET /prescriptions/my` and `GET /prescriptions/patient/:patientId`.
- No UI to create prescriptions or list by provider/clinic.

---

## 6. Appointments (Lower Priority)

| Method | Path | Status |
|--------|------|--------|
| `GET` | `/appointments/:id/timeline` | ❌ No frontend |
| `PUT` | `/appointments/:id/status` | ❌ No frontend |

**Notes:**
- Timeline may be for appointment history/audit.
- Status update may overlap with cancel/reschedule; confirm use case.

---

## 7. Treatment Plans (Lower Priority)

| Method | Path | Status |
|--------|------|--------|
| `GET` | `/treatment-plans/:id` | ❌ No frontend |

**Notes:**
- Frontend uses list and patient-specific list; single-plan fetch not used.

---

## 8. Disciplines (Lower Priority)

| Method | Path | Status |
|--------|------|--------|
| `GET` | `/disciplines/:id` | ❌ No frontend |

**Notes:**
- All flows use `GET /disciplines` (list); single discipline fetch not needed yet.

---

## 9. Backend-Only / Infrastructure

| Method | Path | Notes |
|--------|------|------|
| `GET` | `/health` | Used by monitoring/load balancers, not frontend |
| `GET` | `/providers/:id/availability` | Used by public availability; frontend uses `GET /public/availability` instead |

---

## 10. Backend Limitations (No Update/Delete)

These resources have no update/delete in the backend:

| Resource | Backend | Frontend |
|----------|---------|----------|
| Locations | POST, GET only | Matches backend |

---

## Recommended Implementation Order

1. ~~**File upload**~~ – ✅ Implemented in `PatientFilesSection`.
2. ~~**Provider services**~~ – ✅ Implemented in `ProviderServicesCard` on availability page.
3. ~~**Provider edit/delete**~~ – ✅ Implemented: `EditProviderDialog` and Deactivate button.
4. **Form templates** – CRUD for form templates if templates are managed in-app.
5. ~~**Provider unavailability**~~ – ✅ Implemented: Add time off form on availability page.
6. **Prescription creation** – UI to create prescriptions.
7. **Visit finalize** – If manual finalize is needed beyond AI Scribe flow.

---

## Frontend API Files Reference

| File | Covers |
|------|--------|
| `lib/api.ts` | Base client, refresh token |
| `lib/publicApi.ts` | Public clinics, services, providers, locations, availability |
| `lib/providerApi.ts` | Public booking (clinic providers, availability) |
| `lib/availabilityApi.ts` | Providers list/get, create, availability create/update |
| `lib/disciplineApi.ts` | Disciplines list, create, update, delete |
| `lib/locationApi.ts` | Locations list, create |
| `lib/serviceApi.ts` | Services list, create, update, delete |
| `lib/appointmentApi.ts` | Appointments CRUD, cancel, reschedule |
| `lib/recurringApi.ts` | Recurring appointments |
| `lib/patientApi.ts` | Patient-related (visits, prescriptions) |
| `lib/patientTimelineApi.ts` | Patient timeline (appointments, visits, forms, prescriptions) |
| `lib/treatmentPlanApi.ts` | Treatment plans (no get-by-id) |
| `lib/formsApi.ts` | Form respond, patient forms, templates for appointment |
| `lib/fileApi.ts` | Files list, download, delete (no upload) |
| `lib/invoiceApi.ts` | Full invoice CRUD |
| `lib/paymentApi.ts` | Payment confirm/fail |
| `lib/analyticsApi.ts` | Analytics endpoints |
| `lib/aiScribeApi.ts` | AI Scribe session endpoints |
| `lib/waitlistApi.ts` | Waitlist add, my, claim |
