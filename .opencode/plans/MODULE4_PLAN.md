# Module 4: Storefront & Revenue Engine - Implementation Plan

## 1. Executive Summary
This document outlines the execution plan for **Module 4 (Storefront & Revenue Engine)** based on the Medoflow Phase 1 PRD. It covers the transition from an appointment-only billing system to a unified self-pay commerce engine that supports walk-in billing, a product catalog, packages, memberships, unified cart checkout, and provider commissions.

---

## 2. Database Schema Modifications (Prisma)

**2.1 Walk-in Billing Support**
*   **Goal:** Allow creating invoices without a required appointment.
*   **Change:** Modify the `Invoice` model to make `appointmentId` optional (`appointmentId String?`).

**2.2 Unified Cart Engine**
*   **Goal:** Support mixed-item checkouts (Services + Products + Packages).
*   **Change:** Create `Cart` and `CartItem` models.
    *   `Cart`: `id`, `patientId` (optional for guests), `clinicId`, `status` (ACTIVE, ABANDONED, COMPLETED), `expiresAt`.
    *   `CartItem`: `id`, `cartId`, `itemType` (SERVICE, PRODUCT, PACKAGE, MEMBERSHIP), `itemId` (reference to specific product/service ID), `quantity`, `unitPrice`.

**2.3 Commission Tracking**
*   **Goal:** Track revenue splits for providers based on services, products, or packages.
*   **Change:** Create `CommissionRule` and `CommissionRecord` models.
    *   `CommissionRule`: `id`, `clinicId`, `providerId` (optional), `itemType`, `itemId` (optional), `percentage`, `fixedAmount`.
    *   `CommissionRecord`: `id`, `clinicId`, `providerId`, `invoiceId`, `invoiceItemId`, `amount`, `status` (PENDING, APPROVED, PAID).

**2.4 Expanded Order/Fulfillment Tracking (Optional/Phase 1.5)**
*   **Goal:** Track physical product fulfillment.
*   **Change:** Add `Order` model linked to `Invoice` with fulfillment status (`PENDING`, `SHIPPED`, `DELIVERED`).

---

## 3. Backend API Development (Node.js/Express)

**3.1 Product Catalog (`/api/products`)**
*   **Endpoints:** `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`.
*   **Logic:** Standard CRUD, ensuring `clinicId` scoping. Includes image URL handling.

**3.2 Inventory Management (`/api/inventory`)**
*   **Endpoints:** `GET /`, `PUT /:productId/adjust`.
*   **Logic:** Adjust stock quantities, trigger low-stock alerts based on `reorderThreshold`. Auto-decrement stock upon successful invoice payment.

**3.3 Packages (`/api/packages`)**
*   **Endpoints:** `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`, `POST /:id/redeem`.
*   **Logic:** CRUD for package definitions. Logic to track and deduct available sessions for a patient.

**3.4 Memberships (`/api/memberships`)**
*   **Endpoints:** `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`, `POST /patient/:patientId/assign`.
*   **Logic:** Manage membership tiers and assign active memberships to patients. (Stripe billing integration to be handled in tandem).

**3.5 Unified Cart & Checkout (`/api/cart`)**
*   **Endpoints:** `POST /`, `GET /:id`, `POST /:id/items`, `DELETE /:id/items/:itemId`, `POST /:id/checkout`.
*   **Logic:** Accumulate mixed items, calculate taxes/discounts, and convert the Cart into an `Invoice` + `Payment` intent (Stripe integration).

**3.6 Walk-in Billing / Enhanced Invoices (`/api/invoices`)**
*   **Logic Updates:** Update `createInvoice` service to accept ad-hoc line items without needing an `appointmentId`.

**3.7 Commissions (`/api/commissions`)**
*   **Endpoints:** `GET /rules`, `POST /rules`, `GET /records`.
*   **Logic:** Calculate commissions automatically when an invoice is marked `PAID`.

---

## 4. Frontend Implementation (React/Next.js)

**4.1 Admin/Super Admin Dashboard Views**
*   **Products & Inventory:** Build `/dashboard/products` for catalog management and stock adjustment.
*   **Packages & Memberships:** Build `/dashboard/packages` and `/dashboard/memberships` for configuration.
*   **Commissions:** Build `/dashboard/commissions` to view provider payouts and set rules.

**4.2 Front Desk / Operations Views**
*   **Point of Sale (POS) / Walk-in Billing:** Build a unified POS interface (`/dashboard/front-desk/pos`) allowing Front Desk staff to search patients, add products/services to a cart, generate an ad-hoc invoice, and process payment immediately.

**4.3 Patient-Facing Storefront**
*   **Hosted Storefront:** Create public routes (`/store`, `/store/products`, `/store/packages`) displaying the clinic's catalog.
*   **Cart & Checkout UI:** Build a persistent cart sidebar/page and a unified checkout flow utilizing Stripe Elements.

---

## 5. Execution Sequencing

**Wave 1: Database & Core Admin**
1.  Update Prisma schema (Cart, Commissions, Invoice tweak).
2.  Build Backend APIs for Products, Inventory, Packages, Memberships.
3.  Build Admin Dashboard UIs for managing the catalog.

**Wave 2: Internal POS & Walk-in Billing**
1.  Update Invoice service for Walk-ins.
2.  Build the Front Desk POS interface.
3.  Wire up inventory decrement logic on payment.

**Wave 3: Patient Storefront & Cart**
1.  Build Cart APIs and Checkout conversion logic.
2.  Build Public Storefront UI.
3.  Implement Stripe Unified Checkout for mixed carts.

**Wave 4: Commissions**
1.  Build Commission calculation engine on Payment success.
2.  Build Commission reporting UI.