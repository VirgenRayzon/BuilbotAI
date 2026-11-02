# Admin Order Management — Phases 6 & 7

## Delivered Behavior

### Phase 6 — Custom Rig Verification & Server-Side Dispatch Gating
- **Rig & Line Identity Preservation:** Added deterministic `lineId` and `rigInstanceId` across checkout and order grouping. Multi-rig configurations no longer collapse into a single group, maintaining isolated line identity even for duplicate components.
- **Verification Workflow:** Added a dedicated 4-step checklist: Component Picking → Physical Assembly → Hardware Testing → Final Quality Control (QC).
  - Collapsible picking sub-list tracks component-level checkboxes.
  - Assembly tracks technician identity and assembly completion notes.
  - Testing tracks benchmark status (MemTest86, Cinebench, 3DMark) and pass/fail state.
  - QC requires Manager or Super Admin role review.
- **Strict Downstream Invalidation:** Modifying or un-checking an earlier step (e.g. marking a component unpicked or defective) automatically invalidates and resets all downstream steps (`assembly`, `testing`, `qc`), ensuring incomplete builds cannot pass.
- **Server Dispatch Gating:** `updateOrderFulfillmentStageByStaff` asserts `assertCustomRigDispatchAllowed` before advancing an order to `out_for_delivery` or `delivered`. Every custom rig in the order must pass verification.
- **Exemptions & Backward Compatibility:** Standalone parts, prebuilts, and historical delivered orders are strictly exempted from the custom rig gate. Delivered orders show "Verification not recorded" rather than fabricated checks.

### Phase 7 — Unified Activity Timeline, Return Safeguards & UI Polish
- **Unified Activity Timeline:** Replaced duplicated and separate payment/refund history tables with a shared `OrderActivityTimeline` embedded cleanly into order cards and the details modal.
  - Preserves financial breakdown (Placed Value, Total Collected, Total Refunds, Net Sales).
  - Merges payments, refunds, and Firestore audit logs in reverse-chronological order without double counting.
  - Labels legacy inferred records clearly and links payment corrections.
- **Physical Return Safeguards on Cancellation:**
  - Cancelling an unshipped order (`order_placed` or `assembling_testing`) triggers automatic once-only inventory stock restoration.
  - Cancelling a dispatched order (`out_for_delivery` or `delivered`) sets `stockState: 'pending_return'` and `physicalReturnRequired: true`. Warehouse stock is not restocked until staff physically confirms returned items.
  - Staff uses the **Confirm Physical Return** action to verify and restock goods, logging staff identity, timestamp, and optional return inspection notes.
  - Missing catalog documents in inventory are safely caught and recorded in `stockExceptions` rather than failing the transaction or silently claiming restored stock.
- **Accessible Copyable Order IDs:** Replaced plain order IDs with an accessible `CopyableOrderId` component providing clipboard copy feedback across cards and tables.

## Additive Data Schema Changes

| Field / Location | Type | Purpose |
| --- | --- | --- |
| `OrderItem.lineId` | `string` (optional) | Unique line identity preventing duplicate component collapse |
| `OrderItem.rigInstanceId` | `string` (optional) | Distinct rig instance identity for multi-rig orders |
| `Order.assemblyVerificationPassed` | `boolean` (optional) | Cached order-level gate status |
| `Order.legacyAssemblyReviewed` | `boolean` (optional) | Audit flag for legacy orders reviewed by staff |
| `Order.physicalReturnRequired` | `boolean` (optional) | Indicates returned goods are pending receipt |
| `Order.physicalReturnConfirmedAt` | `Timestamp` (optional) | Server timestamp of physical stock return confirmation |
| `Order.physicalReturnConfirmedBy` | `string` (optional) | UID of staff member who confirmed return |
| `Order.stockExceptions` | `Array<{ path: string; quantity: number }>` | Missing inventory documents logged during restoration |
| `orders/{id}/assembly/{rigId}` | `RigVerificationRecord` | Subcollection storing rig picking, assembly, testing, and QC snapshots |
| `orders/{id}/activity/{eventId}` | `OrderActivity` | Server-written append-only order activity ledger |

## Verification Results

| Suite | Status | Details |
| --- | --- | --- |
| TypeScript | Passed | `npm run typecheck -- --incremental false` (0 errors) |
| ESLint | Passed | `npm run lint` (0 warnings, 0 errors) |
| Unit Test Suite | Passed | 118 tests passed, 0 failed (`src/lib/*.test.ts`, `tests/order-phase2.test.ts`, `tests/order-management.integration.ts`) |
| Integration Verification | Passed | Custom rig dispatch gating, multi-rig enforcement, downstream invalidation, dispatched cancellation stock return, and timeline unification all verified |

## Files Modified / Created

- `src/lib/types.ts`: Extended `Order`, `OrderItem`, and `OrderStockState`.
- `src/lib/order-assembly.ts` & `src/lib/order-assembly.test.ts`: Custom rig extraction, verification initialization, step invalidation, and dispatch gating.
- `src/lib/order-item-groups.ts`: Rig instance separation in item groups.
- `src/lib/order-activity.ts`: Activity merging and proof URL support.
- `src/app/checkout-actions.ts`: Added deterministic line/rig ID assignment, dispatch gate assertion, dispatched cancellation status handling, and `confirmOrderPhysicalStockReturn`.
- `src/lib/server/order-expiration-sweep.ts`: Recorded stock restoration exceptions.
- `src/app/admin/order-assembly-actions.ts`: Server actions for step updates and retrieval.
- `src/app/admin/hooks/use-order-assembly.ts`: Client hook for managing assembly checklist state.
- `src/app/admin/components/orders/order-assembly-verification.tsx`: Interactive verification checklist UI.
- `src/app/admin/components/orders/copyable-order-id.tsx`: Accessible copyable order ID component.
- `src/app/admin/components/orders/order-activity-timeline.tsx`: Shared unified timeline with financial summary.
- `src/app/admin/components/orders/order-card-history-ledgers.tsx` & `order-history-ledgers.tsx`: Consolidated wrappers around `OrderActivityTimeline`.
- `src/app/admin/components/orders/order-card.tsx` & `orders-table.tsx`: Wired `CopyableOrderId` and `onConfirmStockReturn`.
- `src/app/admin/components/orders/order-card-controls.tsx`: Added `Confirm Physical Return` action button.
- `src/app/admin/components/orders/order-action-modals.tsx`: Added `OrderPhysicalReturnModal`.
- `src/app/admin/components/orders/orders-tab.tsx`: Wired physical return modal and state.
- `src/app/admin/hooks/use-orders.ts` & `src/app/admin/page.tsx`: Wired `handleConfirmStockReturn`.
- `tests/order-management.integration.ts`: Comprehensive integration test suite.
