# Inventory and Public Catalog Scaling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make initial admin inventory and public catalog reads scale with the visible result set while preserving complete filtering, counts, compatibility, live stock updates, and checkout correctness.

**Architecture:** Keep Firestore as the source of truth. Normalize catalog query fields, expose bounded query APIs and small listing projections, and hydrate full product details only when needed. Retain fresh transactional Firestore reads for checkout and reservations. Roll out the admin and public paths separately, with the existing routes available as a fallback until parity and performance are verified.

**Tech Stack:** Next.js 15 App Router, React 19, Firebase client and Admin SDKs, Firestore indexes/rules, Zod, Node tests, Playwright.

**Spec:** The user's 2026-11-06 screenshot of the two high-priority inventory/catalog improvements, `directives/inventory_performance.md`, `directives/public_parts_performance.md`, and `docs/inventory_performance_audit.md`.

## Scope and current evidence

- `useInventoryParts` opens 12 unbounded listeners. Admin stock then filters, sorts, counts, and paginates the fully loaded array in the browser. The same hook also serves admin prebuilt building and archive views; changing it in place would break consumers.
- `/parts` loads a cached full catalog. A cache miss projects fields from all 12 inventory collections and filters archived records afterward. The recorded cold miss was about 4.3 seconds for 321 public products; repeat requests were 0.3–0.7 seconds. These are local observations, not a new latency guarantee.
- The prior `2026-11-05-database-integrity-and-scalability.md` plan is marked complete, but `getBuilderCatalogPage` still calls `getBuilderCatalog()` and filters the entire catalog in memory. The browser payload is bounded; the server's Firestore read is not. Treat that as an adjacent follow-up, not proof that this plan's bounded-read goal is already met.
- This plan covers the two improvements in the screenshot. App Hosting autoscaling, load balancing, shared distributed cache, and background workers belong to a separate infrastructure release; scaling out instances before cache coherence is proven can increase cold reads.

## Global constraints

- Preserve the user-owned server on port 9002; use isolated build output when production verification would conflict with it.
- Do not change staff authorization, Firebase rules access, fresh stock/price validation in checkout, PHP pricing, archive visibility, or product detail behavior.
- Preserve search by name/brand/SKU/product ID, multiple categories, brand and availability filters, sort order, accurate counts, compatible-part filtering, selected products, and archive/restore workflows. A query that silently searches only the current page is a regression.
- Firestore cannot efficiently reproduce arbitrary substring search over the current fields. Choose and prove a search projection or bounded external index before replacing the existing search behavior. Do not fetch every document and call it pagination.
- New server inputs use Zod; new TypeScript avoids `any`. Keep business/query logic outside UI components.
- After each implementation phase: run `npm run typecheck`, `npm run lint`, and relevant focused tests. Run `npm run build` and route tests before rollout.
- Schema migrations are dry-run first, resumable, and require a verified private backup before live writes. Additive writers and indexes precede reader cutover.

## Review focus

1. Legacy documents with missing `isArchived` must remain visible or archived according to the existing behavior until backfill parity is verified (Phase 1).
2. A product changed while browsing must update the current page without duplicating or permanently hiding another product at a page boundary (Phase 2).
3. Search and compatibility filters must consider every matching product, including products beyond page one (Phases 2–3).
4. Product create, edit, archive, stock reservation, cancellation, and restore must update the read model and invalidate public caches after commit (Phase 3).
5. Counts and brand choices must describe the full filtered result, not only the current page (Phases 2–3).

---

## Phase 0 — Baseline and query contract

**Files:** `execution/audit_inventory_performance.mjs`, `directives/inventory_performance.md`, `directives/public_parts_performance.md`, new catalog query contract tests under `src/lib/server/` or `tests/`.

- [ ] Record matched admin and `/parts` cold/warm baselines on the same production build and test accounts. Capture p50/p95 from at least 10 samples, first visible result, total visible image readiness, response bytes, Firestore document reads, and query count; keep browser-cache and server-cache states explicit.
- [ ] Inventory every `useInventoryParts`, `listPublicPartsCatalog`, `listPublicProducts`, and `getBuilderCatalog` consumer. Write down which need all records, an accurate count, live updates, a compact card, or full product details.
- [ ] Save parity fixtures for multi-category selection, substring search, sorting ties, compatibility, archived products, stock changes, and empty results. Measure on 321, 5,000, and 50,000 product emulator fixtures; do not use production for synthetic load.
- [ ] Establish acceptance gates: no missing/extra product IDs or count mismatches on parity fixtures; initial page reads and bytes grow with page size rather than total catalog size; p95 does not regress for warm traffic. Compare actual results with the recorded 4.3-second `/parts` cold miss instead of promising a target now.

**Exit gate:** Baseline and behavior contract are recorded before changing readers.

## Phase 1 — Normalize and index catalog query fields

**Files:** `src/lib/inventory-paths.ts`, catalog write paths in `src/firebase/database.ts` and `src/app/product-actions.ts`, `firestore.indexes.json`, new `execution/backfill_inventory_query_fields.ts`, focused emulator tests, `directives/inventory_hierarchy_migration.md`.

- [ ] Define a versioned query projection for each inventory item: explicit boolean `isArchived`, stable sort keys, stock/availability key, normalized exact-search tokens, and stable ID tie-breaker. Keep full specifications/galleries in canonical documents. Decide whether arbitrary substring matching requires a separate search index; document its update and deletion behavior.
- [ ] Add tests for new, archived, restored, and legacy missing-field documents; verify equivalent results and deterministic ordering when sort values tie.
- [ ] Add the required composite indexes for the actual category, archive, availability, brand, and sort queries. Use Firestore Query Explain or emulator query assertions to catch unintended collection scans and missing indexes.
- [ ] Update every catalog write path to maintain the query fields. Create a dry-run, checkpointed backfill with project validation and a private-backup prerequisite; compare active/archive counts before and after applying it.
- [ ] Deploy additive writers and indexes, wait for index readiness, backfill, verify parity, then allow reader cutover. Keep a legacy reader fallback until old documents are normalized.

**Exit gate:** Query fields are complete and indexed; active/archive counts match the legacy view.

## Phase 2 — Bound admin inventory reads

**Files:** new `src/lib/server/admin-inventory-queries.ts`, new `src/app/admin/inventory-query-actions.ts`, new `src/app/admin/hooks/use-inventory-page.ts`, `src/app/admin/hooks/use-inventory.ts`, `src/app/admin/components/stock-tab.tsx`, `src/app/admin/components/archive-tab.tsx`, `src/app/admin/page.tsx`, focused tests.

- [ ] Define a Zod-validated staff query accepting selected categories, brands, availability, search, sort, page size (default 24, maximum 100), and opaque cursor. Return compact cards, `nextCursor`, `hasMore`, accurate filtered count, and complete brand facets. Authorize staff on the server; do not trust client filters for access.
- [ ] Test category/filter/sort/search parity against Phase 0 fixtures, including zero categories, multiple categories, equal sort values, stock flips, and page-boundary insertions. Confirm no full-category query is used merely to slice a page afterward.
- [ ] Replace the stock tab's full-array dependency with the page hook. Reset cursor on filter changes, cancel or ignore stale responses, and fetch full details only for the opened editor/detail view. Keep selected IDs stable across pages and bulk actions explicitly scoped to selected IDs.
- [ ] Scope live updates to the visible query/page or use focused document listeners for currently visible items; reconcile membership changes by refreshing the page and count. Keep archive, prebuilt-builder, and any other all-inventory consumers on the existing hook until each has its own compatible read path.
- [ ] Run authenticated admin Playwright tests for stock/archive, grid/table, add/edit/archive/restore, bulk selection, mobile, and sign-out listener cleanup. Compare reads, bytes, and p95 with Phase 0.

**Exit gate:** Admin stock first page is bounded and functionally equivalent; other consumers are not silently truncated.

## Phase 3 — Bound public catalog cache misses

**Files:** `src/lib/server/public-products.ts`, new `src/lib/server/public-catalog-queries.ts`, `src/app/parts/page.tsx`, `src/components/public-parts-catalog.tsx`, `src/app/parts/[productId]/page.tsx`, catalog mutation/invalidation paths, `firestore.indexes.json`, focused tests.

- [ ] First apply indexed `isArchived == false` filters to canonical inventory queries after Phase 1 parity. Measure cold read count and latency. Do not build a second collection unless the remaining miss cost warrants it.
- [ ] If necessary, create one compact public listing document per product with only card/search/sort/compatibility fields. Build an idempotent backfill and reconciliation job; dual-write or transactionally update the projection on all product and stock mutations, and remove or mark archived products consistently.
- [ ] Replace the `/parts` full-catalog response with a bounded, filter-aware page query. Preserve the existing 8-item visible page, full-result count, brand/category facets, substring search, compatibility filtering, and sorting. Use an indexed search projection/service if necessary; reject a fetch-all-then-slice implementation.
- [ ] Change product detail related-item lookup to a small category-scoped query so it does not call `listPublicPartsCatalog()` just for related products. Keep `getPublicProduct` as the authoritative detail read.
- [ ] Keep public cache invalidation after committed mutations, with TTL as fallback. Test concurrent edit/archive/stock changes, cache invalidation, two server contexts, and transactional checkout freshness.
- [ ] Run `/parts` and product-detail Playwright tests, emulator parity tests at all fixture sizes, typecheck/lint/build, and compare cold and warm p95, bytes, and Firestore reads with Phase 0.

**Exit gate:** A cold public page reads only the bounded query/projection needed for the result; all search and compatibility results remain complete.

## Phase 4 — Rollout and capacity check

**Files:** `directives/inventory_performance.md`, `directives/public_parts_performance.md`, `docs/inventory_performance_audit.md`, deployment configuration only if a separately approved capacity change follows.

- [ ] Roll out admin and public readers independently behind a reversible flag or equivalent controlled release. Keep schema/index additions during rollback; switch readers back if counts, freshness, permissions, or p95 regress.
- [ ] Monitor first page p50/p95, full image readiness, Firestore reads per visit, index reads, cache hit rate, error rate, and catalog parity for at least one normal traffic cycle.
- [ ] Run a bounded emulator load test and a small deployed smoke test. Only after cache behavior is proven across instances, prepare a separate App Hosting autoscaling change; current `apphosting.yaml` caps `maxInstances` at 1.
- [ ] Update the directives with measured before/after values, fixture sizes, remaining whole-catalog consumers, and any deferred search or builder work.

**Exit gate:** Measured gains and functional parity are documented. No percentage improvement is claimed without matched observations.

## Execution order and release boundaries

Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4. Each phase has its own tests and rollback boundary. Phase 2 can deploy before Phase 3 once Phase 1 is complete. The builder's server-side fetch-all page implementation and App Hosting scale-out should be scheduled as separate follow-up plans, informed by the measurements from this work.
