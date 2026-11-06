# Inventory and catalog scaling rollout — 2026-11-06

Project: `studio-3150054754-c7d0b`. Both pagination flags are enabled in `apphosting.yaml`. App Hosting rollout `rollout-2026-11-06-003` succeeded after the public flag change.

## Migration and parity

- A managed full Firestore export completed successfully at `gs://studio-3150054754-c7d0b-private-backups/backups/inventory-rollout-2026-11-06`. The bucket had public access prevention and uniform bucket-level access enabled. The local manifest is ignored by Git.
- All 333 inventory documents received the versioned query fields. The post-migration dry run found `pending: 0`; 329 products were active and 4 archived. Of the active products, 327 had stock.
- The indexed admin and public ID sets each matched all 329 legacy active IDs, with no missing or extra IDs. A complete public cursor traversal returned the same order across 42 pages.
- The manager-authenticated query returned eight items on each of its first two pages and a count of 329. The live admin browser check also paged and found a page-two product through the complete search fallback.
- The live public browser checks passed for page two, search beyond page one, desktop filters, and mobile stock filtering. A product detail route returned HTTP 200 with the new related-item query.
- Repeatable browser checks are in `tests/inventory-catalog-pagination.spec.ts`; set `E2E_SCALING_ROLLOUT=true` and `E2E_BASE_URL` for an indexed deployment. Both tests passed on the final hosted revision.

## Matched HTTP response sample

Ten `/parts` GET requests were made from the same client before and after public activation. The first request in each run is shown separately; the warm median uses requests 2–10. These are small HTTP samples, not browser LCP or field latency.

| Measure | Before | After |
| --- | ---: | ---: |
| Warm response bytes | 354,227 | 156,778 |
| Warm median duration | 739 ms | 594 ms |
| First request duration | 1,891 ms | 5,490 ms |

The warm payload was 55.7% smaller and the sampled warm median was 145 ms lower. The first request after activation was slower, likely reflecting a newly deployed cold revision; this run does not establish a cold-cache latency gain. The raw ten-request records are in ignored local files `.tmp/public-catalog-before.json` and `.tmp/public-catalog-after.json`.

## Remaining limits

- Admin substring search and advanced filters still switch to the full inventory listener. Public search and advanced filters still load the complete cached catalog so matching remains exact. These interactions are not bounded by page size.
- App Hosting remains capped at one instance. Shared-cache behavior, Firestore read counts, browser Web Vitals, and a larger traffic cycle were not measured, so load-balancing capacity was not changed.
- The older broad admin regression test has stale selectors: it first picked a hidden header image and, after that selector was corrected locally, looked for `tab` roles where the current sidebar uses buttons. A focused production stock pagination/search test passed; update the broad test before using it as a release gate.
