# Loading layout implementation plan

**Goal:** Match loading geometry to the existing loaded UI at mobile, tablet and desktop sizes without changing the product design.

**Spec:** User's application-wide skeleton audit request, shared-container illustration, and representative-page-first instruction in this chat.

**Approach:** Refactor existing skeletons and share presentation wrappers. Keep resolved page chrome mounted during section fetches. Authentication with an unresolved role uses a neutral status, never a guessed customer or staff interface. No new dependencies.

## Execution

- [ ] Measure the loaded builder at 1440, 768 and 390 pixels; compare its loading cards with the real card component in a temporary visual test route.
- [ ] Extract the builder card's presentation wrappers, reuse them in its skeleton, preserve list mode during loading, and validate before extending the pattern.
- [ ] Audit and correct catalog, admin inventory, landing sections, profile sections, advisor, chart and lazy boundaries using their actual component structures. Preserve dynamic section shells; document unknown counts and content-dependent sizes.
- [ ] Make role resolution neutral in shared guards/layout; inspect route loading and Suspense boundaries.
- [ ] Run typecheck/lint after edits, geometry tests at all three sizes, role/navigation regressions, and production build. Record screenshot locations and limitations in the audit report.

## Review focus

- Unresolved staff sessions must never render customer navigation or skeletons.
- Grid/list and expanded/collapsed modes must retain their selected layout.
- Loading wrappers must have no focusable or clickable placeholder controls.
- Narrow screens must use the loaded breakpoints and avoid horizontal overflow.
- Unknown record counts and long dynamic text are documented rather than claimed as zero shift.

## Initial findings

- Only `src/app/loading.tsx` exists; it is a role-neutral full-page status inside the shared main element.
- Builder skeleton badges are 20px; loaded Mantine xs badges are 16px. Price stack is hand-sized instead of using the loaded Text typography (45.59375px). List fetches incorrectly switch to a card grid.
- Protected admin/profile/builder fallbacks duplicate unrelated layouts. RouteGuard renders them before resolving role.
- Admin stock and prebuilt loading, landing accessory/featured grids, and advisor/chart lazy boundaries use separate geometry, blank regions or arbitrary heights.
- Existing changes in builder-page, protected-page-loading and public-auth-header tests predate this task and must be preserved where compatible with the requested neutral role resolution.
