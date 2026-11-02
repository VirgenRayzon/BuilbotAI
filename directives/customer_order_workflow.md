# Unified Order Workflow, Refunds & Reporting

## Goal

Manage modern e-commerce orders and legacy reservation records under one unified **Orders** workflow with separate payment, fulfillment, refund, and stock states.

## State Machine & Policy Rules

1. **Separate Orthogonal Axes (`src/lib/order-workflow.ts`):**
   - **Fulfillment:** `fulfillmentStage` (`order_placed` → `assembling_testing` [rigs only] → `out_for_delivery` → `delivered`) plus `status === 'cancelled'`. Legacy reservation records without `fulfillmentStage` or `paymentMethod` map seamlessly into unified stages and normalize missing `paymentMethod` to `'cod'`.
   - **Payment:** `paymentStatus` (`unpaid`, `pending`, `paid`, `failed`, `cancelled`) + chronological `paymentHistory`. Online orders must be `paid` before progressing fulfillment; COD/legacy orders must be `paid` before `delivered`. Reverting a `paid` status requires an audit reason (≥ 8 chars) and clears `paidAt`.
   - **Stock:** `stockState` (`reserved` | `restored` | `pending_return` | `restored_with_exceptions`) + `stockRestoredAt`. Cancellation of unshipped orders restores stock once-only via `prepareOrderStockRestore` / `applyOrderStockRestore`. Cancellation of dispatched orders sets `stockState: 'pending_return'` and requires physical verification. Archiving/restoring hides or restores queue visibility without altering stock.
   - **Refunds (`src/app/admin/order-refund-actions.ts`):** Managers and Super Admins issue refunds directly **without a Super Admin approval gate**, recording amount, destination (`original_payment_method`, `gcash`, `bank_transfer`, `cash`, `store_credit`), reference/proof, reason, actor + role, and status (`succeeded`, `pending`, `failed`), with `reconcileOrderRefundByStaff` for pending PayMongo refunds.
2. **Expiration Policy & Server Job:**
   - Only unpaid online orders (`gcash_simulated`, `paymongo_simulated`, `card_simulated`) still at `order_placed` auto-expire after 1 hour (`src/lib/order-expiration.ts`). COD and legacy reservations are exempt.
   - `/api/cron/expire-orders` (`CRON_SECRET` Bearer auth or staff token) runs cursor-paginated batches via `runExpiredOrdersSweep` with no 50-order cap.
3. **Customer Profile Queues (`src/lib/customer-order-workflow.ts`):**
   - **To Pay:** non-COD orders with pending, failed, or cancelled payment.
   - **To Ship / To Build / To Receive / Completed / Cancelled:** mutually exclusive lifecycle queues.
4. **Financial Reporting (`calculateOrderFinancialSummary` & `src/lib/export-excel.ts`):**
   - Always distinguish **Placed Order Value** (active non-cancelled orders), **Collected Payments** (gross paid orders), **Refunds Issued**, and **Net Sales** (collected minus refunds). Never count unpaid orders as collected revenue or net sales.

## Verification

1. `npx tsx --test src/lib/*.test.ts tests/order-*.ts`
2. `npm run typecheck`
3. `npm run lint`
4. `npx playwright test tests/sales-export.spec.ts`

When a persistent `next dev` process owns port 9002, never stop it and avoid running `npm run build` concurrently while browser verification is active against port 9002.

## Phase 2: Order classification and access

- Order actions use `getOrderActor` (`src/lib/server/order-auth.ts`): verify revoked tokens, then require current profile flags to match token claims. Mismatches must sign in again through System Access; never accept profile-only staff privileges. Managers and Super Admins retain fulfillment, payment, cancellation, refund, and archive/restore permissions.
- Order reads enforce matching claims/profile in Firestore rules. Direct client order writes remain forbidden. Rules must be deployed separately after emulator verification.
- Explicit `buildType`/known group tags take precedence over category heuristics and old order-level labels. Public single-part reservations now persist part/Additional metadata without a custom order label.
- `classifyOrder` exposes `requiresReview` for ambiguous legacy records. Existing legacy stage mappings and heuristics remain compatible pending the later reviewed-verification workflow. Existing parts orders already assembling can finish that stage.
- Permanent deletion, purge, sales reset, and dummy seeding require both Auth and Firestore emulators and a `demo-` project ID, plus their existing Super Admin permissions. Archive real orders to preserve embedded payment/refund history.
- No activity subcollections, migrations, assembly verification gates, or financial formula changes belong to Phase 2.

## Phases 3 and 4: Activity, retries, and fulfillment controls

- `writeOrderChange` commits each order snapshot/revision and its append-only `orders/{id}/activity` events together. Checkout, public reservations, payment outcomes/session updates, signed webhooks, staff stage/payment/cancellation, refunds/reconciliation, archive/restore and expiration use it. Do all transaction reads before this helper. Existing embedded ledgers and audit records remain intact.
- `workflowRevision` defaults to zero on old orders; new writes increment it. Fulfillment confirmations require an operation UUID and the revision shown when the dialog opened. `runOrderOperation` checks the durable operation result before checking the current revision, so lost-response retries cannot advance twice. Reusing a key for a different payload/account/revision fails.
- Staff payment, cancellation and archive adapters accept optional operation metadata for legacy caller compatibility. The current admin hook always sends it. Signed webhook delivery identities are deduplicated in the private workflow-operation collection. Existing checkout/refund operation stores remain authoritative for their respective financial actions.
- Retain client operation IDs after ambiguous failures, even if a listener sees a new revision; only clear on confirmed success or an explicitly reviewed fresh request. Refund replays validate actor, amount, destination, reason and payout details.
- The collapsed unified timeline merges legacy payment/refund arrays and old audit records without modifying them. New audit records carry `activityRecorded: true` to avoid duplicating the corresponding activity. New payment/refund events reference original ledger IDs for deduplication. Unknown legacy times/accounts stay labeled as unknown/legacy.
- Activity loads only on expansion in pages of 30 per source, with independent timestamp/document-ID cursors for new activity and legacy audits. All reads go through authenticated staff server actions; client activity writes and operation access are denied by rules. Deploy the `auditLogs` resourceId/createdAt index before enabling production history reads. The UI reports pending setup gracefully.
- Card and table stage controls share the same next-stage policy, reason text and confirmation dialog. A failed submission leaves the dialog open; a synchronous lock prevents double submission. Payment confirmation remains independent. Assembly verification gates belong to the later assembly phase.
- The stage URL controls the selected queue and sidebar navigation; absent stage means Order Placed in active Orders and All in archives. Filter selection updates the URL. Queue contents/counts update from committed snapshots, pagination clamps after records leave a page, and counts are explicitly labeled as loaded orders. Header controls wrap on mobile.

## Phase 5: COD receipt, corrections, and provider refund uncertainty

- COD collection requires an operation UUID, displayed workflow revision, and affirmative receipt of the exact order total. Keep fulfillment and stock unchanged. Card/table controls share the receipt dialog; disable escape/outside dismissal while submitting and use synchronous submission locks.
- Paid reversals remain record corrections, require the existing audit reason and operation metadata, and are blocked after delivery or any refund activity (including legacy pending operation locks). Preserve earlier payment/refund records. Link corrections and recollections to the relevant events; capture an honestly labeled legacy paid snapshot when no original payment event exists. Returning actual money uses Issue Refund.
- Cache retry identities per staff UID, order, and payload in session storage, retaining the original revision across reloads. Storage-denied browsers fall back to memory. Never create a fresh provider payout because a response was lost. The server remains the authority for replay/fingerprint and amount checks.
- A provider request that may have been sent stays on hold until a matching provider resource is retrieved. Missing provider IDs never automatically release a lock. Staff may supply the dashboard refund ID and an audit reason; retrieve the resource server-side and match payment ID, centavo amount, PHP currency, and the operation UUID stored in provider notes for new requests. Missing API configuration must fail before reserving an operation.
- Settle provider outcomes transactionally. A private `orderRefundReceipts/{providerRefundId}` record binds a provider resource to one order/operation. Verified success appends one refund and updates the existing financial totals; only a verified failure releases the hold without recording a monetary refund. Pending/processing outcomes retain the hold. Receipt records and operations deny all direct client access.
- Legacy operations without a request UUID in notes use payment/amount matching and the receipt registry; do not invent historical correlation. If no matching provider resource is available, keep the hold and resolve with provider support. Do not implement an unverified manual unlock or assume a timed-out POST failed.
- Deploy the matching server/UI contract together. An older COD caller without explicit receipt confirmation fails safely. Preserve payment history, refund operations, receipt registry, activity, and workflow revisions on rollback. No migration, new library, or assembly verification is included here.

## Phase 6: Custom Rig Verification & Server Dispatch Gate

- Explicit rig and component identities (`lineId` and `rigInstanceId`) are stamped at checkout/order-creation to prevent duplicate parts or multiple rig configurations from collapsing.
- Verification follows a 4-step sequence: Component Picking → Physical Assembly → Hardware Testing → Final QC.
- Modifying earlier steps invalidates downstream stages automatically.
- Server Actions enforce `assertCustomRigDispatchAllowed` before moving orders with custom rigs to `out_for_delivery` or `delivered`.
- Prebuilts, standalone parts, and historical delivered builds bypass this checklist without retroactive blocking.

## Phase 7: History Timeline, Dispatched Return Safeguards, and Final Polish

- Unified `OrderActivityTimeline` replaces redundant dual ledgers, integrating placed value, collected revenue, refunds, and net sales with a consolidated reverse-chronological event timeline.
- Unshipped cancellations automatically restore warehouse stock once-only. Dispatched cancellations transition to `stockState: 'pending_return'`, requiring explicit staff verification via `confirmOrderPhysicalStockReturn`.
- Missing catalog items during stock restoration are recorded as exceptions rather than failing transactions.
- Order IDs are wrapped in accessible `CopyableOrderId` buttons across both card and table views.
