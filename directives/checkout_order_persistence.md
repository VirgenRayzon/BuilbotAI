# Checkout Order Persistence & Payment Integrity

## Goal

Persist checkout orders atomically and enforce server-authoritative order, payment, stock, and webhook transitions without allowing unverified writes or gateway bypasses.

## Rules

1. **Private Low-Level Writer & Verified Callers:** Keep low-level checkout creation (`processCheckoutInternal`) private inside `src/app/checkout-actions.ts`. Public entry points (`createCheckoutOrder`, `reservePrebuiltSystem`) must verify a Firebase ID token with `verifyIdToken(..., true)` and validate payloads with `zod`.
2. **No Direct Client `/orders` Writes:** Client code must never write directly to `/orders` (enforced by `firestore.rules`). Administrative seeding/reset (`src/app/admin/sales-admin-actions.ts`), status transitions, payment updates, and refunds must execute through authenticated Server Actions using Firebase Admin SDK transactions.
3. **Gateway Payment Integrity:**
   - Persist `paymongoMode` during initial order creation.
   - `resolveSimulatedPayment` must never mark `paymongo_simulated` gateway orders as `paid`.
   - `/api/webhooks/paymongo` requires a configured `PAYMONGO_WEBHOOK_SECRET`, valid HMAC signature, Zod-validated envelope, matching Checkout Session ID / reference, and matching centavo amount (cross-checking `payment.paid`/`payment.failed` against PayMongo Checkout Session retrieval when `PAYMONGO_SECRET_KEY` is present).
4. **Firestore Serialization:** Sanitize completed order documents with `toFirestoreDocument` immediately before transaction writes while preserving Firebase SDK values (`Timestamp`, `FieldValue`).

## Verification

- Run `npx tsx --test src/lib/*.test.ts`.
- Run `npm run typecheck` and `npm run lint`.
- Run `npx playwright test tests/sales-export.spec.ts`.
