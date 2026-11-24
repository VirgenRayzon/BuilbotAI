# BuildbotAI Database Scalability & Multi-Instance Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scale BuildbotAI's Cloud Firestore read/write paths, caches, background sweeps, and retention policies for 1,000–5,000 parts and 10,000+ orders while preparing Firebase App Hosting to safely run beyond `maxInstances: 1`.

**Architecture:** Introduce a shared `siteSettings/catalogMeta` version/facets document to synchronize server caches and AI caches across App Hosting instances, tokenize catalog search so admin/public search stays paginated, decouple admin Orders pagination from pre-aggregated `analyticsDaily`/`analyticsMonthly` Sales rollups, denormalize prebuilt component summaries, index `holdExpiresAt` for expired-order sweeps while decoupling `popularity` from stock transactions, configure native Firestore TTLs (`fieldOverrides`), and retire legacy collection fallbacks and permissive rules.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript strict mode, Zod, Firebase Client & Admin SDKs, Cloud Firestore (`firestore.indexes.json`, `firestore.rules`), Firebase App Hosting (`apphosting.yaml`), `node:test` (`npx tsx --test`), Playwright.

**Spec:** [`docs/database_scalability_plan.md`](../../database_scalability_plan.md) (Updated 11 November 2026) and [`docs/inventory_scaling_rollout_2026-11-06.md`](../../inventory_scaling_rollout_2026-11-06.md).

## Global Constraints

- Treat the dev server on port `9002` as user-owned and persistent; use isolated test commands or Firestore emulators without terminating an existing port `9002` process.
- Maintain TypeScript strict mode with zero `any`; validate all new server action and route payloads with `zod`.
- Keep UI components under 300 lines and keep Firestore queries, mutations, and business logic inside custom hooks (`src/hooks/`, `src/app/*/hooks/`) or `src/lib/server/`.
- Preserve transactional live-stock and authoritative price validation in `createCheckoutOrder` and `reservePublicProduct`; preserve Philippine Peso pricing (`Price (PHP) = Price (USD) * 60`).
- Never configure automatic TTL deletion on `orders`, `orders/{orderId}/activity`, or financial refund records.
- Every schema backfill must ship as a dry-run-first, resumable script under `execution/` and require a verified Cloud Storage backup before live writes.
- After modifying any files or imports, run `npm run typecheck` and `npm run lint` and confirm zero errors.
- All commands must be PowerShell-compatible (`npx tsx --test ...`).

## Review Focus

1. **Multi-instance cache convergence (`Task 2`, `Task 3`):** When Instance A commits a part edit or checkout stock change that bumps `siteSettings/catalogMeta.catalogVersion` without touching Instance B's memory, Instance B's warm `builder-catalog`, `inventory-fetcher`, and `public-products` caches must detect the newer `catalogVersion` and reload fresh data.
2. **Sales rollup idempotency under retries (`Task 5`):** Calling `applyOrderAnalyticsDelta` twice for the same `operationId`/event (payment confirmation, partial refund, cancellation) must never double-count revenue, order counts, or component units in `analyticsDaily` or `analyticsMonthly`.
3. **Multi-word & SKU search pagination parity (`Task 2`):** Tokenized queries for multi-word terms (e.g., `"rtx 4070 super"` or `"CORSAIR-RM850"`) combined with brand or availability filters must match items beyond page 1 without falling back to the 12-collection `useInventoryParts` listener.
4. **Mixed-schema expiration sweeps (`Task 7`):** `runExpiredOrdersSweep` must still expire older unpaid online orders lacking `holdExpiresAt` during the transition period while never modifying `paymentMethod === 'cod'` pending orders.
5. **Prebuilt summary drift vs. checkout truth (`Task 6`):** Updating or archiving a part must refresh `componentSummaries` on affected `prebuiltSystems` documents, and `reservePublicProduct`/`createCheckoutOrder` must still reject out-of-stock or archived components even if a summary card appears stale.

---

## File Structure Overview

- **Phase 1 (Catalog Meta, Cache Coherence & Search):** Create `src/lib/catalog-meta.ts`, `src/lib/server/catalog-cache.ts`, `src/lib/server/catalog-meta-store.ts`, `tests/multi-instance-cache-coherence.test.ts`; modify `src/lib/inventory-query-fields.ts`, `src/lib/admin-inventory-query.ts`, `src/lib/server/admin-inventory-queries.ts`, `src/lib/server/public-catalog-queries.ts`, `src/lib/server/builder-catalog.ts`, `src/lib/server/public-products.ts`, `src/lib/inventory-fetcher.ts`, `src/app/product-actions.ts`, `src/app/checkout-actions.ts`, `src/app/actions.ts`, `src/app/admin/hooks/use-inventory-page.ts`, `src/app/admin/page.tsx`, `execution/backfill_inventory_query_fields.ts`, `firestore.indexes.json`, `apphosting.yaml`.
- **Phase 2 (Orders Pagination & Sales Rollups):** Create `src/lib/analytics-rollups.ts`, `src/lib/server/admin-order-queries.ts`, `src/lib/server/sales-analytics-queries.ts`, `src/app/admin/order-query-actions.ts`, `src/app/api/admin/sales-export/route.ts`, `execution/backfill_sales_analytics.ts`; modify `src/app/admin/hooks/use-orders.ts`, `src/app/admin/hooks/use-orders-view.ts`, `src/app/admin/components/orders/orders-tab.tsx`, `src/app/admin/hooks/use-sales-actions.ts`, `src/components/sales-analytics.tsx`, `src/app/admin/page.tsx`, `src/app/checkout-actions.ts`, `src/app/admin/order-refund-actions.ts`, `src/app/admin/sales-admin-actions.ts`, `firestore.indexes.json`.
- **Phase 3 (Prebuilt Summaries, Hold Expiry & Contention):** Create `src/lib/prebuilt-summaries.ts`, `src/lib/server/prebuilt-queries.ts`, `src/lib/server/popularity-writer.ts`, `execution/backfill_prebuilt_summaries.ts`, `execution/backfill_order_hold_expiry.ts`; modify `src/app/pre-builts/page.tsx`, `src/app/pre-builts/[id]/hooks/use-prebuilt-details.ts`, `src/lib/server/public-products.ts`, `src/app/admin/hooks/use-inventory.ts`, `src/firebase/database.ts`, `src/lib/order-expiration.ts`, `src/lib/server/order-expiration-sweep.ts`, `src/app/checkout-actions.ts`, `firestore.indexes.json`.
- **Phase 4 (TTL Policies & Paginated Logs/Notifications):** Create `src/lib/ttl-policies.ts`, `src/lib/server/audit-log-queries.ts`; modify `src/ai/flows/ai-build-critique.ts`, `src/ai/flows/ai-build-advisor-recommendations.ts`, `src/app/api/ai/build-advisor/recommendations/route.ts`, `src/lib/server/order-operations.ts`, `src/lib/server/order-expiration-sweep.ts`, `src/firebase/database.ts`, `src/firebase/audit.ts`, `src/app/profile/hooks/use-audit-logs.ts`, `src/app/profile/hooks/use-user-audit-logs.ts`, `src/app/profile/components/audit-logs-section.tsx`, `src/app/profile/components/user-audit-logs-section.tsx`, `firestore.indexes.json`.
- **Phase 5 (Legacy Retirement & Rules/API Hardening):** Create `src/lib/server/ai-route-auth.ts`, `execution/verify_legacy_path_retirement.ts`; modify `firestore.rules`, `src/app/api/chat/route.ts`, `src/app/api/ai/build-advisor/recommendations/route.ts`, `src/app/pre-builts/[id]/hooks/use-prebuilt-details.ts`, `src/lib/server/public-products.ts`, `src/app/checkout-actions.ts`.

---

## Phase 1: Versioned Catalog Read-Model, Cache Coherence & Search Scaling

### Task 1: Catalog Metadata Singleton & Normalized Search Tokens

**Files:**
- Create: `src/lib/catalog-meta.ts`
- Create: `src/lib/catalog-meta.test.ts`
- Create: `src/lib/server/catalog-meta-store.ts`
- Modify: `src/lib/inventory-query-fields.ts:1-47`
- Modify: `src/app/product-actions.ts:23-88`
- Modify: `src/app/checkout-actions.ts:710-729`
- Modify: `execution/backfill_inventory_query_fields.ts`
- Test: `src/lib/catalog-meta.test.ts`, `src/lib/inventory-query-fields.test.ts`

**Interfaces:**
- Produces:
  - `CatalogMetaSchema` & `CatalogMeta` (`catalogVersion: number`, `updatedAt: number`, `brandsByCategory: Record<string, string[]>`, `activeCountsByCategory: Record<string, number>`) in `src/lib/catalog-meta.ts`
  - `deriveSearchTokens(source: { name?: unknown; brand?: unknown; sku?: unknown; productId?: unknown }): string[]` in `src/lib/catalog-meta.ts`
  - `getCatalogMeta(db?: FirebaseFirestore.Firestore): Promise<CatalogMeta>` and `bumpCatalogMetaVersion(db: FirebaseFirestore.Firestore, options?: { refreshFacets?: boolean }): Promise<number>` in `src/lib/server/catalog-meta-store.ts`

- [ ] **Step 1: Write failing tests for token generation and `CatalogMeta` validation**

Create `src/lib/catalog-meta.test.ts` asserting `deriveSearchTokens({ name: 'NVIDIA RTX 4070 Super', brand: 'ASUS', sku: 'ASUS-4070S', productId: 'PRD-100042' })` emits normalized lowercase word and prefix tokens (`'rtx'`, `'4070'`, `'4070s'`, `'super'`, `'asus'`, `'prd100042'`, `'prd-100042'`) bounded under 40 entries, and `CatalogMetaSchema.parse(...)` validates version and facet maps while rejecting negative versions. Extend `src/lib/inventory-query-fields.test.ts` to assert `deriveInventoryQueryFields` bumps `inventoryQueryVersion: 2` and outputs `searchKeywords`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx tsx --test src/lib/catalog-meta.test.ts src/lib/inventory-query-fields.test.ts`
Expected: FAIL (`Cannot find module './catalog-meta'` and `inventoryQueryVersion` assertion mismatch).

- [ ] **Step 3: Implement `src/lib/catalog-meta.ts`, `src/lib/server/catalog-meta-store.ts`, and update writers**

Implement `deriveSearchTokens` (splitting alphanumeric segments, deduplicating exact tokens + 3–6 char prefixes for partial SKU/model matches, capped at 40 tokens), `CatalogMetaSchema`, and `siteSettings/catalogMeta` atomic increment (`FieldValue.increment(1)`) + optional facet recalculation in `catalog-meta-store.ts`. Update `deriveInventoryQueryFields` to include `searchKeywords: deriveSearchTokens(source)` and `inventoryQueryVersion: 2`, wire `bumpCatalogMetaVersion` into `createCatalogProduct`, `updateCatalogPart`, `createCheckoutOrder`, `updateReservationStatus`, `confirmOrderPhysicalStockReturn`, and `execution/backfill_inventory_query_fields.ts` (preserving `--dry-run` default).

- [ ] **Step 4: Run tests, typecheck, and lint**

Run: `npx tsx --test src/lib/catalog-meta.test.ts src/lib/inventory-query-fields.test.ts && npm run typecheck && npm run lint`
Expected: All assertions PASS; zero TypeScript or ESLint errors.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/catalog-meta.ts src/lib/catalog-meta.test.ts src/lib/server/catalog-meta-store.ts src/lib/inventory-query-fields.ts src/lib/inventory-query-fields.test.ts src/app/product-actions.ts src/app/checkout-actions.ts execution/backfill_inventory_query_fields.ts
git commit -m "feat(db): add catalogMeta version counter and normalized searchKeywords v2"
```

---

### Task 2: Cross-Instance Cache Coherence & Bounded Search/Builder Queries

**Files:**
- Create: `src/lib/server/catalog-cache.ts`
- Create: `src/lib/server/catalog-cache.test.ts`
- Modify: `src/lib/admin-inventory-query.ts:1-21`
- Modify: `src/lib/server/admin-inventory-queries.ts:1-68`
- Modify: `src/lib/server/public-catalog-queries.ts:1-43`
- Modify: `src/lib/server/builder-catalog.ts:1-70`
- Modify: `src/lib/server/public-products.ts:130-174`
- Modify: `src/lib/inventory-fetcher.ts:1-120`
- Modify: `src/app/actions.ts:218-224`
- Modify: `src/app/admin/page.tsx:51-87`
- Modify: `firestore.indexes.json`
- Test: `src/lib/server/catalog-cache.test.ts`, `src/lib/admin-inventory-query.test.ts`

**Interfaces:**
- Consumes: `getCatalogMeta()`, `bumpCatalogMetaVersion()`, `deriveSearchTokens()`
- Produces:
  - `VersionedServerCache<T>` in `src/lib/server/catalog-cache.ts` with `getOrLoad(loader: () => Promise<T>, readVersion: () => Promise<number>): Promise<T>` and `invalidateLocal()`
  - Updated `listAdminInventoryPage(idToken, rawOptions)` supporting tokenized `searchKeywords` (`array-contains`), `brandSort`, and `inStock` filters without throwing `'Use the complete inventory view for these filters'`
  - Updated `listPublicCatalogPage(rawOptions)` accepting `{ cursor, category?, brand?, inStockOnly?, search?, sortBy? }` bounded by Firestore indexes + token filter

- [ ] **Step 1: Write failing tests for cross-instance cache coherence and paginated search**

Create `src/lib/server/catalog-cache.test.ts` with two independent `VersionedServerCache` instances (`instanceA`, `instanceB`) sharing a mocked `readVersion` state: warm both at version `1`, increment remote version to `2` via `instanceA` write without touching `instanceB`, and assert `instanceB.getOrLoad(...)` reloads version `2` on its next call (respecting a configurable `maxCheckStalenessMs = 0` in tests, `3000` in production). Update `src/lib/admin-inventory-query.test.ts` to assert multi-word search queries (`"rtx 4070 super"`) + brand/availability filters return `usesLegacyInventorySearch(query) === false`.

- [ ] **Step 2: Run tests to verify failure**

Run: `npx tsx --test src/lib/server/catalog-cache.test.ts src/lib/admin-inventory-query.test.ts`
Expected: FAIL (`Cannot find module './catalog-cache'` and `usesLegacyInventorySearch` returns `true`).

- [ ] **Step 3: Implement `VersionedServerCache`, tokenized paginated queries, and `firestore.indexes.json` composite indexes**

Implement `VersionedServerCache` in `src/lib/server/catalog-cache.ts` and adopt it in `builder-catalog.ts`, `inventory-fetcher.ts`, and `public-products.ts` (replacing process-local TTL trust and making `clearCatalogCache()` call `bumpCatalogMetaVersion()` alongside local clears). Update `admin-inventory-queries.ts` and `public-catalog-queries.ts` to query `searchKeywords` (`array-contains` on longest normalized token, refining multi-token matches across cursor batches capped at `pageSize * 3`), `brandSort`, and `inStock`, returning brand facets from `getCatalogMeta()`. Add matching `COLLECTION_GROUP` indexes for `items` (`inventoryQueryVersion`, `isArchived`, `inStock`, `brandSort`, `searchKeywords`) to `firestore.indexes.json` and disable the automatic `useInventoryParts` fallback in `src/app/admin/page.tsx` for Stock tab search/filters.

- [ ] **Step 4: Run unit tests, typecheck, and lint**

Run: `npx tsx --test src/lib/server/catalog-cache.test.ts src/lib/admin-inventory-query.test.ts && npm run typecheck && npm run lint`
Expected: PASS; zero errors.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/server/catalog-cache.ts src/lib/server/catalog-cache.test.ts src/lib/admin-inventory-query.ts src/lib/admin-inventory-query.test.ts src/lib/server/admin-inventory-queries.ts src/lib/server/public-catalog-queries.ts src/lib/server/builder-catalog.ts src/lib/server/public-products.ts src/lib/inventory-fetcher.ts src/app/actions.ts src/app/admin/page.tsx firestore.indexes.json
git commit -m "feat(db): add version-keyed multi-instance caches and bounded catalog search"
```

---

### Task 3: Multi-Instance App Hosting Parity Gate (`apphosting.yaml`)

**Files:**
- Create: `tests/multi-instance-cache-coherence.test.ts`
- Modify: `apphosting.yaml:1-30`

**Interfaces:**
- Consumes: `VersionedServerCache`, `getBuilderCatalog()`, `clearBuilderCatalogCache()`, `listPublicCatalogPage()`
- Produces: Repeatable multi-context cache coherence test + updated `apphosting.yaml` `maxInstances` config (`maxInstances: 3`, gated behind passing tests and deployed indexes)

- [ ] **Step 1: Write failing coherence integration test simulating two server contexts**

Create `tests/multi-instance-cache-coherence.test.ts` asserting that after invalidating catalog version between two separate cache contexts (`contextA` and `contextB`), neither `getBuilderCatalog` nor `listPublicPartsCatalog` serves stale price/stock values past the version-check window.

- [ ] **Step 2: Run test to verify baseline behavior before config update**

Run: `npx tsx --test tests/multi-instance-cache-coherence.test.ts`
Expected: PASS against Task 2's cache wrapper (or FAIL if any direct cache bypasses `VersionedServerCache`; fix any leak immediately).

- [ ] **Step 3: Update `apphosting.yaml` `maxInstances` from `1` to `3` with deployment prerequisite comment**

Update `runConfig.maxInstances: 3` in `apphosting.yaml` and preserve `NEXT_PUBLIC_INVENTORY_PAGINATION_ENABLED` and `NEXT_PUBLIC_PUBLIC_CATALOG_INDEXED_ENABLED`.

- [ ] **Step 4: Run verification suite (`typecheck`, `lint`, `build`)**

Run: `npx tsx --test tests/multi-instance-cache-coherence.test.ts && npm run typecheck && npm run lint`
Expected: PASS with zero errors.

- [ ] **Step 5: Commit**

```powershell
git add tests/multi-instance-cache-coherence.test.ts apphosting.yaml
git commit -m "chore(infra): enable multi-instance App Hosting scaling after cache coherence verification"
```

---

## Phase 2: Orders Queue Pagination & Pre-Aggregated Sales Analytics

### Task 4: Server-Paginated Admin Orders Queue & `.count()` Stage Badges

**Files:**
- Create: `src/lib/server/admin-order-queries.ts`
- Create: `src/lib/server/admin-order-queries.test.ts`
- Create: `src/app/admin/order-query-actions.ts`
- Modify: `src/app/admin/hooks/use-orders.ts:37-68,357-408`
- Modify: `src/app/admin/hooks/use-orders-view.ts:19-256`
- Modify: `src/app/admin/components/orders/orders-tab.tsx:29-60`
- Modify: `firestore.indexes.json`
- Test: `src/lib/server/admin-order-queries.test.ts`, `src/app/admin/hooks/use-orders-listener.test.ts`

**Interfaces:**
- Produces:
  - `AdminOrderQuerySchema` (`archived: boolean`, `stage: OrderUnifiedFilterStage | 'all'`, `paymentStatus?: string`, `paymentMethod?: string`, `refundStatus?: string`, `search?: string`, `sortBy: 'newest' | 'oldest' | 'price-high' | 'price-low'`, `pageSize: number` (default 25, max 50), `cursor?: string | null`) in `src/lib/server/admin-order-queries.ts`
  - `listAdminOrdersPage(idToken: string, rawOptions: unknown): Promise<{ orders: Order[]; totalCount: number; stageCounts: Record<string, number>; nextCursor: string | null }>`
  - `fetchAdminOrdersPageAction(input: { idToken: string; options: unknown })` in `src/app/admin/order-query-actions.ts`

- [ ] **Step 1: Write failing tests for server-side order pagination and stage `.count()` calculation**

Create `src/lib/server/admin-order-queries.test.ts` verifying Zod bounds (`pageSize <= 50`), stage/archive query construction using `(isArchived, queueStage, createdAt)` and `(isArchived, createdAt)` indexes, cursor boundary stability across page 1 -> page 2 without duplicate IDs, and rejection of non-staff tokens.

- [ ] **Step 2: Run test to verify failure**

Run: `npx tsx --test src/lib/server/admin-order-queries.test.ts`
Expected: FAIL (`Cannot find module './admin-order-queries'`).

- [ ] **Step 3: Implement `admin-order-queries.ts`, `order-query-actions.ts`, and update `useOrders` / `useOrdersView`**

Implement `listAdminOrdersPage` using Firestore cursor pagination (`limit(pageSize + 1)`) plus parallel `.count()` queries for active stage badges, and add composite indexes for `(isArchived, totalPrice, __name__)`, `(isArchived, paymentStatus, createdAt, __name__)`, and `(isArchived, orderNumber)` in `firestore.indexes.json`. Refactor `useOrders` (`src/app/admin/hooks/use-orders.ts`) to fetch bounded 25–50 order pages via `fetchAdminOrdersPageAction` (maintaining only a `limit(25)` head listener on page 1 when unfiltered instead of expanding `orderLimit + 100`), and wire `OrdersTab` / `useOrdersView` to server page state.

- [ ] **Step 4: Run tests, typecheck, and lint**

Run: `npx tsx --test src/lib/server/admin-order-queries.test.ts && npm run typecheck && npm run lint`
Expected: PASS; zero errors.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/server/admin-order-queries.ts src/lib/server/admin-order-queries.test.ts src/app/admin/order-query-actions.ts src/app/admin/hooks/use-orders.ts src/app/admin/hooks/use-orders-view.ts src/app/admin/components/orders/orders-tab.tsx firestore.indexes.json
git commit -m "feat(orders): replace expanding admin orders listener with cursor pagination and count badges"
```

---

### Task 5: Pre-Aggregated Sales Rollups (`analyticsDaily` / `analyticsMonthly`) & Bounded Exports

**Files:**
- Create: `src/lib/analytics-rollups.ts`
- Create: `src/lib/analytics-rollups.test.ts`
- Create: `src/lib/server/sales-analytics-queries.ts`
- Create: `src/app/api/admin/sales-export/route.ts`
- Create: `execution/backfill_sales_analytics.ts`
- Modify: `src/app/checkout-actions.ts`
- Modify: `src/app/admin/order-refund-actions.ts`
- Modify: `src/app/admin/sales-admin-actions.ts:59-371`
- Modify: `src/app/admin/hooks/use-sales-actions.ts:14-144`
- Modify: `src/components/sales-analytics.tsx:46-120`
- Modify: `src/app/admin/page.tsx:88-111`
- Test: `src/lib/analytics-rollups.test.ts`, `tests/sales-export.spec.ts`

**Interfaces:**
- Produces:
  - `AnalyticsBucket` (`bucketKey: string`, `grossCollectedPhp: number`, `refundedPhp: number`, `netCollectedPhp: number`, `paidOrderCount: number`, `cancelledOrderCount: number`, `customOrderCount: number`, `prebuiltOrderCount: number`, `byPaymentMethod: Record<string, number>`, `partUnitsSold: Record<string, number>`, `updatedAt: number`) in `src/lib/analytics-rollups.ts`
  - `applyOrderAnalyticsDeltaInTx(tx: FirebaseFirestore.Transaction, db: FirebaseFirestore.Firestore, eventKey: string, beforeOrder: Order | null, afterOrder: Order): Promise<void>` in `src/lib/analytics-rollups.ts`
  - `fetchSalesDashboardSummary(idToken: string, range: 'week' | 'month' | 'year'): Promise<SalesDashboardSummary>` in `src/lib/server/sales-analytics-queries.ts`

- [ ] **Step 1: Write failing tests for idempotent rollup deltas across payments, refunds, and cancellations**

Create `src/lib/analytics-rollups.test.ts` asserting: (a) transitioning an order to `paid` increments the exact `YYYY-MM-DD` and `YYYY-MM` buckets for `paidAt || createdAt`; (b) re-running `applyOrderAnalyticsDeltaInTx` with the same `eventKey` (`analyticsAppliedEvents/{eventKey}`) is a no-op; (c) issuing a partial refund subtracts only the delta from `netCollectedPhp` and increments `refundedPhp`; (d) cancelling an unpaid order updates `cancelledOrderCount` without changing `netCollectedPhp`.

- [ ] **Step 2: Run test to verify failure**

Run: `npx tsx --test src/lib/analytics-rollups.test.ts`
Expected: FAIL (`Cannot find module './analytics-rollups'`).

- [ ] **Step 3: Implement rollups, transactional hooks, `SalesAnalytics` query, bounded export API, and dry-run backfill**

Implement `src/lib/analytics-rollups.ts` (recording applied `eventKey` markers under `analyticsDaily/{day}/appliedEvents/{eventKey}` or an `appliedAnalyticsEvents` field/collection with 90d TTL so retries are strictly idempotent) and invoke it in `createCheckoutOrder`, `resolveSimulatedPayment`, `verifyAndSyncPaymongoOrder`, `updateOrderPaymentStatusByStaff`, `refundOrderByStaff`, and `sales-admin-actions.ts`. Implement `fetchSalesDashboardSummary` reading only 7–30 `analyticsDaily` docs (`week`/`month`) or 12 `analyticsMonthly` docs (`year`), decouple `SalesAnalytics` & `SalesTab` in `src/app/admin/page.tsx` from `useOrders`'s truncated `orders` list, move Excel workbook generation to `/api/admin/sales-export` (paginating `orders` in 250-doc chunks server-side instead of reading client memory), and write `execution/backfill_sales_analytics.ts` (dry-run by default, resumable cursor over `orders`).

- [ ] **Step 4: Run unit tests, typecheck, and lint**

Run: `npx tsx --test src/lib/analytics-rollups.test.ts && npm run typecheck && npm run lint`
Expected: PASS; zero errors.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/analytics-rollups.ts src/lib/analytics-rollups.test.ts src/lib/server/sales-analytics-queries.ts src/app/api/admin/sales-export/route.ts execution/backfill_sales_analytics.ts src/app/checkout-actions.ts src/app/admin/order-refund-actions.ts src/app/admin/sales-admin-actions.ts src/app/admin/hooks/use-sales-actions.ts src/components/sales-analytics.tsx src/app/admin/page.tsx
git commit -m "feat(analytics): decouple SalesAnalytics onto daily/monthly rollups and bounded server export"
```

---

## Phase 3: Prebuilt Summaries, Hold-Expiry Sweep Index & Checkout Contention

### Task 6: Prebuilt Pagination & Denormalized `componentSummaries`

**Files:**
- Create: `src/lib/prebuilt-summaries.ts`
- Create: `src/lib/prebuilt-summaries.test.ts`
- Create: `src/lib/server/prebuilt-queries.ts`
- Create: `execution/backfill_prebuilt_summaries.ts`
- Modify: `src/app/pre-builts/page.tsx:32-120`
- Modify: `src/app/pre-builts/[id]/hooks/use-prebuilt-details.ts:155-250`
- Modify: `src/lib/server/public-products.ts:31-97`
- Modify: `src/app/admin/hooks/use-inventory.ts:44-55`
- Modify: `src/app/product-actions.ts:50-88`
- Modify: `src/firebase/database.ts`
- Modify: `firestore.indexes.json`
- Test: `src/lib/prebuilt-summaries.test.ts`

**Interfaces:**
- Produces:
  - `PrebuiltComponentSummary` (`key: string`, `category: Part['category']`, `partId: string`, `productId: string | null`, `name: string`, `price: number`, `imageUrl: string`, `inStock: boolean`, `isArchived: boolean`) in `src/lib/prebuilt-summaries.ts`
  - `listPrebuiltSystemsPage(options: { includeArchived?: boolean; tiers?: string[]; sortBy?: string; sortDirection?: 'asc' | 'desc'; pageSize?: number; cursor?: string | null })` in `src/lib/server/prebuilt-queries.ts`
  - `syncPrebuiltSummariesForPart(db: FirebaseFirestore.Firestore, partPath: string, partData: Part)` in `src/lib/prebuilt-summaries.ts`

- [ ] **Step 1: Write failing tests for prebuilt component summary derivation and drift sync**

Create `src/lib/prebuilt-summaries.test.ts` asserting: (a) `buildPrebuiltComponentSummaries` handles single/array component slots, included stock cooler, and `included-integrated-gpu` without issuing legacy `CPU/{id}` fallback calls; (b) `syncPrebuiltSummariesForPart` updates `price`, `inStock`, `isArchived`, and derived total price on referencing `prebuiltSystems` docs when a part changes.

- [ ] **Step 2: Run test to verify failure**

Run: `npx tsx --test src/lib/prebuilt-summaries.test.ts`
Expected: FAIL (`Cannot find module './prebuilt-summaries'`).

- [ ] **Step 3: Implement `prebuilt-summaries.ts`, `prebuilt-queries.ts`, backfill script, and update callers**

Add composite index `(isArchived, tier, createdAt)` and `(componentPartIds array-contains)` on `prebuiltSystems` in `firestore.indexes.json`. Implement `listPrebuiltSystemsPage` (bounded 24/page, `isArchived == false` for public `/pre-builts`), store `componentPartIds` + `componentSummaries` on create/edit and via `execution/backfill_prebuilt_summaries.ts` (dry-run default), trigger `syncPrebuiltSummariesForPart` from `updateCatalogPart` and checkout/stock updates, and read `componentSummaries` first in `usePrebuiltDetails` and `serializeProduct` (keeping live transactional verification inside `reservePublicProduct`).

- [ ] **Step 4: Run tests, typecheck, and lint**

Run: `npx tsx --test src/lib/prebuilt-summaries.test.ts && npm run typecheck && npm run lint`
Expected: PASS; zero errors.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/prebuilt-summaries.ts src/lib/prebuilt-summaries.test.ts src/lib/server/prebuilt-queries.ts execution/backfill_prebuilt_summaries.ts src/app/pre-builts/page.tsx src/app/pre-builts/[id]/hooks/use-prebuilt-details.ts src/lib/server/public-products.ts src/app/admin/hooks/use-inventory.ts src/app/product-actions.ts src/firebase/database.ts firestore.indexes.json
git commit -m "feat(prebuilts): paginate prebuiltSystems and embed denormalized componentSummaries"
```

---

### Task 7: Indexed `holdExpiresAt` Sweeps & Decoupled Popularity Writes

**Files:**
- Create: `src/lib/server/popularity-writer.ts`
- Create: `src/lib/server/popularity-writer.test.ts`
- Create: `execution/backfill_order_hold_expiry.ts`
- Modify: `src/lib/order-expiration.ts`
- Modify: `src/lib/server/order-expiration-sweep.ts:289-355`
- Modify: `src/app/checkout-actions.ts:233-307,490-530,715-730`
- Modify: `firestore.indexes.json`
- Test: `src/lib/server/popularity-writer.test.ts`, `src/lib/order-expiration.test.ts`

**Interfaces:**
- Produces:
  - `computeOrderHoldExpiresAt(paymentMethod: PaymentMethod, createdAt: Date): Timestamp | null` in `src/lib/order-expiration.ts`
  - `recordPartPopularityIncrements(db: FirebaseFirestore.Firestore, increments: Array<{ path: string; delta: number }>): Promise<void>` in `src/lib/server/popularity-writer.ts`

- [ ] **Step 1: Write failing tests for `holdExpiresAt` calculation, COD exclusion, and popularity batching**

Extend `src/lib/order-expiration.test.ts` to assert `computeOrderHoldExpiresAt('cod', ...)` returns `null` while simulated/PayMongo online methods return `createdAt + 60m`. Create `src/lib/server/popularity-writer.test.ts` asserting `recordPartPopularityIncrements` aggregates duplicate paths in a single order (`[{ path: 'inventory/ram/items/1', delta: 1 }, { path: 'inventory/ram/items/1', delta: 2 }]` -> one increment of `3`) and does not throw on non-critical failure.

- [ ] **Step 2: Run tests to verify failure**

Run: `npx tsx --test src/lib/server/popularity-writer.test.ts src/lib/order-expiration.test.ts`
Expected: FAIL (`computeOrderHoldExpiresAt` not exported / `popularity-writer` missing).

- [ ] **Step 3: Add `holdExpiresAt` index, update `runExpiredOrdersSweep`, and decouple `popularity` from stock transactions**

Add `(status, paymentStatus, holdExpiresAt)` index on `orders` in `firestore.indexes.json`. Write `holdExpiresAt` at `createCheckoutOrder` (and clear it on `paid` or `switchOrderPaymentToCod`), update `runExpiredOrdersSweep` to query `status == 'pending'`, `paymentStatus == 'pending'`, `holdExpiresAt <= now` (with a bounded legacy fallback query for orders missing `holdExpiresAt` until `execution/backfill_order_hold_expiry.ts` completes), remove `popularity` writes from the checkout stock transaction in `checkout-actions.ts` in favor of post-commit `after(() => recordPartPopularityIncrements(...))`, and require deterministic `productId` or canonical `inventory` path resolution without `where('name', '==', ...)` inside stock transactions.

- [ ] **Step 4: Run tests, typecheck, and lint**

Run: `npx tsx --test src/lib/server/popularity-writer.test.ts src/lib/order-expiration.test.ts && npm run typecheck && npm run lint`
Expected: PASS; zero errors.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/server/popularity-writer.ts src/lib/server/popularity-writer.test.ts execution/backfill_order_hold_expiry.ts src/lib/order-expiration.ts src/lib/order-expiration.test.ts src/lib/server/order-expiration-sweep.ts src/app/checkout-actions.ts firestore.indexes.json
git commit -m "perf(checkout): index holdExpiresAt sweeps and decouple popularity writes from stock transactions"
```

---

## Phase 4: Tiered Retention, Firestore Native TTL & Paginated Logs

### Task 8: Firestore Native TTL (`fieldOverrides`) & Version-Pinned AI Cache Keys

**Files:**
- Create: `src/lib/ttl-policies.ts`
- Create: `src/lib/ttl-policies.test.ts`
- Modify: `src/ai/flows/ai-build-critique.ts:70-83,126-148,299-315`
- Modify: `src/ai/flows/ai-build-advisor-recommendations.ts:99-113,181-191`
- Modify: `src/app/api/ai/build-advisor/recommendations/route.ts:23-38`
- Modify: `src/lib/server/order-operations.ts:10-26`
- Modify: `src/lib/server/order-expiration-sweep.ts:103-127,202-265`
- Modify: `src/firebase/database.ts`
- Modify: `src/firebase/audit.ts`
- Modify: `firestore.indexes.json`
- Test: `src/lib/ttl-policies.test.ts`

**Interfaces:**
- Produces:
  - `TTL_DAYS` (`aiCritiqueCache: 1`, `aiRecommendationCache: 7`, `orderWorkflowOperations: 30`, `notifications: 90`, `auditLogs: 365`) and `computeExpiresAt(policy: keyof typeof TTL_DAYS, fromMs?: number): Date` in `src/lib/ttl-policies.ts`

- [ ] **Step 1: Write failing tests for `TTL_DAYS` windows and AI recommendation cache key catalog-version sensitivity**

Create `src/lib/ttl-policies.test.ts` verifying exact retention offsets (`24h`, `7d`, `30d`, `90d`, `365d`), confirming no TTL helper accepts `orders` or `orders/activity`, and verifying that two identical advisor inputs with different `catalogVersion` values produce distinct cache keys.

- [ ] **Step 2: Run test to verify failure**

Run: `npx tsx --test src/lib/ttl-policies.test.ts`
Expected: FAIL (`Cannot find module './ttl-policies'`).

- [ ] **Step 3: Implement `ttl-policies.ts`, `fieldOverrides` in `firestore.indexes.json`, bounded notification pruning, and writers**

Add Firestore TTL `fieldOverrides` on `expiresAt` (`ttlConfig: {}`) in `firestore.indexes.json` for `ai_critique_cache_v1`, `ai_recommendation_cache_v3`, `orderWorkflowOperations`, `system_notifications`, `notifications`, `auditLogs`, and `user_auditLogs`. Stamp `expiresAt` on every write to those collections, include `catalogVersion` from `getCatalogMeta()` inside `ai_recommendation_cache_v3` cache keys (`ai-build-advisor-recommendations.ts` and `/api/ai/build-advisor/recommendations/route.ts`), and rewrite `pruneUserNotificationsServer` (`order-expiration-sweep.ts`) to query `.orderBy('createdAt', 'desc').offset(maxKeep).limit(50)` instead of loading the entire subcollection.

- [ ] **Step 4: Run tests, typecheck, and lint**

Run: `npx tsx --test src/lib/ttl-policies.test.ts && npm run typecheck && npm run lint`
Expected: PASS; zero errors.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/ttl-policies.ts src/lib/ttl-policies.test.ts src/ai/flows/ai-build-critique.ts src/ai/flows/ai-build-advisor-recommendations.ts src/app/api/ai/build-advisor/recommendations/route.ts src/lib/server/order-operations.ts src/lib/server/order-expiration-sweep.ts src/firebase/database.ts src/firebase/audit.ts firestore.indexes.json
git commit -m "feat(db): configure Firestore native TTL policies and version-pin AI recommendation cache"
```

---

### Task 9: Paginated Audit Logs (`auditLogs` & `user_auditLogs`)

**Files:**
- Create: `src/lib/server/audit-log-queries.ts`
- Create: `src/lib/server/audit-log-queries.test.ts`
- Modify: `src/app/profile/hooks/use-audit-logs.ts:1-36`
- Modify: `src/app/profile/hooks/use-user-audit-logs.ts:1-37`
- Modify: `src/app/profile/components/audit-logs-section.tsx`
- Modify: `src/app/profile/components/user-audit-logs-section.tsx`
- Modify: `firestore.indexes.json`
- Test: `src/lib/server/audit-log-queries.test.ts`

**Interfaces:**
- Produces:
  - `listStaffAuditLogsPage(idToken: string, options: { scope?: string; fromDate?: string; toDate?: string; pageSize?: number; cursor?: string | null })` and `listUserAuditLogsPage(idToken: string, options: { scope?: string; pageSize?: number; cursor?: string | null })` in `src/lib/server/audit-log-queries.ts`

- [ ] **Step 1: Write failing tests for bounded audit log pagination and user isolation**

Create `src/lib/server/audit-log-queries.test.ts` asserting default `pageSize: 25`, max `50`, mandatory `userId == decoded.uid` filtering for customer `user_auditLogs`, and staff authorization check for `auditLogs`.

- [ ] **Step 2: Run test to verify failure**

Run: `npx tsx --test src/lib/server/audit-log-queries.test.ts`
Expected: FAIL (`Cannot find module './audit-log-queries'`).

- [ ] **Step 3: Implement `audit-log-queries.ts`, indexes, and update audit hooks/sections**

Add composite indexes `(userId, createdAt DESC, __name__ DESC)` and `(userId, scope, createdAt DESC, __name__ DESC)` on `user_auditLogs` plus `(scope, createdAt DESC, __name__ DESC)` on `auditLogs` in `firestore.indexes.json`. Replace the unbounded 90-day live query in `useAuditLogs` and the unsorted full-user live query in `useUserAuditLogs` with cursor-paginated queries (25–50/page) and update `AuditLogsSection` / `UserAuditLogsSection` pagination controls.

- [ ] **Step 4: Run tests, typecheck, and lint**

Run: `npx tsx --test src/lib/server/audit-log-queries.test.ts && npm run typecheck && npm run lint`
Expected: PASS; zero errors.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/server/audit-log-queries.ts src/lib/server/audit-log-queries.test.ts src/app/profile/hooks/use-audit-logs.ts src/app/profile/hooks/use-user-audit-logs.ts src/app/profile/components/audit-logs-section.tsx src/app/profile/components/user-audit-logs-section.tsx firestore.indexes.json
git commit -m "perf(audit): convert staff and user audit logs to cursor-paginated queries"
```

---

## Phase 5: Legacy Path Retirement & Authorization Hardening

### Task 10: Legacy Fallback Retirement, `firestore.rules` Lockdown & AI Endpoint Auth

**Files:**
- Create: `src/lib/server/ai-route-auth.ts`
- Create: `src/lib/server/ai-route-auth.test.ts`
- Create: `execution/verify_legacy_path_retirement.ts`
- Modify: `firestore.rules:56-75,148-188`
- Modify: `src/app/api/chat/route.ts:16-39`
- Modify: `src/app/api/ai/build-advisor/recommendations/route.ts:39-76`
- Modify: `src/app/pre-builts/[id]/hooks/use-prebuilt-details.ts:210-232`
- Modify: `src/lib/server/public-products.ts:53-62`
- Modify: `src/app/checkout-actions.ts:233-307`
- Test: `src/lib/server/ai-route-auth.test.ts`

**Interfaces:**
- Produces:
  - `authorizeAiRequest(req: Request, options: { allowGuestWithRateLimit: boolean; maxPerMinute: number }): Promise<{ uid: string | null; key: string }>` in `src/lib/server/ai-route-auth.ts`

- [ ] **Step 1: Write failing tests for AI route auth/rate limiting and legacy rule constraints**

Create `src/lib/server/ai-route-auth.test.ts` asserting: (a) invalid Bearer ID tokens return `401`; (b) unauthenticated bursts exceeding `maxPerMinute` for the same client key trigger `429` via Firestore rate-limit windows; (c) valid verified users pass with `uid`.

- [ ] **Step 2: Run test to verify failure**

Run: `npx tsx --test src/lib/server/ai-route-auth.test.ts`
Expected: FAIL (`Cannot find module './ai-route-auth'`).

- [ ] **Step 3: Verify zero live legacy data, retire fallbacks, lock `firestore.rules`, and wire `authorizeAiRequest`**

Create `execution/verify_legacy_path_retirement.ts` to assert zero documents remain in `parts` and legacy top-level `{Category}` collections and zero `prebuiltSystems` reference unmigrated names. Once verified clean, remove `where('name', '==', ...)` and top-level collection fallbacks from `usePrebuiltDetails`, `resolveSystemParts`, and `resolveInventoryDocInTransaction`; lock `firestore.rules` (remove `parts/{partId}` and `/{category}/{partId}` client stock/popularity rules, set `orders` `allow create: if false;`, restrict `authKeys` and `keyRequests` behind server actions/rate limits); and apply `authorizeAiRequest` inside `/api/chat` and `/api/ai/build-advisor/recommendations` (with TTL on rate-limit buckets).

- [ ] **Step 4: Run tests, typecheck, lint, and full build**

Run: `npx tsx --test src/lib/server/ai-route-auth.test.ts && npm run typecheck && npm run lint && npm run build`
Expected: All tests PASS; zero type/lint errors; production `next build` succeeds.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/server/ai-route-auth.ts src/lib/server/ai-route-auth.test.ts execution/verify_legacy_path_retirement.ts firestore.rules src/app/api/chat/route.ts src/app/api/ai/build-advisor/recommendations/route.ts src/app/pre-builts/[id]/hooks/use-prebuilt-details.ts src/lib/server/public-products.ts src/app/checkout-actions.ts
git commit -m "chore(security): retire legacy catalog fallbacks, tighten firestore.rules, and rate-limit AI endpoints"
```

---

## Rollout Order & Pre-Deployment Verification

1. Execute **Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5** sequentially; deploy additive writers and `firestore.indexes.json` (including TTL `fieldOverrides`) and wait for index/TTL readiness before flipping readers or retiring legacy paths.
2. Run a managed Firestore backup to `gs://studio-3150054754-c7d0b-private-backups` before running any `execution/backfill_*.ts` script in live `--apply` mode (all backfill scripts default to `--dry-run`).
3. Verify `npm run typecheck`, `npm run lint`, `npm run build`, all `node:test` suites, and Playwright suites (`tests/inventory-catalog-pagination.spec.ts`, `tests/sales-export.spec.ts`, `tests/order-management.integration.ts`) before each rollout.
