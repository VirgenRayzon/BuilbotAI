# Admin Order Management — Phase 5

## Delivered behavior

- COD payment controls show Uncollected/Collected independently of fulfillment. Both cards and tables open the existing styled dialog through **Record Cash Collection**. The dialog shows the exact order total and requires an affirmative receipt acknowledgment; the server validates acknowledgment, amount, revision, and operation identity.
- Paid COD records expose **Payment actions → Correct erroneous collection record**. Existing Manager/Super Admin authorization and correction limits remain: an audit reason is mandatory; delivered orders and orders with refunds or a pending refund operation cannot be reversed. Corrections preserve original events, append a linked event, and clear `paidAt`. Recollection links back to the correction. Legacy paid orders without a paid event retain a labeled historical snapshot with the available original timestamp; missing actor/time information is not invented.
- Payment and refund retry keys are scoped to staff UID, order, and payload and persist for the browser session. The original workflow revision is retained across reloads. Denied session storage falls back to memory. Replaying an old collection after correction cannot collect again. Submission locks protect the receipt and provider verification dialogs; backend transactions remain authoritative.
- A lost or invalid PayMongo response keeps the refund operation pending. Retrying the same request never sends another payout. Missing configuration fails before reserving a provider operation. A missing provider refund ID no longer clears the hold.
- **Verify Pending Refund** retrieves a known provider reference. When the reference was lost, progressive disclosure requests the dashboard refund ID and an audit reason. Server verification checks resource identity, original payment ID, exact centavo amount, PHP currency, and the operation UUID in notes for newly initiated refunds. Pending/processing outcomes retain the hold. A verified successful result appends one refund and updates existing totals; a verified failed result releases its own hold without adding a refund amount.
- A private provider receipt registry prevents a refund resource from settling another operation. Reconciliation records the acting staff account, timestamp, provider identity/result, and supplied reason in order activity. Refund ledger identity remains that of the original initiator.
- Existing embedded payment/refund ledgers, stock reservation/release behavior, fulfillment state, financial formulas, custom-rig/additional-item accordions, and dark theme are retained. Notification code was extracted without changing its behavior. No new library or bulk migration was introduced. Phase 6 assembly verification was not started.

## Additive data and security changes

| Location | Change | Legacy behavior |
| --- | --- | --- |
| `orders.paymentHistory[]` | Optional `kind` and `relatedEventId`; operation UUID is the event identity for new staff updates | Old events remain readable and unchanged; a missing paid event is captured only when correcting a legacy paid order |
| `orderRefundOperations` | New provider operations store `paymentId` and `providerRequestKey`; reconciliation stores verified outcome/reference/actor/reason | Old operations use existing payment reference and amount matching; no fabricated correlation token |
| `orderRefundReceipts/{providerRefundId}` | Server-only binding to order, operation, payment, centavo amount, provider status, update time | Created during verified reconciliation; no backfill |
| `orders/{id}/activity` | Linked payment/correction details and verified provider reconciliation details | Reuses append-only activity architecture and existing historical fallback |
| Browser session storage | Staff/order/payload-scoped retry operation and original revision | Memory fallback if storage is unavailable; no credential/token storage |

Direct client access to the receipt registry is explicitly denied. Existing token/profile role verification and order-write restrictions remain in force. No new query index is required for Phase 5.

## Acceptance and verification

| Acceptance criterion | Result |
| --- | --- |
| COD paid transition requires exact receipt acknowledgment | Unit/action and emulator checks pass for missing/mismatched confirmation and valid collection |
| Repeated/concurrent collection is recorded once | Emulator replay/concurrency checks pass; original event remains after correction |
| Corrections require reason, retain history, and respect delivery/refund restrictions | Policy/action regressions and emulator checks pass, including legacy pending locks |
| Refund retries cannot duplicate provider payouts | Mocked lost-response test sends one POST across retries; another operation is rejected while pending |
| Missing provider identity never unlocks an uncertain result | Emulator verifies pending hold and `requiresReference`; configuration failure creates no operation or hold |
| Reconciliation cannot attach incorrect or previously used provider resources | Payment/amount/request-token mismatch, concurrent settlement, receipt reuse, and private receipt access tests pass |
| Verified failure releases only its own hold without increasing refunded amount | Emulator check passes |
| Financial, fulfillment, inventory, role, and export regressions pass | Relevant regression suites pass; live order remains unpaid, assembling, stock reserved, and net collected zero |

- **49 targeted unit/action tests passed**, zero failures. Includes payment/cache tests, activity/classification/permissions/workflow/grouping/fulfillment/payment/expiration/customer-queue regressions, and `tests/order-phase2.test.ts`.
- **21 Firebase demo-emulator integration tests passed**, zero failures. Provider HTTP calls were mocked. Expected permission-denial messages and Next cache invalidation warnings occur in this standalone test environment.
- **2 Playwright sales-export regressions passed** (`tests/sales-export.spec.ts`).
- **TypeScript passed** (`npm run typecheck -- --incremental false`). **Lint passed** with no ESLint warnings/errors. Next emits its existing `next lint` deprecation notice.
- **Isolated production build passed** (`QR_INVENTORY_TEST=true npm run build`). This uses the existing isolated build setup; separate type/lint checks above are required because the repository build configuration skips them.
- **Live UI verification:** the initial browser connection error was resolved by reconnecting. Under the Manager test account on port 9002, opened the cash collection dialog, inspected exact amount/acknowledgment and dark-theme layout, cancelled, checked the table shares the new collection control, and restored the original card view/assembling queue. No live payment, refund, stage, or inventory mutation was submitted. Paid-correction and missing-provider-ID dialogs were not exercised against live orders; server behavior is covered by emulator tests. No new Phase 5 mobile/light-theme visual pass was performed.

## Deployment, remaining dependencies, and rollback

- **Not deployed:** Firebase rules, prior-phase activity index, and application release. Deploy/wait for the prior `auditLogs` index and deploy matching rules/server/UI before production use. The persistent development server on port 9002 was left running.
- Deploy the payment UI/server contract together: new COD collection and paid reversal calls require operation metadata; COD collection also requires explicit cash confirmation. An old caller without it fails safely. Rolling back only the UI can make those old controls unusable; keep the new adapter or disable affected controls.
- Keep provider refund safety logic on any rollback. Disable new payout initiation if necessary, preserve holds, and reconcile existing requests with verified provider resources. Never remove operation/receipt records, strip historical events/revisions, or restore the old missing-ID auto-unlock behavior.
- A provider request can be interrupted between local reservation and receipt of its response. When no matching provider resource can be found, the outcome stays on hold and requires provider/support investigation. An unverified manual unlock or automatic resend is intentionally unavailable.
- Legacy pending operations have no new request token to verify retroactively. They use the stored payment reference, exact amount, receipt uniqueness, and staff audit reason; review ambiguous same-payment/same-amount legacy resources carefully.
- Session storage is session-scoped and browser-controlled. If it is cleared or denied, durable server operation/receipt validation still applies; a pending provider lock still prevents a new payout.
- Phase 6 assembly verification and subsequent stock/physical-return exception work remain separate. No unfinished Phase 5 code dependency was introduced; production deployment and the visual coverage limits above remain outstanding.

Provider resource validation follows the official [PayMongo refund resource](https://docs.paymongo.com/reference/refund-resource), [create refund](https://docs.paymongo.com/reference/create-a-refund), and [retrieve refund](https://docs.paymongo.com/reference/retrieve-a-refund) contracts.

## Files changed for Phase 5

This list identifies Phase 5 edits in a workspace that already contains prior-phase and unrelated changes. It does not claim ownership of all current Git changes.

- [firestore.rules](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/firestore.rules>)
- [src/lib/types.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/lib/types.ts>)
- [src/lib/order-payment.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/lib/order-payment.ts>)
- [src/lib/order-payment.test.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/lib/order-payment.test.ts>)
- [src/lib/order-operation-cache.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/lib/order-operation-cache.ts>)
- [src/lib/order-operation-cache.test.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/lib/order-operation-cache.test.ts>)
- [src/lib/order-workflow.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/lib/order-workflow.ts>)
- [src/lib/payment-methods.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/lib/payment-methods.ts>)
- [src/lib/payment-methods.test.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/lib/payment-methods.test.ts>)
- [src/lib/order-activity.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/lib/order-activity.ts>)
- [src/lib/server/order-activity.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/lib/server/order-activity.ts>)
- [src/lib/server/paymongo.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/lib/server/paymongo.ts>)
- [src/lib/server/order-refund-reconciliation.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/lib/server/order-refund-reconciliation.ts>)
- [src/lib/server/order-refund-notifications.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/lib/server/order-refund-notifications.ts>)
- [src/app/checkout-actions.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/checkout-actions.ts>)
- [src/app/admin/order-refund-actions.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/order-refund-actions.ts>)
- [src/app/admin/hooks/use-orders.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/hooks/use-orders.ts>)
- [src/app/admin/hooks/use-payment-status-dialog.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/hooks/use-payment-status-dialog.ts>)
- [src/app/admin/hooks/use-refund-reconciliation.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/hooks/use-refund-reconciliation.ts>)
- [src/app/admin/components/order-payment-status-dialog.tsx](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/components/order-payment-status-dialog.tsx>)
- [src/app/admin/components/orders/order-payment-control.tsx](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/components/orders/order-payment-control.tsx>)
- [src/app/admin/components/orders/refund-reconcile-control.tsx](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/components/orders/refund-reconcile-control.tsx>)
- [src/app/admin/components/orders/order-payment-dialogs.tsx](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/components/orders/order-payment-dialogs.tsx>)
- [src/app/admin/components/orders/order-card-controls.tsx](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/components/orders/order-card-controls.tsx>)
- [src/app/admin/components/orders/orders-table.tsx](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/components/orders/orders-table.tsx>)
- [src/app/admin/components/orders/orders-tab.tsx](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/components/orders/orders-tab.tsx>)
- [src/app/admin/components/orders/order-card.tsx](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/components/orders/order-card.tsx>)
- [src/app/admin/components/orders/order-history-modal.tsx](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/components/orders/order-history-modal.tsx>)
- [src/app/admin/components/orders/order-card-history-ledgers.tsx](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/components/orders/order-card-history-ledgers.tsx>)
- [src/app/admin/components/orders/order-history-ledgers.tsx](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/components/orders/order-history-ledgers.tsx>)
- [tests/order-phase2.test.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/tests/order-phase2.test.ts>)
- [tests/qr-inventory.integration.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/tests/qr-inventory.integration.ts>)
- [directives/customer_order_workflow.md](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/directives/customer_order_workflow.md>)
- [docs/admin-order-phase-5.md](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/docs/admin-order-phase-5.md>)
