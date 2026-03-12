# Medoflow Demo Analytics Snapshot Checklist

Use this checklist to verify that the seeded demo universe is correctly reflected in the application before a presentation.

## 1. Clinic Overview (Admin Dashboard)
- [ ] **Total Revenue**: Should be > $8,000 (reflecting ~45 completed appointments + standalone sales).
- [ ] **Net Collected**: Should be > $7,000.
- [ ] **Outstanding AR**: Should be non-zero (Liam Nakamura's outstanding invoice should be visible).
- [ ] **Cancellation Rate**: Should be around 10–15% (5 cancelled, 2 no-shows out of 62).

## 2. Provider Performance
- [ ] **Dr. Marcus Rivera**: Should appear as the highest volume/revenue provider.
- [ ] **Dr. Sarah Chen**: Should show strong utilization and high-value initial assessments.
- [ ] **Coach James Wright**: Should show lower utilization (~40–50%) for visual contrast.

## 3. Commerce & Storefront
- [ ] **Product Revenue**: Should be non-zero (reflecting products added to appointments + Ryan's completed order).
- [ ] **Inventory**: "Mobility Roller Kit" should show at least 1 unit less than the initial seed (17 remaining if seeded with 18).
- [ ] **Package Revenue**: Should reflect at least 3 package purchases (Emma, Marcus Chen, Ethan).
- [ ] **Membership Revenue**: Should reflect active subscriptions for Emma and Isabella.

## 4. Hero Storylines
- [ ] **Emma Hartwell (Patient Portal)**: 
    - [ ] Active "Monthly Wellness Membership" visible.
    - [ ] Active "3-Session Recovery Package" with 2 sessions remaining.
    - [ ] Storefront Cart should have 2 items: Resistance Band Set and Daily Wellness Pack.
- [ ] **Liam Nakamura (Front Desk)**: 
    - [ ] Find Liam in "Invoices" or "Billing" — should have 1 OPEN/FINALIZED invoice for "Follow-up Physiotherapy Session".
- [ ] **AI Scribe (Provider View)**:
    - [ ] Dr. Sarah Chen's calendar → Emma Hartwell's upcoming appointment (7 days out) → AI Scribe tab should show a **DRAFT_GENERATED** transcript.

## 5. Refunds & Commissions
- [ ] **Refunds**: Sophia Martinez should show a full refund; Marcus Chen should show a partial refund.
- [ ] **Commissions**: Admin → Commissions Ledger should show ~46 records in PENDING state (and some PAID if older than 30 days).
