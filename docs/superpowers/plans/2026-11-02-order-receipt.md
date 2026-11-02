# Customer Order Receipt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a one-page US Letter receipt download to completed customer orders.

**Architecture:** A pure client-safe `pdf-lib` module converts an `Order` into PDF bytes. The reservation card header calls a small download helper and exposes a compact button after Total Amount.

**Tech Stack:** TypeScript, React 19, Next.js 15, Mantine, pdf-lib, Node test runner

**Spec:** `docs/superpowers/specs/2026-11-02-order-receipt-design.md`

## Global Constraints

- Exactly one 612 x 792 point page.
- Use authoritative order fields; do not invent fiscal or warranty details.
- Preserve light/dark theme support and a minimum 44px interactive target.

## Review Focus

- Long item names must not overlap price columns.
- Ten-plus component builds must remain one page.
- Missing optional address/payment fields must render safe fallback text.
- Currency totals must remain accurate to two decimal places.
- Browser download URLs must be revoked after use.

### Task 1: Receipt PDF generator

**Files:**
- Create: `src/lib/order-receipt-pdf.ts`
- Create: `src/lib/order-receipt-pdf.test.ts`

- [ ] Write a failing test that generates a representative PC order and asserts one Letter page, receipt identity, line items, and total.
- [ ] Implement `createOrderReceiptPdf(order: Order): Promise<Uint8Array>` with adaptive single-page layout.
- [ ] Run the focused test and confirm it passes.

### Task 2: Customer download control

**Files:**
- Create: `src/components/orders/download-receipt-button.tsx`
- Modify: `src/app/profile/components/reservations-list.tsx`

- [ ] Add a compact download button immediately after Total Amount.
- [ ] Generate a stable receipt filename, trigger the browser download, and revoke the object URL.
- [ ] Run typecheck, lint, order tests, build, and render a sample PDF for visual inspection.
