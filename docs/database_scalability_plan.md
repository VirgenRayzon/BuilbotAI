# BuildbotAI Database Scalability Plan

_Updated 11 November 2026 based on the post-`rollout-2026-11-06-003` codebase, `firestore.indexes.json`, `firestore.rules`, and `apphosting.yaml`. Live GCP billing metrics and production query latency distributions beyond the November 6 smoke check remain outside repository source and must be monitored alongside rollout._

## Target Scale & Infrastructure Posture

- **Target Scale Horizon:** `1,000–5,000` catalog parts and `10,000+` orders.
- **Primary Database:** Keep **Cloud Firestore** as the operational source of truth for inventory, prebuilt systems, orders, notifications, and audit trails.
- **Compute Posture:** Eliminate in-memory, single-instance assumptions so **Firebase App Hosting** (`apphosting.yaml`) can safely scale beyond `maxInstances: 1` without cache drift or stale catalog reads.
- **Companion Engineering Plan:** Task-by-task implementation steps, schemas, interfaces, and TDD verification live in [`docs/superpowers/plans/2026-11-11-database-scalability.md`](superpowers/plans/2026-11-11-database-scalability.md).

---

## 1. Post-Nov 6 Baseline: What Shipped vs. Current State

On **6 November 2026** (`rollout-2026-11-06-003`, documented in [`docs/inventory_scaling_rollout_2026-11-06.md`](inventory_scaling_rollout_2026-11-06.md)), BuildbotAI completed its first bounded-catalog milestone:

- **Normalized Inventory Query Fields:** Backfilled `inventoryQueryVersion: 1`, `isArchived`, `inStock`, `publicCatalogEligible`, `nameSort`, `brandSort`, and `createdAtSort` across all 333 `inventory/{category}/items/{partId}` documents (`src/lib/inventory-query-fields.ts`), with a managed backup in Cloud Storage.
- **Bounded Admin Stock Default View:** `listAdminInventoryPage` (`src/lib/server/admin-inventory-queries.ts`) and `useInventoryPage` (`src/app/admin/hooks/use-inventory-page.ts`) paginate 24–100 parts via `collectionGroup('items')` cursors, `.count()` totals, and per-visible-item `onSnapshot` listeners (`NEXT_PUBLIC_INVENTORY_PAGINATION_ENABLED=true`).
- **Bounded Public `/parts` Default Page & Related Parts:** `listPublicCatalogPage` (`src/lib/server/public-catalog-queries.ts`) serves 8-item cursor pages with `.count()` (`NEXT_PUBLIC_PUBLIC_CATALOG_INDEXED_ENABLED=true`), and `listRelatedPublicParts` (`src/lib/server/public-products.ts`) bounds product detail related lookups to 9 documents in one category.
- **Transactional Order Operations & Activity History:** Checkout (`createCheckoutOrder`), reservation (`reservePrebuiltSystem`), and staff updates (`updateReservationStatus`, `updateOrderPaymentStatusByStaff`, `updateOrderFulfillmentStageByStaff`, `refundOrderByStaff`) verify Firebase Auth ID tokens on the server, enforce optimistic concurrency (`workflowRevision`) and idempotency via `orderWorkflowOperations/{orderId}_{operationId}`, and record audit entries under `orders/{orderId}/activity`.

---

## 2. Remaining Scalability, Cost & Integrity Gaps

| Area | Current Behavior Observed in Code | Impact at 1k–5k Parts & 10k+ Orders |
| --- | --- | --- |
| **Multi-instance cache & search fallbacks** | `getBuilderCatalog()` (`src/lib/server/builder-catalog.ts`) and `getInventoryFromFirestore()` (`src/lib/inventory-fetcher.ts`) cache all 12 categories in module memory; `listPublicPartsCatalog` uses single-instance `revalidateTag()`; Admin Stock (`src/app/admin/page.tsx`) falls back to `useInventoryParts` (12 unbounded `onSnapshot` listeners) on substring search, brand/availability filters, or non-stock tabs; `apphosting.yaml` caps `maxInstances: 1`. | Scaling out instances causes stale caches across servers; search, brand filters, and `/builder` still trigger full 12-category scans (`O(N)` reads per cold miss/listener). |
| **Orders queue & coupled sales analytics** | `useOrders` (`src/app/admin/hooks/use-orders.ts`) opens a live `onSnapshot` on `orders` starting at `limit(100)` and grows the same live query (`+100` per click); `useOrdersView` filters/sorts in memory; `SalesTab` / `SalesAnalytics` and `useSalesActions` receive only `orders` from `useOrders`; `sales-admin-actions.ts` reads the entire `orders` and inventory collections. | At 10k+ orders, Sales KPIs, 12-month charts, and Excel exports silently truncate to the latest 100 orders—or force staff to load thousands of live documents into browser memory. |
| **Prebuilts & N+1 part resolution** | `/pre-builts` (`src/app/pre-builts/page.tsx`) and `useInventory` (`src/app/admin/hooks/use-inventory.ts`) listen to the entire `prebuiltSystems` collection without `isArchived` filter or pagination; `usePrebuiltDetails` and `resolveSystemParts` run per-component `getDoc` + `where('name', '==', ...)` + legacy top-level collection fallbacks. | Every prebuilt listing/detail view opens unbounded listeners or fans out into 8–10+ reads (and up to 4× fallback queries when IDs miss). |
| **Unbounded logs, notifications & AI caches** | `firestore.indexes.json` has `"fieldOverrides": []` (zero TTL policies). `useAuditLogs` listens live to all `auditLogs` for 90 days; `useUserAuditLogs` listens to all `user_auditLogs` for a user and sorts in memory; `pruneUserNotificationsServer` reads all user notifications before pruning beyond 30; `ai_critique_cache_v1`, `ai_recommendation_cache_v3` (also missing catalog version in its key), and `orderWorkflowOperations` never expire. | Storage, index size, and client snapshot payloads grow monotonically; stale AI recommendations can be served after catalog price/stock updates. |
| **Expiration sweeps & checkout contention** | `runExpiredOrdersSweep` (`src/lib/server/order-expiration-sweep.ts`) queries all `status == 'pending'` orders ordered by document ID; `createCheckoutOrder` increments `popularity` on the same `inventory` doc as `stock` inside the checkout transaction and keeps `where('name', '==', ...)` fallback queries inside `resolveInventoryDocInTransaction`. | Expired-order sweeps read non-expiring COD orders; popular-part launches risk transaction contention from combined stock + popularity writes and query scans inside transactions. |
| **Legacy rules & AI route auth gaps** | `firestore.rules` still allows authenticated clients to update `stock`/`popularity` on legacy `parts/{partId}` and `/{category}/{partId}`, allows client `orders` creation, public `authKeys` `get`, and unauthenticated `keyRequests` creation; `/api/chat` and `/api/ai/build-advisor/recommendations` lack caller ID-token verification and rate limits. | Legacy client paths risk bypassing server validation; unauthenticated AI HTTP endpoints expose Gemini/Vertex quota to abuse. |

---

## 3. Target Architecture & Design Decisions

### A. Versioned Catalog Read-Model & Cross-Instance Cache Coherence
- **Shared Version Document (`siteSettings/catalogMeta`):** Maintain a lightweight singleton document containing `catalogVersion` (monotonically incremented integer), `updatedAt`, and precomputed facet summaries (`brandsByCategory`, active counts per category). Every catalog create, update, archive, restore, or stock change bumps `catalogVersion` atomically or immediately post-commit.
- **Version-Keyed Server Caches:** Replace standalone in-memory TTL validity in `builder-catalog.ts`, `inventory-fetcher.ts`, and `public-products.ts` with `catalogVersion`-aware cache checks (1 single-doc read or short 5-second meta memoization checks `catalogVersion` before trusting local memory or Next.js cache entries). When `maxInstances > 1` in `apphosting.yaml`, instances converge within seconds without cross-node memory invalidation RPCs.
- **Tokenized Search & Faceted Queries:** Normalize `searchKeywords` into prefix/token arrays (`name`, `brand`, `sku`, `productId`) alongside `brandSort` and `inStock` composite indexes so admin and public `/parts` substring/brand/availability queries stay server-paginated without dropping back to `useInventoryParts` or scanning all 12 categories.

### B. Decoupled Orders Queue & Pre-Aggregated Sales Analytics
- **Server-Paginated Admin Orders Queue:** Replace `useOrders`'s expanding `limit(orderLimit)` listener with cursor-paginated server queries (`25–50` orders per page) built on the existing `(isArchived, queueStage, createdAt)` and `(isArchived, createdAt)` composite indexes, plus `.count()` aggregations for queue tab badges. Keep a small live listener strictly for the active page-1 queue head when realtime updates are needed.
- **Pre-Aggregated Rollups for Sales Analytics (`analyticsDaily/{YYYY-MM-DD}` & `analyticsMonthly/{YYYY-MM}`):** Store net collected revenue, gross order count, cancelled count, refunded totals, payment method splits, custom-vs-prebuilt splits, and top component unit counts in daily/monthly rollup documents updated via idempotent order-state ledger hooks on payment, refund, and cancellation transitions. `SalesAnalytics` reads 7–30 daily docs (`week`/`month`) or 12 monthly docs (`year`) regardless of total order count.
- **On-Demand Bounded Exports:** `useSalesActions` delegates Excel generation to a paginated server export route/action that streams or chunks orders in bounded batches instead of serializing client hook memory.

### C. Prebuilt Summaries, Indexed Expiration Sweeps & Checkout Contention Control
- **Paginated Prebuilts & Denormalized `componentSummaries`:** Filter `prebuiltSystems` by `isArchived == false`, paginate listings server-side, and store a compact `componentSummaries` array/map (part ID, `productId`, name, category, price, imageUrl, inStock status) directly on `prebuiltSystems/{id}` (synchronized on part edits/archives and verified at checkout). This eliminates N+1 part reads and `where('name', '==', partId)` fallback lookups on public and admin prebuilt views.
- **Indexed `holdExpiresAt` for Expiration Sweeps:** Persist `holdExpiresAt` (Timestamp, set for unpaid/pending online payment orders and cleared when paid or COD) and index `(status, paymentStatus, holdExpiresAt)` so `runExpiredOrdersSweep` queries strictly expired online holds (`holdExpiresAt <= now`) rather than scanning all pending orders.
- **Decouple `popularity` from Stock Transactions:** Keep `stock` verification and decrement strictly inside the synchronous checkout Firestore transaction, and move `popularity` increments out-of-band (Next.js `after()` / batched post-commit updates) while replacing in-transaction `name ==` queries with deterministic `productIds/{rawPrd}` or canonical `inventory/{category}/items/{id}` refs. If single-SKU contention still causes retries during flash spikes, shard hot-SKU stock counters (`stockShards`) only for flagged SKUs.

### D. Tiered Data Retention & Firestore Native TTL
Configure Firestore native TTL policies (`fieldOverrides` on `expiresAt` in `firestore.indexes.json`) and backfill `expiresAt` timestamps across ephemeral/bounded collections:

| Collection | Retention Policy | Cleanup Mechanism | Rationale |
| --- | --- | --- | --- |
| `ai_critique_cache_v1` | **24 hours** | Firestore TTL (`expiresAt`) | Code enforces 1-hour freshness; 24h TTL caps storage bloat. |
| `ai_recommendation_cache_v3` | **7 days** (keyed on `catalogVersion`) | Firestore TTL (`expiresAt`) | Prevents stale inventory/price hits and auto-cleans expired entries. |
| `orderWorkflowOperations` | **30 days** | Firestore TTL (`expiresAt`) | Covers retry/idempotency windows without unbounded doc growth. |
| `system_notifications` & `users/{uid}/notifications` | **90 days** | Firestore TTL (`expiresAt`) + bounded `.offset`/cursor prune | Eliminates full-subcollection reads inside `pruneUserNotificationsServer`. |
| `auditLogs` & `user_auditLogs` | **365 days** | Paginated reads (25–50/page) + TTL (`expiresAt`, optional pre-TTL Cloud Storage export) | Eliminates unbounded 90-day live listeners while keeping 1-year audit window. |
| `orders`, `orders/{id}/activity`, `contactInquiries` | **Indefinite (Never auto-delete)** | Server pagination & archive flags (`isArchived`) | Preserves financial, refund, tax, and customer support records. |

### E. Legacy Path Retirement & Authorization Hardening
- **Retire Legacy Catalog Fallbacks:** Run a parity verification script confirming zero active references to top-level `{Category}/{id}` or `parts/{id}` documents, then remove legacy name/collection fallbacks from `usePrebuiltDetails`, `resolveSystemParts`, and checkout resolution.
- **Lock Down `firestore.rules`:** Remove legacy `parts/{partId}` and `/{category}/{partId}` rules that permit authenticated client `stock`/`popularity` writes; set `orders` client `create` to `false` (all orders originate via server actions); restrict `authKeys` `get` and `keyRequests` `create` behind verified server routes/rate limits.
- **Harden AI HTTP Endpoints:** Enforce Firebase Auth / App Check tokens and per-user/IP Firestore-backed rate limits on `/api/chat` and `/api/ai/build-advisor/recommendations`.

---

## 4. Phased Roadmap & Priority Sequence

1. **Phase 1 — Multi-Instance Cache Coherence & Search/Builder Scaling:**
   - Implement `siteSettings/catalogMeta` (`catalogVersion` + brand/category facets), version-keyed caches across `builder-catalog.ts` / `inventory-fetcher.ts` / `public-products.ts`, tokenized search indexes for admin & `/parts`, and verify multi-instance parity before raising `maxInstances` in `apphosting.yaml`.
2. **Phase 2 — Orders Pagination & Sales Analytics Rollups:**
   - Paginate admin `orders` server-side with `.count()` queue badges, build `analyticsDaily` / `analyticsMonthly` rollups with historical backfill, decouple `SalesAnalytics`, and move Excel export to bounded server batches.
3. **Phase 3 — Prebuilt Summaries, `holdExpiresAt` Sweep & Checkout Contention:**
   - Paginate `/pre-builts` and admin prebuilt views, backfill `componentSummaries`, add `(status, paymentStatus, holdExpiresAt)` index for `runExpiredOrdersSweep`, and decouple `popularity` writes from checkout stock transactions.
4. **Phase 4 — Native Firestore TTL & Paginated Audit/Notification Views:**
   - Add `expiresAt` writers and `fieldOverrides` TTL rules in `firestore.indexes.json`, add `catalogVersion` to AI recommendation cache keys, convert `useAuditLogs` & `useUserAuditLogs` to cursor-paginated queries, and bound `pruneUserNotificationsServer`.
5. **Phase 5 — Legacy Retirement & Security Hardening:**
   - Verify legacy path retirement, tighten `firestore.rules`, and enforce auth + rate limiting on AI API routes.

---

## 5. Observability, Budgets & Rollout Discipline

- **Before Scaling `maxInstances > 1`:** Run matched cold/warm cache-coherence tests across independent cache contexts (`tests/multi-instance-cache-coherence.test.ts` and emulator suites) to prove zero stale catalog/price drift after mutations.
- **Operational Monitoring:** Configure GCP Billing budgets/alerts on Firestore reads, writes, deletes, storage, and index storage; monitor checkout transaction contention/retry logs, `/api/cron/expire-orders` scan counts, and TTL deletion backlogs.
- **Backup & Restore Drills:** Keep scheduled Cloud Firestore managed exports to `gs://studio-3150054754-c7d0b-private-backups` and run periodic test restores into a non-production project before every schema backfill.
