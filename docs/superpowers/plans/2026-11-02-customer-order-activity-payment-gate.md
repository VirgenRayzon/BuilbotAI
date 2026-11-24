# Customer Order Activity Payment Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide customer fulfillment activity until checkout is valid through payment or COD, while providing provider-neutral online-payment recovery.

**Architecture:** Add pure visibility predicates to the existing customer order workflow module and use them in the reservations list. Show the same provider-neutral recovery banner for incomplete GCash and PayMongo payments.

**Tech Stack:** TypeScript, React 19, Next.js 15, Mantine 8, Node test runner

**Spec:** `docs/superpowers/specs/2026-11-02-customer-order-activity-payment-gate-design.md`

## Global Constraints

- Order Activity is visible only for `paymentStatus === "paid"` or `paymentMethod === "cod"`.
- Incomplete GCash and PayMongo payments render “Payment Not Completed” with a right-aligned “Retry” button.
- Recovery UI does not name the payment provider.

## Review Focus

- Paid GCash orders show activity.
- Unpaid COD orders show activity.
- Pending, failed, and cancelled online payments hide activity but retain recovery UI.
- Item groups remain visible regardless of activity visibility.

---

### Task 1: Gate customer order activity by successful checkout

**Files:**
- Modify: `src/lib/customer-order-workflow.ts`
- Test: `src/lib/customer-order-workflow.test.ts`
- Modify: `src/app/profile/components/reservations-list.tsx`

**Interfaces:**
- Produces: `shouldShowCustomerOrderActivity(order: Order): boolean`

- [x] **Step 1: Write failing tests** for paid online, unpaid COD, and incomplete online-payment orders.
- [x] **Step 2: Run the focused test and confirm the new export is missing or returns the wrong value.**
- [x] **Step 3: Implement the predicate and use it to conditionally render `CustomerOrderActivity`.**
- [x] **Step 4: Render provider-neutral recovery for incomplete GCash and PayMongo payments.**
- [x] **Step 5: Run focused tests, typecheck, lint, and relevant order tests.**

