# MedoFlow UI/UX Test Guide

Sequential test flow for manual QA: entry points, login options, credentials, and role-based capabilities.

---

## 1. Entry Points

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1.1 | Open app (e.g. `http://localhost:3000`) | Public home page: "Find a Clinic" with clinic cards |
| 1.2 | Header shows **Login** and **Register** links | Both links visible in top-right |
| 1.3 | Click **Login** | Navigate to `/login` – Sign in form (email, password) |
| 1.4 | Click **Register** | Navigate to `/register` – Create account form with role selector |
| 1.5 | Click **Medoflow** logo | Return to home `/` |

---

## 2. Login Options

| Step | Action | Expected Result |
|------|--------|-----------------|
| 2.1 | From home, click **Login** | `/login` – Sign in form |
| 2.2 | From login, click "Don't have an account? **Register**" | Navigate to `/register` |
| 2.3 | From register, click "Already have an account? **Login**" | Navigate to `/login` |
| 2.4 | Unauthenticated user visits `/dashboard` | Redirect to `/login?returnUrl=/dashboard` |
| 2.5 | After successful login | Redirect to `returnUrl` or `/dashboard` |

---

## 3. Login Credentials (Seed)

Run `cd backend && npx prisma db seed` to ensure Super Admin exists.

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| **SUPER_ADMIN** | `admin@medoflow.com` | `Admin123!` | Created by seed; no clinic assigned |

Other roles (CLINIC_ADMIN, PROVIDER, STAFF, PATIENT) must be created via:
- **Register** (`/register`) for CLINIC_ADMIN, PROVIDER, STAFF
- **Public booking** for PATIENT (created when booking as guest)

---

## 4. Role-Based Test Flows (Sequential)

### 4.1 SUPER_ADMIN

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as `admin@medoflow.com` / `Admin123!` | Redirect to `/dashboard/front-desk` |
| 2 | Navbar shows **Clinic Switcher** (dropdown) | Dropdown to select clinic; "SUPER ADMIN" badge |
| 3 | If no clinics exist | Clinic switcher hidden; "Select a clinic" where needed |
| 4 | Sidebar items | Dashboard, Front Desk, Invoices, Appointments, Providers, Disciplines, Services, Analytics |
| 5 | Click **Dashboard** | Redirect to Front Desk |
| 6 | Click **Front Desk** | `/dashboard/front-desk` – check-in, today's appointments |
| 7 | Click **Invoices** | `/dashboard/front-desk/invoices` – invoice list |
| 8 | Click **Appointments** | `/dashboard/appointments` – all appointments (clinic-scoped) |
| 9 | Click **Providers** | `/dashboard/providers` – list providers (must select clinic first) |
| 10 | Click **Disciplines** | `/dashboard/disciplines` – manage disciplines |
| 11 | Click **Services** | `/dashboard/services` – manage services |
| 12 | Click **Analytics** | `/dashboard/analytics` – clinic analytics |
| 13 | Sign out | Redirect to home or login |

**What SUPER_ADMIN can do:**
- **Front Desk** tab: View today’s appointments, unpaid invoices count, pending payments count; see upcoming appointments table
- **Invoices** tab: Filter by status (Draft, Finalized, Paid); view all clinic invoices; mark invoices as paid; open appointment detail from invoice
- **Appointments** tab: View all clinic appointments; click appointment to open provider/visit view
- **Providers** tab: View providers for selected clinic; click **Edit availability** to set provider schedules
- **Disciplines** tab: Create, edit, archive disciplines
- **Services** tab: Create, edit, archive services; link to discipline
- **Analytics** tab: View clinic analytics (charts, metrics)
- **Clinic Switcher**: Switch between clinics to see data for each

---

### 4.2 CLINIC_ADMIN

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Register with role **Clinic Admin**, clinic name & email | Account created; redirect to login |
| 2 | Login with new credentials | Redirect to `/dashboard/front-desk` |
| 3 | Navbar | No clinic switcher; "CLINIC ADMIN" badge; clinic auto-scoped |
| 4 | Sidebar | Same as SUPER_ADMIN (Dashboard, Front Desk, Invoices, Appointments, Providers, Disciplines, Services, Analytics) |
| 5 | Create discipline | Can add disciplines for own clinic |
| 6 | Create service | Can add services for own clinic |
| 7 | Create provider | Can add providers for own clinic |
| 8 | Edit provider availability | Can set availability for providers |
| 9 | Create treatment plan | Can pick provider when creating plan (provider picker visible) |
| 10 | Sign out | Redirect to home or login |

**What CLINIC_ADMIN can do:**
- **Front Desk** tab: Same as SUPER_ADMIN; view today’s appointments and invoices
- **Invoices** tab: Filter, view, mark as paid; open appointment detail
- **Appointments** tab: View all clinic appointments; open appointment details
- **Providers** tab: View providers; click **Edit availability** to set schedules
- **Disciplines** tab: Create, edit, archive disciplines for own clinic
- **Services** tab: Create, edit, archive services for own clinic
- **Analytics** tab: View clinic analytics
- **Provider appointment detail**: Create invoice, finalize, add/remove items; view patient record; intake forms; create treatment plans (with provider picker)

---

### 4.3 STAFF

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Register with role **Staff**, select clinic ID | Account created; redirect to login |
| 2 | Login with new credentials | Redirect to `/dashboard/front-desk` |
| 3 | Navbar | No clinic switcher; "STAFF" badge |
| 4 | Sidebar | Same as CLINIC_ADMIN |
| 5 | Front Desk | Check-in patients, view today's appointments |
| 6 | Invoices | View and manage invoices |
| 7 | Appointments | View and manage appointments |
| 8 | Providers | View providers (read-only or limited edit) |
| 9 | Disciplines | View disciplines |
| 10 | Services | View services |
| 11 | Create treatment plan | No provider picker (uses current provider context) |
| 12 | Sign out | Redirect to home or login |

**What STAFF can do:**
- **Front Desk** tab: View today’s appointments, unpaid invoices, pending payments
- **Invoices** tab: Filter, view, mark invoices as paid; open appointment detail
- **Appointments** tab: View all clinic appointments; open appointment details
- **Providers** tab: View providers; click **Edit availability** to set schedules
- **Disciplines** tab: View disciplines (create/edit depends on backend)
- **Services** tab: View services (create/edit depends on backend)
- **Analytics** tab: View clinic analytics
- **Provider appointment detail**: Create invoice, finalize, add/remove items; view patient record; intake forms; create treatment plans (no provider picker)

---

### 4.4 PROVIDER

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Register with role **Provider**, select clinic ID | Account created; must be linked to Provider record |
| 2 | Login with new credentials | Redirect to `/dashboard` – Provider Dashboard |
| 3 | Navbar | No clinic switcher; "PROVIDER" badge |
| 4 | Sidebar | Dashboard, Calendar, Appointments, Providers, Disciplines, Services, Analytics |
| 5 | Dashboard | Today's appointments, pending invoices, active treatment plans |
| 6 | Calendar | `/dashboard/provider/calendar` – provider calendar view |
| 7 | Appointments | View and manage own appointments |
| 8 | Providers | View providers list |
| 9 | Patient record | Open appointment → visit record, SOAP notes, prescriptions |
| 10 | Sign out | Redirect to home or login |

**What PROVIDER can do:**
- **Dashboard** tab: See today’s appointments count, pending invoices, active treatment plans; quick links to Calendar and appointments
- **Calendar** tab: View calendar; see appointments for the day
- **Appointments** tab: View own appointments; click **View** to open appointment detail
- **Appointment detail** (own): Create/edit visit record (SOAP notes); add prescriptions; create invoice; finalize invoice; view patient record; intake forms; create treatment plans (for own patients)
- **Providers** tab: View providers list
- **Disciplines** tab: View disciplines
- **Services** tab: View services
- **Analytics** tab: View clinic analytics

---

### 4.5 PATIENT

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Book appointment as guest (public flow) | PATIENT account created during booking |
| 2 | Login with patient credentials | Redirect to `/dashboard` – Patient Dashboard |
| 3 | Navbar | "PATIENT" badge |
| 4 | Sidebar | Dashboard, My Appointments |
| 5 | Dashboard | Profile (name, email, role) |
| 6 | My Appointments | `/dashboard/patient/appointments` – list of own appointments |
| 7 | Open appointment | View details, cancel if allowed |
| 8 | Waitlist (if available) | Join waitlist for preferred slots |
| 9 | Sign out | Redirect to home or login |

**What PATIENT can do:**
- **Book appointments** (no login): Go to home → click clinic → click service → **Book Now** → select provider, date, time → enter name, email, password → confirm → creates appointment and PATIENT account
- **Dashboard** tab: View profile (name, email, role)
- **My Appointments** tab: View list of appointments (service, provider, date/time, status); click **View Details** to open appointment
- **Appointment detail**: View service, provider, date/time, status; view visit record (SOAP notes if finalized); view intake forms; view patient files; view prescriptions
- **Join waitlist**: If no slots available on booking page, click **Join waitlist** → enter name/email → join; access via `/dashboard/patient/waitlist` to view entries and **Claim** offered slots
- **Book new appointment** (logged in): Click **Book an appointment** from empty state → goes to home → browse clinics → book

---

## 5. Public Booking Flow (No Login)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Home → click clinic card | `/clinic/[id]` – clinic services |
| 2 | Click service | `/book/[serviceId]` – select provider, date, time |
| 3 | Fill booking form (patient details) | Creates PATIENT if new; creates appointment |
| 4 | Redirect | Payment page or confirmation |
| 5 | Intake form (if applicable) | `/intake/[appointmentId]` – pre-visit form |

---

## 6. Quick Reference: Sidebar by Role

| Role | Sidebar Items | Main Actions |
|------|---------------|--------------|
| **SUPER_ADMIN** | Dashboard, Front Desk, Invoices, Appointments, Providers, Disciplines, Services, Analytics | Switch clinics; manage all clinic data; edit provider availability |
| **CLINIC_ADMIN** | Same as SUPER_ADMIN | Manage own clinic; create disciplines/services/providers; invoices; treatment plans |
| **STAFF** | Same as SUPER_ADMIN | Front desk; view/manage invoices; view appointments; create invoices |
| **PROVIDER** | Dashboard, Calendar, Appointments, Providers, Disciplines, Services, Analytics | View own appointments; SOAP notes; prescriptions; invoices; treatment plans |
| **PATIENT** | Dashboard, My Appointments | Book appointments; view appointments; view visit notes; join/claim waitlist |

---

## 7. Prerequisites for Testing

1. **Backend** running: `cd backend && npm run dev`
2. **Frontend** running: `cd frontend && npm run dev`
3. **Database** migrated: `cd backend && npx prisma migrate dev`
4. **Seed** run: `cd backend && npx prisma db seed` (creates Super Admin)
5. **Clinics** exist (create via CLINIC_ADMIN registration or manually in DB) for SUPER_ADMIN clinic switcher to work
