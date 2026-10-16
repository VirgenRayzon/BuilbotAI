# Inventory route performance verification

The 10.51-second soft-navigation screenshot was identified by the user as `/admin`; `/builder` was also slow. Do not substitute landing-page measurements for these routes. Use a production build on port 9002 and compare matched authenticated scenarios. Separate hard-navigation LCP from client-navigation image-readiness timing; the standard LCP observer does not automatically reset on a Next.js Link transition. Do not call a custom image-ready duration field INP or soft-navigation LCP.

## Measurement workflow

1. Stop this repository's dev server before building and serving production. Finish typecheck/lint before a build regenerates `.next/types`.
2. Run `npm run build`, then `npm run start -- -p 9002`. Do not run browser tests concurrently with performance sampling.
3. Use `node execution/audit_inventory_performance.mjs http://127.0.0.1:9002 tmp/performance/inventory.json 3`. It reads existing `E2E_USER_*` / `E2E_SUPER_ADMIN_*` credentials from the environment, signs in, and samples restored sessions without saving credentials/storage. `AUDIT_ROLE=USER` or `SUPER_ADMIN` and `AUDIT_VIEWPORT=desktop` or `mobile` can narrow diagnostic runs. Full comparisons should use the same matrix and conditions.
4. The cold sample clears browser HTTP cache while retaining the authenticated session; it does not force a cold Firebase/hosting/server cache. Warm samples reuse browser cache. Programmatic Next Link transitions report first visible inventory-image readiness separately. Compare medians and disclose backend variability rather than cherry-picking a fast sample.

## Constraints learned from the audit

- The screenshot's image class belongs to `OptimizedImage` in stock cards. Its priority images already start at opacity 1; the three-second placeholder fail-safe does not impose a universal three-second image delay. Inspect request start and image mount times before changing animations.
- Keep only the first grid row at high image priority (one card on mobile, according to the existing columns at wider breakpoints). `sizes` must match the actual grid, gutters, and Builder sidebar. Preserve image quality, gallery originals, and native lazy loading on later cards.
- Keep the admin's stock UI eager; defer inactive tab modules with `Tabs keepMounted={false}`. Next.js requires literal option objects in `dynamic()` calls; share a loading component, not the options object. Audit-log reads can wait until the audit tab is selected, while existing role restrictions remain authoritative.
- Keep card/trigger markup eager and mount expensive detail/editor code on first interaction. After opening, keep the existing component mounted so drafts, gallery state, busy-close prevention, and save handlers retain their behavior. The same applies to the Builder chat: initialize it open after its first trigger, and preserve its state when it closes.
- `src/lib/server/builder-catalog.ts` owns the existing ten-minute public catalog cache. Both the server route and the existing `getCachedInventory` action delegate to it. `clearCatalogCache` must invalidate this cache AND the existing AI inventory cache. Preserve all serialized fields, including galleries, and the archive filter. Do not import the broad AI actions module into a server page merely to read the catalog; that pulls unrelated Genkit/OpenTelemetry initialization into the route.
- `/builder` is dynamic rather than a build-time inventory snapshot. Its server-provided public catalog must still sit behind the existing client `RouteGuard`; server fetching is not authorization. Preserve the client retry/empty-state behavior on a failed prefetch. Do not expose archived/private staff data or use a cached role as authority.
- Initial navigation should not automatically download other large protected dashboards before inventory. Private header links disable automatic prefetch and prefetch on pointer/keyboard intent. Verify both the initial waterfall and subsequent navigation; keep destinations and access checks unchanged.
- Do not replace the admin's live stock with a stale public catalog merely to improve LCP. Preserve fresh stock, checkout/reservation validation, role verification, staff markers, and Firebase rules. Larger pagination/read-model or server-auth changes need a separate architecture discussion.

## Regression checks

Run typecheck, clean lint, production build, and Playwright. Exercise all roles; refresh and back/forward; sign-out listener teardown; delayed profile verification; details/gallery open-close-reopen; edit/add cancellation without writes; every permitted admin tab; analyzer rendering; chat open-close with a retained draft; and mobile/desktop image priority, sizing, and overflow. Review console diagnostics and screenshots. Firestore stream cancellations during navigation should be distinguished from current-page permission or data failures.
