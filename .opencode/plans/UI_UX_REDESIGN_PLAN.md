# UI/UX Uniformity & Redesign Plan

## 1. Audit Findings
The following pages and patterns have been identified as inconsistent with the new "Medoflow Premium Healthcare" theme:

### 1.1 High Priority: Public Clinic Profile (`/clinic/[id]`)
- **Status:** Inconsistent. Uses generic Tailwind `gray` colors and a basic list view.
- **Goal:** Align with the new Homepage aesthetic. Use featured service cards and provider profiles.

### 1.2 Dashboard Landing Pages
- **Front Desk Dashboard:** Partially updated but lacks the high-end `KPIStatCard` indicators.
- **Provider Dashboard:** Functional but needs better visual hierarchy for the "Clinical Queue."
- **Patient Dashboard:** Needs to emphasize care outcomes (summaries, plans) over simple lists.

### 1.3 Administrative List Pages
- **Patients, Staff, Providers, Services, Disciplines, Locations:**
  - Most use basic `gray-900` typography.
  - Layouts are "Utility-first" rather than "Experience-first."
  - Inconsistent use of `AppPageHeader` and `AppCard`.

## 2. Redesign Implementation Plan

### Phase 1: The "Clinic Profile" Overhaul
- **File:** `frontend/app/(public)/clinic/[id]/page.tsx`
- **Changes:**
  - Implement a premium Clinic Hero section.
  - Redesign the Service list into a grid of premium cards (similar to homepage).
  - Add a "Provider Directory" section showcasing clinician profiles.
  - Standardize breadcrumbs and navigation back to the clinic list.

### Phase 2: Dashboard Landing Page Unification
- **Front Desk:** Update to use `KPIStatCard` for Invoices, Appointments, and Payments.
- **Provider:** Refine the `Clinical Queue` with better status indicators and "Current Appointment" highlighting.
- **Patient:** Redesign the care timeline to feel more supportive and informative.

### Phase 3: Administrative UI Standardization
- Update `PatientsPage`, `ProvidersPage`, `StaffPage`, etc.
- **Pattern:** 
  - `AppPageHeader` for title and primary actions (e.g., "Add Service").
  - `KPIStatCard` row for quick counts (e.g., "Total Patients", "New this week").
  - `AppCard` containing an `AppTable` for the main data.
  - Professional `slate-900` typography and consistent spacing.

### Phase 4: Final Terminology & Visual Audit
- Global pass to ensure all colors use the `slate` scale (not `gray`).
- Ensure all status badges use the `StatusBadge` component.
- Clean up any remaining development jargon.

## 3. Implementation Sequence
1. **Redesign Clinic Profile** (Immediate Priority - User Reported).
2. **Standardize Front Desk & List Pages**.
3. **Refine Provider & Patient Dashboards**.
4. **Global Terminology & Color Sync**.
