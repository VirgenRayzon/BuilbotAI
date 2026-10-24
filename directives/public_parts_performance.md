# Public parts catalog performance

## Read path

- `/parts` reads `listPublicPartsCatalog`, a ten-minute tagged Next data cache. The page stays dynamic, but repeat requests must not query all inventory categories.
- The catalog record contains only card/search/sort fields and the specification keys consumed by `checkCompatibility`. Product detail pages continue to use `getPublicProduct` for full descriptions, galleries and specifications.
- The cache miss queries all twelve inventory category collections with a Firestore field projection. Do not substitute this cached listing for reservation validation, which reads fresh stock and prices in a transaction.

## Invalidation

- Invalidate `public-parts-catalog` after committed part creation/edit, admin inventory changes, checkout/reservation stock deduction and reservation cancellation or archive stock return.
- Keep invalidation after the transaction. An invalidation failure must not report a committed write as failed; the ten-minute TTL is the fallback.
- If adding another inventory write path, connect it to `invalidatePublicPartsCatalog`. Preserve the existing builder catalog invalidation in `clearCatalogCache`.

## Verification

- Before this change, repeated local dev requests to `/parts` took about 4.7–5.2 seconds and transferred about 1.07 MB. The direct twelve-category Firestore read took 5.4 seconds for 321 public products.
- After this change, a cache miss took about 4.3 seconds; repeat responses took 0.3–0.7 seconds and transferred about 324 KB. The cold miss remains limited by Firestore and would need a dedicated read model to reduce further.
- Run typecheck and lint, then build. When the live dev server owns `.next`, set `QR_INVENTORY_TEST=true` for an isolated build output; the build still needs access to Google Fonts. Verify the catalog item count, compatibility filter and a product detail link in the browser.
