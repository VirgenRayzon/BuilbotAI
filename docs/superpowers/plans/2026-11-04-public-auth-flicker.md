# Public Page Auth Flicker Investigation and Implementation Plan

**Goal:** Keep guest and signed-in public pages visually stable while Firebase restores auth and the server-confirmed profile.

**Scope:** `/parts`, `/pre-builts`, their detail pages, and other public information pages that share the header. Preserve the temporarily disabled “Verifying your account...” views and all existing authorization checks.

## Findings

- `useUser()` starts at `undefined`; the Firebase `onIdTokenChanged` callback later supplies a user or `null` (`src/firebase/auth/use-user.tsx`). `UserProfileProvider` can remain `loading` after a user appears while the Firestore profile resolves (`src/context/user-profile.tsx`).
- `Header` treats `!authUser` as guest on public routes. `undefined` therefore mounts `HeaderMegaMenu` during restoration; a signed-in user then replaces that entire header with the customer or staff header (`src/components/header.tsx`). This is the main code-level cause of the observed header swap. `HeaderMegaMenu` also renders guest buttons for unresolved auth (`src/components/header-mega-menu.tsx`).
- While an authenticated user's profile is unresolved, `Header` computes `isStaff` as false, so its tabs temporarily use customer navigation before switching to staff navigation. The global overlay previously concealed these transitions; removing it exposed them (`src/components/app-layout.tsx`).
- A local Chromium capture against port 9002 reproduced the signed-in refresh sequence. On `/parts`, the guest header appeared at about 0.9 s, changed to a header without guest actions at 2.0 s, then became the customer header at 4.8 s. On `/pre-builts`, those states appeared at about 0.4 s, 1.4 s, and 4.5 s. Timings are from navigation start in one run, not performance targets.
- Guest visits kept the guest header throughout. `/parts` had product links at first content paint, while `/pre-builts` had no product links until about 2.8 s for a guest and 4.5 s for the customer capture. The latter is a separate catalog data transition, not evidence of an auth redirect.
- Staff and mobile refreshes were not captured. Their transition remains a verification target because the header's role-dependent render path can display customer tabs before the staff profile resolves.

## Implementation tasks

### 1. Capture the transition

- [x] Capture guest and refreshed signed-in customer header and catalog transitions on `/parts` and `/pre-builts` against port 9002; findings are recorded above.
- [ ] Capture a refreshed staff session and mobile width. Check `/parts/[id]` and `/pre-builts/[id]` for the same shared-header behavior. Keep the persistent dev server running.
- [x] Add regression assertions for the observed guest, customer, and staff header transitions in `tests/public-auth-header.spec.ts`.

### 2. Stabilize the shared header

- [x] In `src/components/header.tsx`, use explicit `status` checks to distinguish unresolved identity from a confirmed guest. Do not mount `HeaderMegaMenu` as a guest header while auth is unresolved on public routes.
- [x] During unresolved auth/profile state, render a stable header frame with its normal height and logo and reserved action space. Avoid an account-specific nav or guest sign-in CTA until identity and role are resolved. Do not reintroduce the full-page verification loader.
- [x] Once `status` is `unauthenticated` or `ready`, render the correct guest, customer, or staff header in one transition. Preserve the existing menu actions, responsive layout, and sign-out flow.
- [x] Add assertions that guest actions never appear during restoration of a signed-in session and customer tabs never appear during restoration of a staff session.

### 3. Address any separate page transition found in task 1

- [x] `/pre-builts` first paints without products until Firestore returns. Its existing eight-card skeleton holds catalog space while loading; no page-body change is needed.
- [ ] If another public route has an auth-dependent action area, use the same explicit three-state distinction there: unresolved, guest, signed-in. Keep public product content available throughout.
- [ ] Add only the regression checks needed for the transitions actually observed.

### 4. Verify

- [x] Run the focused Playwright checks on `http://localhost:9002` for guest, customer, and staff refreshes at desktop width (3 passed).
- [x] Confirm no incorrect guest/customer navigation appears during unresolved auth and that public catalog content remains accessible to guests.
- [x] Run `npm run typecheck`, `npm run lint`, and `git diff --check` (all pass).

## Constraints

- Keep permission and staff-session checks in `RouteGuard` intact.
- Keep the temporary removal of “Verifying your account...” loading views intact.
- Preserve public route access and the existing 9002 dev server.
- Avoid changing the current unrelated working-tree edits while implementing this plan.
