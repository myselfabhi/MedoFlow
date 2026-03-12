# Phase 1 Gap Analysis and Action Plan (Modules 1-3)

Based on a comparison between the Medoflow Phase 1 PRD and the current codebase, the following gaps have been identified and a plan to address them is outlined below.

## Module 1: Clinic Infrastructure

**Identified Gaps:**
1. **Location Management:** While the hidden location architecture exists (PRD `INF-02`), there are no endpoints to Update (`PUT /locations/:id`) or Archive/Delete (`DELETE /locations/:id`) an existing location.
2. **Service Fetching:** The API lacks a singular fetch endpoint (`GET /services/:id`), though the underlying service layer supports it.
3. **Last-Admin Protection:** The API currently lacks an explicit guardrail (PRD `INF-08`) preventing a Super Admin from demoting or deleting themselves if they are the only Super Admin remaining.

**Action Plan:**
*   **Backend:** Add the missing `PUT` and `DELETE` routes to `backend/src/routes/locations.ts` and controllers.
*   **Backend:** Add `GET /services/:id` to `backend/src/routes/services.ts`.
*   **Backend:** Update the User/Provider controller (e.g. `backend/src/controllers/providerController.ts` or user controller) to query the count of users with the `SUPER_ADMIN` role before allowing a demotion/deletion of an admin.
*   **Frontend:** Wire up Edit/Archive actions in the Location list view.

---

## Module 2: Appointment Scheduling System

**Identified Gaps:**
1. **Payment Gateway Integration (PRD `SCH-04`):** The backend beautifully handles the 10-minute temporary `SlotHold` and transitions to `PENDING_PAYMENT`, but it currently lacks an actual integration to a PCI-compliant processor (like Stripe). It relies on database flags alone.
2. **Transactional Notifications:** There is an `emailService` for staff invites, but the system does not fire automated emails/SMS for Booking Confirmations (PRD `SCH-05`), Cancellations, or Reschedules.
3. **Waitlist Cascading (PRD `SCH-13`):** The system currently offers slots to waitlisted patients and expires them correctly after 30 minutes via a cron job. However, it does not automatically *cascade* the offer to the *next* person on the waitlist once the first offer expires.

**Action Plan:**
*   **Backend:** Integrate Stripe (or equivalent) to generate checkout sessions and process Webhooks to trigger your existing `confirmPayment` and `failPayment` logic.
*   **Backend:** Expand the notification service (e.g., using SendGrid/Twilio or Resend) and hook it into the appointment lifecycle events.
*   **Backend:** Update the `expireWaitlistOffers` cron job to trigger `offerSlotToWaitlist` for the next available patient whenever an offer expires.

---

## Module 3: Patient Record System + AI Scribe

**Identified Gaps:**
1. **Frontend Note Edit History (PRD `REC-09`):** The backend creates an immutable `VisitNoteVersion` every time a note is updated. However, the Frontend does not utilize the `?includeHistory=true` query parameter, meaning providers cannot visually see the previous versions or edits of a SOAP note.
2. **Global Audit Log Visibility (PRD `REC-09` & `9.1`):** The backend diligently captures system `AuditLogs` (e.g., when a file is downloaded or a note is finalized), but there is no interface for a Super Admin to actually review these compliance logs in the frontend.

**Action Plan:**
*   **Frontend:** Build a "Version History" modal on the `ProviderPatientTimelinePage` that iterates over a note's history array, showing timestamp, editor, and diffs.
*   **Frontend:** Build a global `Audit Logs` dashboard (accessible only to `SUPER_ADMIN`) to display a paginated list of system events, ensuring HIPAA alignment is visibly provable to clinic operators.
