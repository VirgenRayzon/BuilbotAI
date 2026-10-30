# Live Builder Recommendations

## Goal

Keep part suggestions current on `/builder` and `/admin/prebuilt-builder` as the selected build changes. **Your Build** exposes Parts, Analyzer, and Recommendation as compact tabs: the active tab expands with its label while inactive tabs collapse to accessible icon-only controls. Recommendation provides a local Auto Recommendation switch, a use-case selector (AAA gaming, Competitive, Video editing, 3D rendering, or Office use), and synchronized numeric/slider budget controls with minimum complete total and shortfall directly without a nested accordion. Turning Auto Recommendation off must stop ranking, highlighting, and inventory validation requests without clearing the user's use-case or budget settings; the system safeguard remains the global gate. The selected use case changes both missing-category priority and price/performance ranking while the complete-build budget remains a hard ceiling. The Total Value card always repeats the set budget and adds a red Shortfall row only when one exists. Two distinct suggestions are pinned to the first catalog page ahead of the filtered results: a workload-weighted **Best match** with a blue treatment and a price-conscious **Best value** with a yellow treatment. A short Buildbot speech bubble sits outside each card so it does not change card height; it may overlap the card above while allowing pointer events through. Both borders breathe gently, with static borders for reduced-motion users. There is no recommendation banner or View recommendation link.

## Data path

1. The feature is guarded by `siteSettings/main.isLiveBuilderRecommendationsEnabled` and is **disabled by default** when the field is absent or false. Super Admins control it from Profile → System Safeguards. Both builder clients skip recommendation work while disabled, and the API independently rejects requests while the safeguard is off.
2. Both pages own `useLiveBuildRecommendations` and share its state between `YourBuild` and the catalog. The catalog uses the page's existing add handler after verification.
3. `useLiveBuildRecommendations` calls `getLiveCandidates` locally for an immediate shortlist. The shortlist filters archived or out-of-stock items, checks the existing compatibility engine and full-build critical issues, and preserves 25% PSU headroom.
4. A total PHP budget reserves at least the cheapest in-stock compatible option for **every missing core category**. Show the minimum complete total and shortfall in the sidebar. This is an optimistic lower bound; combinations can cost more. When the current selection cannot finish within budget, prioritize cheaper replacements over adding another part.
5. After a short delay, `/api/builder/live-recommendations` verifies the selected IDs, candidate IDs, and minimum completion projection against current Firestore documents. Highlight provisional suggestions immediately; enable their Add or Replace action only after verification. Grid cards and list rows show the same recommendation marker.
6. Immediately before applying a card, the hook calls the same endpoint in `verify` mode. It passes the current catalog price and stock to the page's existing add handler. The handler remains the final client guard; checkout or prebuilt publication must continue to enforce its own current inventory rules.
7. Stale responses are ignored when the build, goal, budget, or candidate set changes. Older in-flight requests are aborted.
8. A single active catalog category is authoritative. Recommendations must stay inside that category even when it already contains a selected part or the build has a budget shortfall. RAM and Storage remain additive; only the All Parts state may fall back to the next missing core category.

## AI enrichment

The endpoint performs deterministic catalog ranking and validation. A model ranking step would send selected build data and catalog specifications to the configured external AI provider. Automatic approval review rejected that data transfer during implementation, and the user chose to keep recommendations catalog-only. Keep selected build and catalog data within BuildbotAI for this feature.

## Verification

- Run `npx --no-install tsx --test src/lib/live-build-recommendations.test.ts`.
- Run `npm run typecheck`, `npm run lint`, and `npm run build`.
- On port 9002, open both builder pages, choose a case and motherboard, and confirm CPU suggestions update and an incompatible socket is excluded.
- Change parts rapidly and confirm an older response cannot restore stale cards. Change stock or price and confirm the server-verified card reflects the latest values.
- Apply a recommendation and confirm it uses the existing compatibility, stock, and build-state handling.
- With ₱48,930 selected under a ₱50,000 budget and RAM, storage, PSU, and cooler missing, confirm the sidebar shows the complete-build shortfall and the catalog highlights a budget-saving replacement when available.
- Change the build while on a later catalog page and confirm Best match and Best value move to the front of page one without duplicates.

## Lesson learned

The customer catalog is cached while the manager inventory uses Firestore snapshots. Local suggestion cards must be treated as provisional until the authenticated server verifies current Firestore records. Keep this check separate from the existing AI Build Advisor route, which generates complete builds and has different latency and cache behavior.
Checking only the next part's price let a partial build consume nearly its entire budget. Budget decisions must account for the minimum cost of all remaining required categories before showing an add recommendation.
The production build and the running Next dev server both write `.next`; running them together can make the local server return HTML errors until it is restarted. Run the build check separately from browser verification, and keep a Retry control for a failed inventory check.
For browser work while the dev server is active, use the repository's isolated `.next-qr-test` build output. A sandboxed Windows build may fail to create generated folders or resolve Google Fonts; verify and clear only that generated directory, then rerun with the required filesystem and network permissions.
