# Public parts catalog performance

## Read path

- The default `/parts` path reads `listPublicPartsCatalog`, a ten-minute tagged Next data cache. The page stays dynamic, but repeat requests must not query all inventory categories.
- With `NEXT_PUBLIC_PUBLIC_CATALOG_INDEXED_ENABLED=true`, the initial page and next/previous page requests use `listPublicCatalogPage`: eight products ordered by availability, creation date, and product ID, plus an aggregate count. The Firestore query is bounded to nine documents. Production index readiness and the query-field backfill were verified on 2026-11-06 before enabling the flag.
- Opening filters or entering search loads the complete cached catalog so arbitrary substring, brand, compatibility, availability, and alternate-sort behavior remains exact. Those interactions still read all active products on a cold cache. A dedicated search/facet index is required before claiming the whole public catalog is bounded.
- Product detail related items read only their category. After the indexed flag is enabled, they use a nine-document category query. Before then, the category-scoped fallback includes legacy records missing `isArchived`.
- The catalog record contains only card/search/sort fields and the specification keys consumed by `checkCompatibility`. Product detail pages continue to use `getPublicProduct` for full descriptions, galleries and specifications.
- The cache miss queries all twelve inventory category collections with a Firestore field projection. Do not substitute this cached listing for reservation validation, which reads fresh stock and prices in a transaction.
- The indexed path requires `inventoryQueryVersion`, `isArchived`, `inStock`, `createdAtSort`, and `publicCatalogEligible`. Product creation, edits, checkout, reservations, and stock restoration maintain the availability field. The backfill reports eligible and in-stock counts for parity checks.

## Invalidation

- Invalidate `public-parts-catalog` after committed part creation/edit, admin inventory changes, checkout/reservation stock deduction and reservation cancellation or archive stock return.
- Keep invalidation after the transaction. An invalidation failure must not report a committed write as failed; the ten-minute TTL is the fallback.
- If adding another inventory write path, connect it to `invalidatePublicPartsCatalog`. Preserve the existing builder catalog invalidation in `clearCatalogCache`.

## Verification

- Before this change, repeated local dev requests to `/parts` took about 4.7–5.2 seconds and transferred about 1.07 MB. The direct twelve-category Firestore read took 5.4 seconds for 321 public products.
- After this change, a cache miss took about 4.3 seconds; repeat responses took 0.3–0.7 seconds and transferred about 324 KB. The cold miss remains limited by Firestore and would need a dedicated read model to reduce further.
- Run typecheck and lint, then build. When the live dev server owns `.next`, set `QR_INVENTORY_TEST=true` for an isolated build output; the build still needs access to Google Fonts. Verify the catalog item count, compatibility filter and a product detail link in the browser.
- Run the Auth/Firestore emulator suite with `firebase.qr-test.json` and `tests/admin-inventory-queries.integration.ts`. It checks bounded public cursor pages, availability ordering, related-item scope, and the admin permissions query. Check deployed composite-index readiness separately; the emulator does not prove production index readiness.

## Rollout gate

1. Deploy the additive writers and `firestore.indexes.json`; wait for every new index to become ready.
2. Run `execution/backfill_inventory_query_fields.ts` in dry-run mode and compare active, archived, eligible, and in-stock counts with the legacy catalog. Apply only with the completed private backup manifest documented in `directives/inventory_performance.md`; rerun dry-run until `pending` is zero.
3. Enable the admin and public flags independently in a test deployment. Verify full catalog IDs/counts, search, brands, compatibility, price/stock changes, archive/restore, checkout, mobile layout, and page boundaries. Keep the flags off if parity differs.
4. Collect matched cold/warm p50 and p95, bytes, and Firestore reads across normal traffic before changing `apphosting.yaml` instance capacity. Increase `maxInstances` only after shared-cache behavior and invalidation across instances are verified.

The 2026-11-06 production parity check matched all 329 active public product IDs, and a 42-page cursor traversal matched the legacy ordering. A ten-request response baseline was recorded immediately before public activation; repeat the same method after the flagged revision serves and report its conditions and limits.
