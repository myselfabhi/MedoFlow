# Medoflow UI/UX Redesign Plan

## 1. Audit Summary

### 1.1 Public-Facing Pages
- **Homepage (`/`):** Currently a simple clinic list. Lacks marketing depth, featured services, and trust signals.
- **Clinic Detail (`/clinic/[id]`):** Simple service list. Needs a more "Clinic Profile" feel.
- **Storefront (`/store`):** Functional but feels like a generic grid. Needs to feel integrated into the care experience.
- **Booking Flow (`/book/[serviceId]`):** A linear 4-step process. Functional but needs more visual polish and a persistent summary panel.

### 1.2 Auth Flow
- **Login/Register:** Standard forms. Needs to feel more secure and premium.

### 1.3 Role-Based Dashboards
- **Super Admin:** Redirects to `/dashboard/front-desk`. Missing a high-level "Command Center" overview (finance, providers, health alerts).
- **Front Desk:** Functional today-view, but could use better quick-actions for checkouts and patient lookups.
- **Provider:** Clinical workspace exists but can be high-cognitive load. 
- **Patient:** Basic appointment list. Needs to surface summaries, billing, and memberships more prominently.

### 1.4 Visual Inconsistencies
- **Component Fragmentation:** Using both `frontend/components/ui-system` (custom) and `frontend/components/ui` (shadcn).
- **Design Language:** Varies between "Utility-first" and "Healthcare-premium".
- **Empty States:** Often just simple text.
- **Tables:** Basic styling, lacks advanced filtering/actions UI consistency.

---

## 2. Redesign Strategy

### 2.1 Information Architecture (IA)
- **Public Site:** Top navigation with direct access to Services, Providers, Store, and Booking.
- **Authenticated Redirects:**
  - `SUPER_ADMIN` -> `/dashboard/admin` (New command center)
  - `FRONT_DESK` -> `/dashboard/front-desk`
  - `PROVIDER` -> `/dashboard/provider`
  - `PATIENT` -> `/dashboard/patient`

### 2.2 Design System Standardization
- **Color Palette:** Professional healthcare blues, calm slates, and clean whites.
- **Typography:** High legibility, premium sans-serif.
- **Components to Standardize:**
  - `KPIStatCard`: For dashboard metrics.
  - `StatusBadge`: Unified colors for appointment/invoice states.
  - `StickySummaryPanel`: For booking and checkout.
  - `PageHeader`: Consistent title and primary actions.
  - `EmptyState`: Visual illustrations + clear CTAs.

### 2.3 Priority Redesign Areas
1. **Homepage:** Marketing-first, conversion-optimized.
2. **Booking Flow:** Premium, guided experience with summary.
3. **Admin Command Center:** High-level clinic health overview.
4. **Provider Consultation Workspace:** Focused, low-clutter environment.
5. **Patient Care Portal:** Unified timeline of care.

---

## 3. Phase-wise Implementation Plan

- **Phase 2 (IA):** Clean up routes and navigation components.
- **Phase 3 (Design System):** Unify components in `frontend/components/ui-system`.
- **Phase 4 (Public Site):** Build the new Homepage, Service list, and Storefront UI.
- **Phase 5 (Dashboards):** Implement role-specific landing pages.
- **Phase 6 (High-Priority Pages):** In-depth redesign of Booking, Consultation, and Checkout.
- **Phase 7 (Storefront Polish):** Integrate storefront access system-wide.
- **Phase 8 (Term Cleanup):** Final copy pass for professional tone.
- **Phase 9 (Verification):** Build and E2E checks.
