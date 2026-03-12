## Module 5 Metric Definitions

Date: 2026-03-12

These definitions match the current Medoflow Modules 1–4 data model and ledger behavior.

## Common filter behavior

- Default period:
  - last 30 days ending today
- Date filtering:
  - appointment-based metrics use `Appointment.startTime`
  - invoice/payment-based metrics use `Invoice.createdAt` unless the metric is explicitly payment-ledger oriented
  - subscription churn/status metrics use subscription period/status timestamps already present in local records; no external warehouse dates exist
- Previous period:
  - same duration immediately preceding the selected date range
- Clinic scope:
  - always scoped to `clinicId`
- Provider scope:
  - provider analytics are always restricted to the authenticated provider’s own `providerId`

## Revenue / Finance

### Total revenue
- Definition:
  - sum of `Invoice.totalAmount` for invoices in scope excluding `DRAFT`
- Source:
  - [backend/prisma/schema.prisma](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/prisma/schema.prisma) `Invoice`
- Caveat:
  - this is invoiced revenue, not collected cash

### Collected revenue
- Definition:
  - sum of positive `Payment.amount` for payments with status in `PAID`, `PARTIALLY_REFUNDED`, `REFUNDED`
- Source:
  - `Payment.amount`, `Payment.status`
- Caveat:
  - this reflects gross money recorded before subtracting refunds

### Refunded amount
- Definition:
  - sum of absolute value of negative `Payment.amount` for payments with status `REFUNDED` or `PARTIALLY_REFUNDED`
- Source:
  - `Payment.amount`, `Payment.status`, `refundForPaymentId`

### Outstanding receivables
- Definition:
  - sum of `computeInvoiceFinancials(invoice).outstandingAmount`
- Source:
  - [backend/src/services/invoiceService.ts](/Users/abhinavverma/Documents/Projects/AdvertOut/Projects/MedoFlow/backend/src/services/invoiceService.ts)
- Caveat:
  - this uses Medoflow’s current invoice/payment ledger semantics, not accrual accounting

### Average revenue per patient
- Definition:
  - `net collected revenue / distinct patients with at least one non-draft invoice in range`
- Source:
  - invoices + payments
- Caveat:
  - narrowed to the selected date range, not lifetime ARPU

### Average revenue per visit
- Definition:
  - `net collected revenue / completed appointments in range`
- Source:
  - payments + appointments
- Caveat:
  - narrowed to completed appointments only

## Scheduling / Operations

### Total appointments
- Definition:
  - count of appointments in range

### Completed appointments
- Definition:
  - count of appointments with `status = COMPLETED`

### Cancellation rate
- Definition:
  - `cancelled appointments / total appointments in range`

### No-show rate
- Definition:
  - `no-show appointments / total appointments in range`

### Average appointment duration
- Definition:
  - mean of `(endTime - startTime)` in minutes for completed appointments

### Provider utilization
- Definition:
  - `scheduled appointment minutes / projected available minutes`
- Scheduled minutes:
  - sum of appointment duration for statuses `CONFIRMED`, `COMPLETED`, `PENDING_PAYMENT`, `PENDING_PROVIDER_APPROVAL`
- Available minutes:
  - sum of provider weekly availability windows projected across the selected date range
- Caveat:
  - excludes one-off unavailability subtraction in this phase
  - uses recurring weekly availability as the source of capacity truth

### Upcoming load
- Definition:
  - count of non-cancelled future appointments in the next 7 days from today

### Waitlist impact
- Definition:
  - count of waitlist entries created in range and count/booking conversion where `status = BOOKED`
- Caveat:
  - this is a narrow operational impact measure, not a revenue attribution model

## Provider metrics

### Provider revenue
- Definition:
  - net collected revenue for invoices linked to that provider
- Visibility:
  - provider sees only their own figure
  - admin sees clinic/provider comparisons

### Average revenue per visit
- Definition:
  - provider net collected revenue / provider completed appointments

### Follow-up conversion rate
- Definition:
  - share of patients with a completed appointment with the provider in range who book another later appointment with the same provider within 90 days
- Caveat:
  - narrow operational follow-up proxy, not treatment outcome conversion

### Provider retention rate
- Definition:
  - share of provider patients in range with more than one completed appointment ever
- Caveat:
  - this is a narrow repeat-patient rate, not a true cohort retention model

## Patient metrics

### Patient lifetime value
- Definition:
  - total net collected revenue across all invoices for the patient

### Visit frequency
- Definition:
  - average completed appointments per patient in range

### Repeat visit rate
- Definition:
  - share of patients with at least 2 completed appointments

### Inactive patients
- Definition:
  - patients with prior completed appointments but no completed visit in the last 90 days and no upcoming appointment

### Drop-off risk
- Definition:
  - deterministic flag:
    - had at least 2 completed appointments historically
    - no completed appointment in last 90 days
    - no future appointment scheduled
- Caveat:
  - this is a narrow rule-based risk flag, not predictive AI

## Commerce / Membership / Package

### Product revenue
- Definition:
  - sum of `InvoiceItem.totalPrice` for product items on paid invoices

### Package revenue
- Definition:
  - sum of `InvoiceItem.totalPrice` for package items on paid invoices

### Membership revenue
- Definition:
  - sum of `InvoiceItem.totalPrice` for membership items on paid invoices
- Caveat:
  - because recurring membership renewals are recorded into invoices locally, this includes local subscription invoice ledger entries

### Top-selling products
- Definition:
  - products ordered by summed quantity sold on paid invoices

### Package utilization
- Definition:
  - `used sessions / total sessions` across active and historical patient packages in scope

### Membership churn
- Definition:
  - `subscriptions ended or canceled in current period / subscriptions active at start or created during period`
- Caveat:
  - narrowed to local subscription state transitions available in current records

### Attach rate
- Definition:
  - share of appointment-linked invoices that include at least one product item
- Caveat:
  - only valid because invoices can link to appointments

## Commission metrics

### Commission owed
- Definition:
  - sum of `CommissionRecord.amount` where status = `PENDING`

### Commission paid
- Definition:
  - sum of `CommissionRecord.amount` where status = `PAID`

### Commission pending count
- Definition:
  - count of `CommissionRecord` where status = `PENDING`

## Business alerts

All alerts are deterministic rules comparing current period to previous period or current values to thresholds.

### Revenue down materially
- Trigger:
  - current net collected revenue is at least 15% lower than previous period

### Receivables up materially
- Trigger:
  - current outstanding receivables are at least 20% higher than previous period

### Cancellation rate spike
- Trigger:
  - current cancellation rate is at least 5 percentage points higher than previous period

### No-show rate spike
- Trigger:
  - current no-show rate is at least 3 percentage points higher than previous period

### Low provider utilization
- Trigger:
  - provider utilization below 40% with at least one availability block in the period

### Membership churn elevated
- Trigger:
  - churn rate above 10% and higher than previous period

### Package exhaustion pressure
- Trigger:
  - at least one active patient package is exhausted or expires within 14 days

## Role visibility

### Super admin
- full clinic command center
- finance
- provider comparisons
- patient analytics
- commissions
- commerce
- memberships/packages
- alerts

### Front desk
- clinic operations
- high-level finance/receivables
- commerce operational summaries
- memberships/packages operational summaries
- no provider-private analytics view

### Provider
- only their own provider analytics
- personal appointments/utilization/follow-up/repeat-patient metrics
- personal revenue and commission visibility only
- no clinic-wide finance or other-provider comparisons

### Patient
- no Module 5 analytics endpoints
