# Production performance audit — 16 October 2026

The changes reduce the landing page's measured cold-cache LCP from **4.184 to 3.408 seconds on desktop** and **4.936 to 4.176 seconds on mobile**. Mobile long-task blocking time fell by 51%. The 2.5-second cold-load target remains unmet under the throttling described below. All 17 Playwright tests in this phase, production build, typecheck, and lint pass. These changes are local and have not been deployed to the hosted app. The subsequent [admin/builder audit](inventory_performance_audit.md) covers the screenshot's confirmed route, further changes, mixed warm-load results, and the expanded 23-test suite.

## Measurement conditions and limits

- Built the unchanged baseline and final source with `npm run build`; served each with `npm run start -- -p 9002`. Stopped the existing development server first.
- Headless Chromium through the installed Playwright, Chrome DevTools Protocol network/CPU emulation, Resource Timing, and buffered Performance Observers. These are lab measurements, not Lighthouse scores or field Web Vitals.
- Desktop: 1440 × 900, DPR 1, normal CPU. Mobile: 390 × 844, DPR 2, touch/mobile emulation, 4× CPU slowdown.
- Both: configured 1.6 Mbps download, 750 Kbps upload, 150 ms latency. Local response times do not model the remote hosting stack.
- Three fresh browser contexts per viewport; each cold navigation followed by a warm navigation in the same context. Results are medians. Browser cache is controlled; server/CDN cache is not. Metrics were sampled until 12 seconds after `load`.
- Final comparison ran after functional tests finished. A separate traced sample was excluded from the comparison. An earlier intermediate run is also excluded.
- The supplied 10.51-second screenshot is marked SOFT NAV and has a different image class from the landing hero reproduced here. The user subsequently identified its route as `/admin`, with similar delays in `/builder`; those routes are measured in the follow-up report. It is not an equivalent landing-page baseline. No field INP claim is made.

## Results

| LCP scenario | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| Desktop, cold browser cache | 4.184 s | 3.408 s | 18.5% |
| Desktop, warm browser cache | 0.324 s | 0.308 s | 4.9% |
| Mobile, cold browser cache | 4.936 s | 4.176 s | 15.4% |
| Mobile, warm browser cache | 1.016 s | 0.744 s | 26.8% |

| Supporting measure | Before | After |
| --- | ---: | ---: |
| Desktop cold FCP | 1.176 s | 1.104 s |
| Mobile cold FCP | 1.244 s | 1.152 s |
| Desktop CLS | 0.00328 | 0.00328 |
| Mobile CLS | 0 | 0 |
| Mobile cold long-task blocking time in observation window | 1,458 ms | 708 ms |
| Mobile warm long-task blocking time in observation window | 678 ms | 109 ms |
| Next.js landing route First Load JS estimate | 350 kB | 314 kB |
| Desktop script encoded bytes in observation window | 590,507 B | 499,382 B |
| Mobile script encoded bytes in observation window | 523,351 B | 432,313 B |

The observation-window blocking measure sums `max(task.duration - 50, 0)` over observed long tasks. It is not Lighthouse's FCP-to-TTI TBT. Script-byte totals include any route prefetches in the window; desktop and mobile therefore differ. They are not the same measure as Next.js's build estimate.

Final public-page samples recorded zero console errors, zero console warnings, and no failed image downloads. Some warm reloads aborted the previous document's Firestore Listen requests (`net::ERR_ABORTED`); these occurred on navigation, also appear in the baseline, and are not broken image/API responses.

## Findings and implemented changes

1. **Late hero discovery was confirmed.** The original landing page returned `null` while Auth restored, so its statically generated HTML contained neither the hero image nor its preload. The existing `priority` prop only became useful after hydration and Auth resolution. Median mobile image request start moved from 4.433 s to 0.184 s; the final resource finished downloading at 0.592 s. Desktop request start moved from 3.695 s to 0.165 s. A small server route now emits responsive preload candidates matching the actual `next/image` component. Tests confirm exactly one hero download at each viewport. Auth/profile checks and redirects remain intact.

2. **The hero file itself was already compact.** Its source is a 43,208-byte WebP. The unchanged local image optimizer serves approximately 20.3 kB for desktop and 12.4 kB for mobile in these runs; a header check confirmed AVIF delivery locally. No source images were removed, replaced, or recompressed. The hero retains priority and now explicitly requests high fetch priority. Feature images retain native lazy loading, responsive sizing, and reserved space. The first two cards in the lower-page carousel no longer receive initial-load priority.

3. **Noncritical code and requests were on the initial path.** The global advisor provider imported AI recommendation/critique hooks even for anonymous visits. It now loads its scope on the first advisor visit and retains that scope on later client navigation, keyed by Auth UID. Notification widgets and their order/date dependencies load when rendered in authenticated navigation. The prebuilt carousel's code, collection listener, and per-card stock lookups wait until the section approaches the viewport. The anchor exists before loading, with placeholder space; the carousel, all systems, stock behavior, controls, and animations remain available. Mantine's documented package-import optimization is enabled; it uses Next.js 15's experimental configuration field. No dependency was added.

4. **A duplicate settings subscriber was removed.** `AppLayout` now consumes `SiteSettingsProvider`, preserving maintenance behavior. The provider payload is typed. Firestore can coalesce identical network listeners, so this change is not claimed to halve network reads or billing. Firebase's app initialization already uses a singleton; repeated app creation was not established as a cause.

5. **Fonts had external stylesheet dependencies.** The same Inter and Space Grotesk families and four weights now use `next/font/google` with swap and local production delivery. The production HTML no longer requests Google Fonts stylesheets. Tailwind and Mantine use the same font variables. Before/after screenshots preserve typography and layout.

6. **Regression checks found two existing UI/runtime issues.** Favorites called collection hooks inside a map, risking changing Hook order and producing the repository's lint warning. A typed custom hook preserves the same inventory sources with a fixed Hook order. Customer sign-in's unconditional redirect-ref branch briefly replaced an active submit spinner with a second verification screen. The placeholder now waits until both submit flags are false. No authorization decision or Firebase rule changed.

7. **Animations and hosting were checked without assuming they were causes.** The measured LCP was the hero, not the generic product-image wrapper from the screenshot. Existing hero/feature/carousel animations were preserved. Hosted HTML returned gzip and `cdn-cache-status: hit`; the hashed hero returned WebP with an immutable one-year cache policy and a CDN hit. Missing compression or caching was not established. `apphosting.yaml` limits instances to one, but no evidence here proves instance capacity or cold starts caused the observed LCP. No infrastructure settings were changed.

## Hosted observations, kept separate

A single unmodified hosted run per viewport recorded desktop cold/warm LCP of **7.492 / 0.396 s** and mobile **5.344 / 0.976 s**. Desktop cold navigation TTFB was 2.891 s; mobile cold TTFB was 0.185 s. Both HTML responses reported CDN hits. These single observations are sensitive to connection/edge conditions and do not isolate a backend cause. The hosted adapter delivered the original static hero URL, while local production used `/_next/image`. Optimized image delivery and the new preload must be verified again after deployment; no hosted after-result is claimed.

## Files changed

| Files | Purpose |
| --- | --- |
| `src/app/page.tsx`, `src/components/landing/landing-page.tsx`, `hero-section.tsx` | Server-discoverable responsive hero preload; preserve gated landing behavior; high image priority |
| `src/hooks/use-near-viewport.ts`, `src/components/landing/deferred-prebuilt-showcase.tsx`, `prebuilt-showcase.tsx` | Defer lower-page carousel code/data; retain anchor and layout space; remove competing card priority |
| `src/context/advisor-jobs-context.tsx`, `advisor-jobs-scope.tsx` | Load AI hooks on first use while retaining jobs and UID isolation |
| `src/components/header.tsx` | Split authenticated notification widgets out of public navigation's eager imports |
| `src/app/layout.tsx`, `tailwind.config.ts` | Self-host existing fonts and share font variables |
| `next.config.ts` | Enable Mantine package import optimization |
| `src/components/app-layout.tsx`, `src/context/site-settings-context.tsx` | Share one typed settings subscription |
| `src/app/profile/components/favorites-list.tsx`, `src/app/profile/hooks/use-favorite-inventory.ts` | Fix conditional Hook order and lint warning without changing stock sources |
| `src/app/signin/page.tsx` | Keep the submitting form visible until navigation finishes |
| `tests/landing-performance.spec.ts`, `tests/auth-role-navigation.spec.ts` | Cover preload/download reuse, responsive visuals, carousel, themes, job persistence, and staff logout |
| `execution/audit_landing_performance.mjs` | Reproducible performance sampling, resource waterfall JSON, screenshots, and optional Chrome trace |
| `directives/landing_static_assets.md`, `directives/admin_session_and_idle_timeout.md`, this report | Production verification workflow, constraints, and findings |

## Verification and artifacts

- `npm run build`: passed. Existing config skips built-in type/lint checks; separate checks below were required.
- `npm run typecheck`: passed with zero errors.
- `npm run lint`: passed with zero ESLint warnings/errors. Next.js prints its CLI deprecation notice.
- `npx playwright test --workers=1 --reporter=line --output=tmp/playwright-verified`: **17 passed**, no skipped tests. Covers all three roles, refresh/back/forward, staff rejection at customer sign-in, unauthenticated protected routes, delayed profile verification, logout for every role, advisor pending-job retention/cancellation, images, carousel controls, themes, mobile overflow, and existing specification/export tests. The runner also executed the repository's imported Node unit tests successfully.
- Before/after desktop/mobile screenshots were inspected. Firebase security rules, profile verification, staff session guards, and route guards are unchanged.
- Raw data: `tmp/performance/local-before.json`, `local-final.json`, and `hosted-before.json`. Screenshots use matching `-desktop.png` / `-mobile.png` names. Intermediate `local-after.json` is excluded from the final comparison.
- Separate Chrome trace: `tmp/performance/trace-sample-mobile.trace.json` (load in Chrome DevTools Performance). Its traced sample is excluded from the table.

Reproduce without running browser tests concurrently:

```powershell
npm run build
npm run start -- -p 9002
# In a second terminal; point PLAYWRIGHT_BROWSERS_PATH at the installed browser cache if needed.
node execution/audit_landing_performance.mjs http://127.0.0.1:9002 tmp/performance/recheck.json 3
# Optional separate trace run:
$env:AUDIT_TRACE = '1'
node execution/audit_landing_performance.mjs http://127.0.0.1:9002 tmp/performance/trace-sample.json 1
Remove-Item Env:AUDIT_TRACE
```

## Remaining bottlenecks and priorities

1. **Highest impact: reduce the public page's remaining bootstrap/hydration cost while preserving role-safe restoration.** Even with the image downloaded by 0.592 s, median mobile hero mount remains at 3.908 s. The existing Auth gate deliberately prevents content from rendering before restoration. Further provider isolation and a carefully designed public server-rendered frame/session strategy deserve a separate architecture review; do not simply remove the gate, trust cached roles, or bypass maintenance/access checks to hit a score.
2. **Protected-route follow-up completed separately.** The [inventory audit](inventory_performance_audit.md) measures `/admin` and `/builder`, splits inactive panels/dialogs/chart/chat, adjusts image sizing/priority and prefetch, and reports the remaining verified-session/data bottlenecks. Admin First Load JS fell from approximately 770 to 409 kB; warm results remain mixed. The landing-page table cannot establish those routes' LCP.
3. **Optimize inventory resolution after measuring actual query volume.** The visible carousel still queries prebuilt records and resolves stock/components. Consider shared reads or a server-maintained display summary while preserving fresh reservation/stock validation. Do not add arbitrary query limits that hide existing systems or rely on stale stock for checkout.
4. **Repeat the same matrix on the deployed revision and collect real-device Web Vitals.** Verify App Hosting's responsive preload candidates, image endpoint behavior, cache headers, and asset success. Compare connection/edge response timing across repeated hosted requests before changing instance settings or incurring hosting cost. Field INP and sustained mobile performance remain unmeasured.

References: [Next.js 15 image APIs](https://nextjs.org/docs/15/app/api-reference/components/image), [Mantine Next.js tree shaking](https://mantine.dev/guides/next/#app-router-tree-shaking), [Next.js 15 package import optimization](https://nextjs.org/docs/15/app/api-reference/config/next-config-js/optimizePackageImports), [Firebase App Hosting configuration](https://firebase.google.com/docs/app-hosting/configure).
