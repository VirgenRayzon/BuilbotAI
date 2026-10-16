# Admin and builder production performance audit — 16 October 2026

The user identified `/admin` as the route in the supplied 10.51-second SOFT NAV screenshot and reported similar delays in `/builder`. This follow-up measures those routes directly. The [landing-page report](landing_performance_audit.md) describes the earlier public-page work; its results are not substituted for inventory-route results.

Cold-load admin LCP improved by approximately 29–31%. Builder cold-load improvement was smaller, at 3–12%. Initial bundles are substantially smaller, but warm-load results are mixed, including regressions. **The 2.5-second target remains unmet.** These changes have not been deployed.

## Matched production measurements

Both revisions were built with `npm run build` and served with `npm run start -- -p 9002`. The protected-route baseline already contains the earlier landing-page optimizations; it precedes the inventory-specific changes below.

Each revision has 36 samples: three runs × two routes × two viewports × three navigation modes. Desktop is 1440 × 900 at DPR 1 and normal CPU; mobile is 390 × 844 at DPR 2 and 4× CPU slowdown. Both use CDP throttling at 1.6 Mbps download, 750 Kbps upload, and 150 ms latency. Chromium version: 148.0.7778.96. Performance sampling ran separately from functional tests and builds.

The script signs in before throttled sampling, then retains the authenticated session. Cold means browser HTTP cache cleared; warm reuses that cache. Auth/profile restoration and live Firebase requests still occur on hard navigation. Server/Firebase caches and internet response times are uncontrolled. These are local production lab results, not hosted after-results, Lighthouse scores, field Web Vitals, or login-duration measurements. Three samples do not establish statistical significance.

| Hard-navigation LCP, median | Before | After | Result |
| --- | ---: | ---: | --- |
| Admin desktop, cold | 9.128 s | 6.308 s | 30.9% lower |
| Admin mobile, cold | 9.624 s | 6.880 s | 28.5% lower |
| Builder desktop, cold | 8.008 s | 7.748 s | 3.2% lower |
| Builder mobile, cold | 8.008 s | 7.072 s | 11.7% lower |
| Admin desktop, warm | 3.152 s | 5.112 s | 62.2% higher |
| Admin mobile, warm | 4.240 s | 3.532 s | 16.7% lower |
| Builder desktop, warm | 2.768 s | 3.364 s | 21.5% higher |
| Builder mobile, warm | 3.352 s | 3.900 s | 16.3% higher |

Warm regressions are included rather than attributed entirely to backend variance. Final admin desktop cold samples were 8.540, 6.264, and 6.308 seconds; warm samples were 5.112, 2.888, and 5.252 seconds. The variable Firebase response path and changed prefetch behavior limit causal attribution. Smaller bundles alone have not solved restored-session loading.

| Supporting measure | Before | After |
| --- | ---: | ---: |
| Next.js admin First Load JS estimate | 770 kB | 409 kB |
| Next.js builder First Load JS estimate | 633 kB | 416 kB |
| Desktop admin cold script encoded bytes, observation window | 968,752 B | 453,963 B |
| Desktop builder cold script encoded bytes, observation window | 790,604 B | 461,721 B |
| Mobile admin cold long-task blocking | 538 ms | 302 ms |
| Mobile builder cold long-task blocking | 436 ms | 278 ms |
| Mobile admin warm long-task blocking | 361 ms | 250 ms |
| Mobile builder warm long-task blocking | 292 ms | 323 ms |
| Admin desktop cold CLS | 0.00946 | 0.00946 |
| Builder desktop cold CLS | 0.00653 | 0.00583 |
| Both routes, mobile cold CLS | 0.00281 | 0.00281 |

Blocking sums `max(longTask.duration - 50, 0)` in the observation window; it is not Lighthouse TBT. Script bytes include automatic route prefetches, which were reduced, and are not directly equivalent to the build estimate. Cross-origin Firebase responses do not expose reliable encoded sizes through Resource Timing, so no Firestore bandwidth/read-count reduction is claimed.

## Soft navigation and the supplied screenshot

The baseline admin product-image class matches the screenshot (`ease-out opacity-100 object-contain transition-transform duration-500`). Its priority image already starts at full opacity; the three-second fallback timer in `OptimizedImage` is not a mandatory rendering delay. Animations were retained.

The installed browser and observer setup do not provide a comparable native soft-navigation LCP series. The profiler therefore clears the old document's LCP entries on a Next Link transition and reports a custom visible-inventory-image readiness duration. It checks the destination pathname and inventory image elements; the baseline diagnostic selector was broader, so no before/after soft-navigation improvement is claimed. Automatic prefetch was also changed, affecting transition conditions. See [Chrome's soft-navigation measurement documentation](https://developer.chrome.com/docs/web-platform/soft-navigations).

Final custom image-readiness medians after a client transition from `/about`:

| Route | Desktop | Mobile |
| --- | ---: | ---: |
| Admin | 4.804 s | 2.915 s |
| Builder | 1.397 s | 1.584 s |

These durations are neither LCP nor INP. The automated transition clicks an existing Next Link without pointer hover; real pointer/focus intent can initiate prefetch earlier. The supplied 10.51-second value remains a separate observation.

## Evidence and implemented changes

1. **Inactive admin features inflated the initial bundle.** Prebuilt, reservation, sales, archive, audit, management, AI settings, and site-content panels now use `next/dynamic`; the stock panel stays eager. Existing `keepMounted={false}` prevents inactive panels from rendering. Audit-log subscription waits for the audit tab. All eight permitted secondary tabs were exercised after splitting.
2. **Every card imported full dialog code.** Lightweight wrappers now load the existing editor/product-details implementation on first opening. Card/trigger markup stays eager. The loaded component stays mounted afterward, preserving form/gallery state and existing save/close behavior. Add/edit dialogs were opened and canceled without stock writes.
3. **Builder loaded optional AI/chart features initially.** Chat loads on its first button click and retains its draft across closing/reopening. The FPS chart loads when the analyzer is selected. No chat, chart, animation, or analyzer feature was removed.
4. **Builder catalog fetch started late.** Baseline server-action requests began around 5.3 seconds into cold desktop navigation and completed around 7.1–7.3 seconds, transferring approximately 194 kB of catalog data. The dynamic server route now supplies the same public catalog to its client view, removing that post-hydration action request. A dedicated server-only catalog module avoids bootstrapping unrelated Genkit actions. The original ten-minute cache policy, public DTO/gallery fields, archive filter, and both catalog/AI cache invalidations remain. A failed server prefetch retains the existing client fetch path. The full catalog payload still has a delivery cost; this change did not eliminate Auth/profile gating.
5. **Image hints did not match the actual grid.** Inventory uses viewport-specific first-row priority: one card on mobile and the existing first-row count at larger breakpoints. Those images request high fetch priority; later cards retain native lazy loading. Responsive `sizes` reflects gutters, columns, and the builder sidebar. Originals, optimizer quality settings, galleries, aspect ratios, and layouts are unchanged. This follows the installed-version [Next.js 15 image API](https://nextjs.org/docs/15/app/api-reference/components/image).
6. **Navigation prefetched other large dashboards during initial loading.** Header tab links now disable automatic viewport prefetch and prefetch on pointer/focus intent. The logo also disables automatic prefetch. The final cold samples no longer fetch the advisor/prebuilt route modules just because their links are visible. Destinations and access checks are unchanged. This trades some speculative navigation readiness for less competing initial traffic; transition timings must be assessed alongside cold loading.

## Files changed in this follow-up

| Files | Purpose |
| --- | --- |
| `src/app/admin/page.tsx`, `src/app/profile/hooks/use-audit-logs.ts` | Split inactive panels and defer audit subscription |
| `src/components/add-part-dialog.tsx`, `add-part-editor.tsx`, `part-details-dialog.tsx`, `part-details-content.tsx`, `ui/deferred-dialog.tsx` | First-use dialog loading around existing implementations |
| `src/app/builder/page.tsx`, `builder-page.tsx`, `hooks/use-inventory-query.ts` | Dynamic server catalog handoff with client fallback |
| `src/lib/server/builder-catalog.ts`, `src/app/actions.ts` | Share existing catalog/cache without importing broad AI initialization |
| `src/components/deferred-builder-chat.tsx`, `builder-floating-chat.tsx`, `chat/hooks/use-floating-chat.ts`, `bottleneck/dual-sidebar-analyzer.tsx` | Defer chat and FPS chart while retaining state |
| `src/hooks/use-inventory-image-count.ts`, `src/lib/inventory-image-sizes.ts`, admin `stock-tab.tsx`, builder `inventory-view.tsx`, `inventory-part-card.tsx`, `part-card.tsx`, `ui/optimized-image.tsx` | Actual first-row image priority and responsive sizes |
| `src/components/header.tsx` | Prefetch on navigation intent |
| `tests/auth-role-navigation.spec.ts` | Six additional production regression cases |
| `execution/audit_inventory_performance.mjs`, `directives/inventory_performance.md`, this report | Repeatable audit, evidence, and constraints |

The editor/details moves retain existing large implementations; they are not a redesign or a broad cleanup of legacy component size/types. No dependencies were added or removed in this follow-up.

## Validation and artifacts

- Production build, separate TypeScript check, and lint pass with zero TypeScript/ESLint errors or warnings. Next prints its lint-command deprecation notice.
- Full production Playwright suite: **23 passed**, no skipped tests. Includes all roles, refresh/back/forward, unauthorized-route redirects, delayed profile verification without customer-navigation flashes, logout, advisor job retention, landing preload/carousel/themes, details reopen, admin editor cancellation/all tabs, analyzer/chat draft, mobile/desktop image priority and sizing, overflow, and existing specification/export checks. The imported Node unit tests also pass.
- All 36 final performance samples recorded zero captured console warnings/errors or page errors. Baseline included one aborted catalog request and three Firestore transport warnings during navigation. Zero final captured diagnostics does not establish absence of every possible backend error.
- Before/after screenshots for both routes and both viewports were visually inspected. Layouts, stock labels, controls, and imagery remain consistent.
- Firebase rules, profile confirmation, role decisions, staff session markers, and RouteGuard are unchanged. Admin retains its live category listeners; checkout/reservation stock validation is unchanged. No performance tests mutate inventory or submit an AI request.
- Raw data: `tmp/performance/inventory-before.json` and `inventory-final.json`, each with 36 records, plus matching `-admin-desktop.png`, `-admin-mobile.png`, `-builder-desktop.png`, and `-builder-mobile.png` screenshots. Interrupted intermediate samples are excluded.

Reproduce after finishing functional tests, against production on port 9002:

```powershell
npm run build
npm run start -- -p 9002
# Second terminal; E2E account variables come from the existing environment/.env.
node execution/audit_inventory_performance.mjs http://127.0.0.1:9002 tmp/performance/inventory-recheck.json 3
```

## Remaining work, prioritized by likely impact

1. **Profile and redesign the verified-session critical path as a separate architecture change.** The remaining path includes JS bootstrap, Firebase identity lookup, a server-confirmed profile snapshot, and then protected content. Final desktop builder images mount around 7.6 seconds despite the catalog already being supplied by the server. Do not remove verification, trust stale roles, or show protected dashboards before authorization. A server-verified session strategy/provider split needs explicit design and security review.
2. **Reduce inventory transfer/read volume while preserving semantics.** Admin waits for initial results across 12 category listeners; builder transfers the full public catalog. Consider a stable server-maintained summary or pagination with complete search/filter/count behavior and detail hydration. Preserve archived access, galleries, compatibility inputs, cache invalidation, and fresh transactional stock validation. Arbitrary query limits or a stale cached admin stock view are not acceptable substitutes. Firestore listeners deliver an initial snapshot and subsequent changes; review their scope using [Firebase's listener documentation](https://firebase.google.com/docs/firestore/query-data/listen).
3. **Repeat the matrix on the deployed revision and investigate warm regressions.** Test pointer/focus prefetch as well as direct transitions, instrument profile/inventory readiness, and collect a larger matched sample before claiming uniform improvement. Verify App Hosting's image adapter, responsive preload, compression, and cache behavior again. No hosted post-change performance claim is made.
4. **Collect real-device field Web Vitals.** Lab long tasks and custom image readiness do not replace field INP or the user's Chrome soft-navigation measurement. Use those data to decide the next high-impact change.
