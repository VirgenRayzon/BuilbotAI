# Admin Order Management — Phases 3 and 4

## Implemented behavior

- Atomic append-only activity records accompany order creation, stage changes, payment outcomes/sessions, signed webhooks, cancellations/expiration, refunds and reconciliation, archive/restore, and relevant inventory reservation/release operations.
- Existing payment/refund arrays, audit records, pricing, financial summaries, and physical stock reservation/restoration calculations are retained.
- New order writes advance `workflowRevision`; absent legacy revisions start at zero. The private operation store retains request fingerprints and results. Stage confirmations require a UUID and the displayed revision. Retries look up the committed result before checking the current revision; changed payloads/accounts/revisions cannot reuse a key.
- Current staff payment/cancellation/archive callers send operation metadata; legacy adapters can omit it while retaining existing state validation. Existing checkout/refund idempotency stores are reused. Refund payloads are validated on replay. Webhooks deduplicate provider delivery identity.
- The collapsed timeline loads paginated new activity plus existing legacy audits, merging original payment/refund IDs without rewriting historical records. Existing detailed ledgers remain under progressive disclosure. Legacy/unknown actors and timestamps are labeled honestly.
- Card and table share next-stage actions, prerequisites, and a confirmation dialog. Failed submissions keep the dialog open; synchronous locks and durable operation IDs protect retries. Current fulfillment/payment/financial semantics remain independent.
- URL filters and sidebar queues share the stage parameter, with active Orders defaulting to Order Placed. Committed listeners update membership/counts; pagination clamps when records move. Counts are labeled as loaded records. Order actions wrap on mobile; existing rig/additional accordions and financial layout remain.

## Verification

- 45 targeted unit/action tests passed.
- Full demo-emulator suite: 19 tests passed, including duplicate/stale/concurrent stage operations, payment/refund replay, cancellation stock once-only, denied client activity/operation writes, and multi-page legacy history.
- Sales export regression: 2 Playwright tests passed.
- TypeScript and lint passed; isolated production build passed.
- Live browser verification used the configured Manager test account. Checked card/table actions, opened and cancelled a stage confirmation, checked mobile width 390, and verified filter changes update the URL. Original assembling queue and normal viewport restored. No live fulfillment/payment/refund/inventory mutation was submitted.
- Expected denial logs and Next cache invalidation warnings occur in standalone emulator tests outside a Next request. An initial emulator run hit unrelated catalog fixture transaction contention; rerun passed.

## Deployment dependencies and limits

- Rules and the new `auditLogs` resourceId/createdAt composite index are prepared but not deployed. Deploy indexes and wait for readiness, then deploy rules and the matching application release. The UI gracefully explains missing index setup and retains embedded ledger access.
- Deploy the server and UI contract together: stage actions now require operation metadata. An old UI rollback must preserve that envelope or disable stage mutation controls. Do not remove server validation or erase committed activity/operation records.
- No bulk data migration and no new libraries. Existing orders remain readable; activity begins on new mutations. Old audit records may lack timestamps/accounts and are not fabricated.
- COD correction UX and uncertain provider-refund reconciliation remain in Phase 5; assembly verification in Phase 6; physical-return/stock exception handling in Phase 7. No later phase is implemented here.
- The existing persistent dev server on port 9002 remains running.

## Files changed in this implementation

- [firestore.rules](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/firestore.rules>)
- [firestore.indexes.json](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/firestore.indexes.json>)
- [src/lib/types.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/lib/types.ts>)
- [src/lib/order-activity.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/lib/order-activity.ts>)
- [src/lib/order-activity.test.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/lib/order-activity.test.ts>)
- [src/lib/order-workflow.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/lib/order-workflow.ts>)
- [src/lib/order-workflow.test.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/lib/order-workflow.test.ts>)
- [src/lib/server/order-activity.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/lib/server/order-activity.ts>)
- [src/lib/server/order-operations.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/lib/server/order-operations.ts>)
- [src/lib/server/order-payment-session.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/lib/server/order-payment-session.ts>)
- [src/lib/server/order-expiration-sweep.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/lib/server/order-expiration-sweep.ts>)
- [src/app/checkout-actions.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/checkout-actions.ts>)
- [src/app/public-product-actions.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/public-product-actions.ts>)
- [src/app/api/webhooks/paymongo/route.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/api/webhooks/paymongo/route.ts>)
- [src/app/admin/order-activity-actions.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/order-activity-actions.ts>)
- [src/app/admin/order-refund-actions.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/order-refund-actions.ts>)
- [src/app/admin/reservation-actions.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/reservation-actions.ts>)
- [src/app/admin/hooks/use-orders.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/hooks/use-orders.ts>)
- [src/app/admin/hooks/use-orders-view.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/hooks/use-orders-view.ts>)
- [src/app/admin/hooks/use-order-actions.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/hooks/use-order-actions.ts>)
- [src/app/admin/hooks/use-order-activity.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/hooks/use-order-activity.ts>)
- [src/app/admin/components/admin-tab-header.tsx](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/components/admin-tab-header.tsx>)
- [src/app/admin/components/archive-tab.tsx](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/components/archive-tab.tsx>)
- [src/app/admin/components/orders/order-card.tsx](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/components/orders/order-card.tsx>)
- [src/app/admin/components/orders/order-card-controls.tsx](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/components/orders/order-card-controls.tsx>)
- [src/app/admin/components/orders/orders-table.tsx](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/components/orders/orders-table.tsx>)
- [src/app/admin/components/orders/orders-tab.tsx](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/components/orders/orders-tab.tsx>)
- [src/app/admin/components/orders/orders-header-bar.tsx](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/components/orders/orders-header-bar.tsx>)
- [src/app/admin/components/orders/order-card-history-ledgers.tsx](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/components/orders/order-card-history-ledgers.tsx>)
- [src/app/admin/components/orders/order-history-ledgers.tsx](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/components/orders/order-history-ledgers.tsx>)
- [src/app/admin/components/orders/order-activity-timeline.tsx](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/components/orders/order-activity-timeline.tsx>)
- [src/app/admin/components/orders/order-stage-control.tsx](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/components/orders/order-stage-control.tsx>)
- [src/app/admin/components/orders/order-stage-dialog.tsx](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/components/orders/order-stage-dialog.tsx>)
- [src/app/admin/components/orders/order-payment-dialogs.tsx](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/src/app/admin/components/orders/order-payment-dialogs.tsx>)
- [tests/order-phase2.test.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/tests/order-phase2.test.ts>)
- [tests/qr-inventory.integration.ts](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/tests/qr-inventory.integration.ts>)
- [directives/customer_order_workflow.md](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/directives/customer_order_workflow.md>)
- [docs/admin-order-phases-3-4.md](<C:/Users/Rayzon/Anti Gravity/BuilbotAI/docs/admin-order-phases-3-4.md>)
