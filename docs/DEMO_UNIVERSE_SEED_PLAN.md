# Demo Universe Seed Plan

Date: 2026-03-13

---

## 1. Seed Path

**New file**: `backend/prisma/seed_demo.ts`
**New script**: `npm run seed:demo` → `npx ts-node prisma/seed_demo.ts`

Extends (does not replace) the existing `seed.ts` and `seed_storefront.ts`. Targets a new demo clinic "Everwell Longevity Clinic" with no overlap with the existing "Demo Clinic".

---

## 2. Entities to Create

### Clinic & Infrastructure
- Clinic: Everwell Longevity Clinic
- Location: Main Clinic — 1200 Wellness Drive, Suite 100
- 4 Disciplines: Physiotherapy, Sports Medicine, Nutrition & Wellness, Mental Performance

### Catalog
- 12 Services (3 per discipline)
- 8 Products + InventoryItem per product
- 3 Packages
- 2 Memberships

### Users & Staff
- 1 SUPER_ADMIN: Alex Thornton (alex@everwell.demo)
- 1 FRONT_DESK: Jordan Walsh (jordan@everwell.demo)
- 4 PROVIDER users: Sarah Chen, Marcus Rivera, Priya Patel, James Wright
- 15 PATIENT users

### Providers
- 4 Provider records with disciplines, services, availability, location assignments
- Provider shape designed to produce analytics contrast:
  - Dr. Sarah Chen: high-value (physiotherapy) — 35% commission rule
  - Dr. Marcus Rivera: high-volume (sports medicine) — 30% commission rule
  - Dr. Priya Patel: mid-tier (nutrition) — 25% commission rule
  - Coach James Wright: lower utilization (mental performance) — 20% commission rule

### Clinical + Scheduling Data
- 61 total appointments across past 60 days + next 21 days
  - 44 COMPLETED
  - 10 CONFIRMED (upcoming)
  - 5 CANCELLED
  - 2 NO_SHOW
- 1 hero patient visit record (FINAL + APPROVED AI scribe + published patient summary)
- 1 demo visit record (DRAFT + DRAFT_GENERATED AI scribe — ready for live demo approval)

### Billing
- ~47 invoices (44 from COMPLETED appointments + 3 standalone commerce)
- Mix of PAID, FINALIZED (outstanding), CANCELLED (refunded)
- 1 full refund (Sophia Martinez)
- 1 partial refund (Marcus Chen)
- 1 outstanding unpaid invoice (Liam Nakamura)
- 1 partially paid invoice (Benjamin Taylor)
- Manual payments with paymentChannel=MANUAL, paymentMethod=CASH or BANK_TRANSFER

### Commissions
- 4 CommissionRules (one per provider, PERCENTAGE type on ALL items)
- ~40 CommissionRecord entries (PENDING mostly, 8 PAID for older invoices)

### Entitlements
- 3 PatientPackage records (1 active partial-use, 1 newly purchased, 1 exhausted)
- 2 PatientSubscription records (1 ACTIVE wellness, 1 ACTIVE premium)

---

## 3. Required Clinic/User Relationships

Every entity requires `clinicId`. The seed resolves this by:
1. Finding or creating "Everwell Longevity Clinic"
2. Assigning every user, provider, service, product, etc. to that clinic

Provider users must have `clinicId` set on their User record (required for `requireClinic` middleware).

---

## 4. Fields Important for UI Richness

| Page | Key Fields |
|------|-----------|
| Analytics | appointments: status, provider, service; invoices: payments with amounts; commission records; patient subscriptions; provider availability |
| Front-desk invoices | invoice.status, financialStatus (derived), patient.name, provider, totalAmount, outstandingAmount, paymentChannel, paymentMethod |
| Commissions | rule.commissionType/Value, record.basisAmount/amount/status/earnedAt, provider.firstName/lastName |
| Provider calendar | appointment startTime/endTime, patient.name, service.name, status |
| Store | product.name/description/price, package.totalSessions, membership.monthlyPrice/serviceDiscountPercent |
| Memberships dashboard | PatientSubscription.status, membership.name/monthlyPrice/serviceDiscountPercent |

---

## 5. Idempotency Strategy

| Entity | Strategy |
|--------|---------|
| Clinic | findFirst by name |
| Location | upsert by clinicId_name |
| Disciplines | upsert by clinicId_name |
| Services | upsert by clinicId_name |
| Products/Packages/Memberships | upsert by clinicId_name |
| Users | upsert by email |
| Providers | findFirst by email (linked to user) |
| ProviderDiscipline | upsert by providerId_disciplineId |
| ProviderService | upsert by providerId_serviceId |
| ProviderAvailability | findFirst(providerId, weekday) before create |
| ProviderLocationAssignment | upsert by providerId_locationId |
| CommissionRules | findFirst(clinicId, providerId) before create |
| PatientSubscriptions | findFirst(patientId, membershipId) before create |
| PatientPackages | findFirst(patientId, packageId) before create |
| **Appointments** | **Skip if clinic already has >5 appointments** |
| Invoices/Payments/CommissionRecords | Created inline with appointments; skipped if appointments skipped |
| VisitRecords | upsert by appointmentId (has @unique) |
| AIScribeSessions | findFirst(visitRecordId) before create |

---

## 6. Analytics Story Shape

Target numbers from seeded data:
- Total invoiced: ~$8,500
- Collected revenue: ~$8,200
- Refunded: ~$140
- Outstanding AR: ~$155
- Completed appointments: 44
- Cancellation rate: ~8%
- No-show rate: ~3%
- Provider with lowest utilization: Coach James Wright (~40%)
- Provider with highest utilization: Dr. Marcus Rivera (~75%)

---

## 7. Hero Storylines Embedded

**Storyline A — Emma Hartwell (hero patient)**:
- Initial consult → 2 follow-ups (completed) → upcoming appointments
- Active Wellness Membership (15% discount)
- Active 3-Session Recovery Package (1 used, 2 remaining)
- Completed SOAP note: FINAL, APPROVED AI scribe, published patient summary
- Upcoming appointment has DRAFT_GENERATED AI scribe ready to demo-approve

**Storyline B — Liam Nakamura (outstanding balance)**:
- 2 completed appointments — 1 paid, 1 with unpaid invoice
- Front-desk can demo "Collect" on his outstanding invoice

**Storyline C — Sophia Martinez (refund)**:
- 2 completed appointments — 1 paid, 1 fully refunded
- Shows refund flow in billing operations

**Storyline D — Provider analytics contrast**:
- Dr. Marcus Rivera: 15 completed, highest volume
- Coach James Wright: 6 completed, lowest utilization — visible contrast in analytics

**Storyline E — Package/membership entitlement**:
- Emma has active membership → discount visible on appointment detail
- Marcus Chen has 6-Session Performance Package with 4/6 used
- Ethan Brown has exhausted 10-Session Physio Rehab Package
