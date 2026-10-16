# Landing static images on App Hosting

The landing page's hero and three feature visuals live in `src/assets/landing/` and are imported by their components. Next.js emits these files under `/_next/static/media/` during `npm run build`.

The Firebase App Hosting deployment returned the application's 404 page for root-level `public/` image URLs such as `/feature-1.webp`, even though those files loaded in `next dev` and were tracked in Git. For landing visuals, use static imports and `next/image` rather than root-relative `public/` paths. After a change, run `npm run typecheck`, lint the touched components, and `npm run build`; confirm the expected files appear in `.next/static/media/`. After rollout, open the landing page and verify each image has a nonzero natural width in the browser.

`npm run lint` was verified to run cleanly on 2026-10-16. Next.js 15 prints a deprecation notice for `next lint`; this is separate from ESLint warnings. Run the normal repository command before using a fallback.

## Production performance verification

Stop this repository's development server before building and serving production on port 9002. Do not run typecheck while Next.js is deleting/regenerating `.next/types`, or browser benchmarks while other browser tests run. Use `npm run build`, `npm run start -- -p 9002`, then `node execution/audit_landing_performance.mjs http://127.0.0.1:9002 tmp/performance/local.json 3`. Compare repeated hard navigations under matching conditions; keep hosted measurements separate from local results and soft-navigation screenshots. `AUDIT_TRACE=1` optionally saves a Chrome trace for the first mobile cold run; use a separate run for tracing to avoid changing benchmark conditions.

The landing route is gated on restored Auth. `src/app/page.tsx` must emit the hero's responsive image preload in server HTML using the same `getImageProps` options as `HeroSection`. This starts the public asset download before hydration without exposing protected content or bypassing role verification. Only the initial above-the-fold image gets high priority. Keep feature images lazy and reserve dimensions. The lower-page prebuilt carousel loads near the viewport; its anchor must exist before the carousel mounts, and the first cards must not compete with the hero on initial navigation.

Keep one settings subscription in `SiteSettingsProvider`, shared with `AppLayout`. Firestore may coalesce duplicate network listeners, so do not claim a measured read-cost reduction from removing a duplicate React subscriber. AI advisor jobs load on first advisor visit and retain their scope during later client navigation; verify that pending jobs survive leaving and returning to the page. Check `tests/landing-performance.spec.ts` and `tests/auth-role-navigation.spec.ts` against production after changing these boundaries.
