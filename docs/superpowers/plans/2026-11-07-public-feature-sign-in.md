# Public Feature Sign-In Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Require sign-in for account-dependent interactions on public builder, prebuilt, and parts pages, explain the redirect, and send successful sign-ins to `/builder`.

**Architecture:** Add a small, pure auth-redirect policy module and a client hook that combines it with current user-profile state and Next.js navigation. Public interaction handlers call the shared guard before mutating builds, carts, or AI state; the sign-in page maps the feature reason to the existing alert aesthetic and the fixed `/builder` destination.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript strict mode, Mantine v8, Firebase Authentication, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-07-public-feature-sign-in-design.md`

## Global Constraints

- Guest redirect URL is exactly `/signin?reason=feature_required`.
- Sign-in message body is exactly `You need to sign in to use this feature.`
- Successful customer sign-in for this reason always routes to `/builder`; it never resumes the action.
- Public pages remain viewable and authenticated interactions remain unchanged.
- Do not change staff authentication or `idle_timeout` behavior.

## Review Focus

- Firebase/profile loading must not be mistaken for a guest and trigger a premature redirect.
- A logged-in customer must reach the original action exactly once.
- Both email and Google sign-in must use the fixed `/builder` destination.
- Incomplete builder validation must not bypass the guest requirement for cart or checkout actions.
- Existing `returnTo` flows unrelated to `feature_required` must continue to work.

---

### Task 1: Shared public feature authentication policy

**Files:**
- Create: `src/lib/public-feature-auth.ts`
- Create: `src/lib/public-feature-auth.test.ts`

**Interfaces:**
- Produces: `PUBLIC_FEATURE_SIGN_IN_URL`, `PUBLIC_FEATURE_SIGN_IN_REASON`, and `getCustomerSignInDestination(reason: string | null, returnTo: string | null): string`.

- [ ] **Step 1: Write failing policy tests**

Add tests proving the feature URL is `/signin?reason=feature_required`, `feature_required` resolves to `/builder` even when `returnTo` is present, and unrelated reasons retain the safe existing return behavior.

- [ ] **Step 2: Run the test and verify RED**

Run: `npx tsx --test src/lib/public-feature-auth.test.ts`
Expected: FAIL because `public-feature-auth.ts` does not exist.

- [ ] **Step 3: Implement the pure policy**

Implement the named exports with `safeProductReturn` for non-feature reasons and the fixed builder result for `feature_required`.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `npx tsx --test src/lib/public-feature-auth.test.ts`
Expected: PASS.

### Task 2: Shared client guard and sign-in notice

**Files:**
- Create: `src/hooks/use-public-feature-auth.ts`
- Modify: `src/app/signin/page.tsx`
- Test: `tests/auth-role-navigation.spec.ts`

**Interfaces:**
- Consumes: Task 1 policy constants and destination resolver.
- Produces: `usePublicFeatureAuth(): { isGuest: boolean; authLoading: boolean; requireAuth(action: () => void): void }`.

- [ ] **Step 1: Add failing browser coverage**

Update the guest builder analysis test to expect `/signin?reason=feature_required` and the exact notice. Add authenticated sign-in coverage proving this reason lands on `/builder`, while an unrelated safe `returnTo` still works.

- [ ] **Step 2: Run the targeted test and verify RED**

Run: `npx playwright test tests/auth-role-navigation.spec.ts --grep "guests can build|feature-required sign-in"`
Expected: FAIL on the old `returnTo` URL or missing notice.

- [ ] **Step 3: Implement the hook and sign-in mapping**

The hook must no-op while profile state loads, redirect guests to the shared URL, and call the provided action for authenticated customers. The sign-in page must render a yellow/light Mantine alert matching the session-expired treatment and use the Task 1 resolver for both email and Google flows.

- [ ] **Step 4: Run targeted coverage and verify GREEN**

Run the Step 2 command.
Expected: PASS.

### Task 3: Guard all listed public interactions

**Files:**
- Modify: `src/components/build/build-action-footer.tsx`
- Modify: `src/app/builder/builder-page.tsx`
- Modify: `src/components/public-parts-catalog.tsx`
- Modify: `src/components/public-part-page.tsx`
- Modify: `src/components/part-builder-compatibility-modal.tsx`
- Modify: `src/components/prebuilt-system-card.tsx`
- Modify: `src/app/pre-builts/[id]/components/prebuilt-action-card.tsx`
- Modify: `src/hooks/use-public-product-actions.ts`
- Test: `tests/public-feature-auth.spec.ts`

**Interfaces:**
- Consumes: `usePublicFeatureAuth()` from Task 2.

- [ ] **Step 1: Add failing guest interaction coverage**

Add Playwright cases for builder add-to-cart, builder buy-now, parts add-to-cart, part buy-now, compatibility check, prebuilt customization, prebuilt add-to-cart, and prebuilt buy-now. Each must assert `/signin?reason=feature_required` and no cart/build mutation before navigation.

- [ ] **Step 2: Run the new test and verify RED**

Run: `npx playwright test tests/public-feature-auth.spec.ts`
Expected: FAIL on at least the currently unguarded cart/checkout actions.

- [ ] **Step 3: Apply the shared guard at action boundaries**

Wrap each listed account-dependent action with `requireAuth`. Preserve existing completeness, availability, and staff rules after authentication; remove obsolete per-handler guest URLs.

- [ ] **Step 4: Run the new test and verify GREEN**

Run the Step 2 command.
Expected: PASS.

### Task 4: Full verification and directive update

**Files:**
- Create: `directives/public_feature_authentication.md`

**Interfaces:**
- Consumes: completed behavior from Tasks 1-3.

- [ ] **Step 1: Document the reusable policy**

Record the guarded action scope, fixed redirect/message/destination, loading-state rule, and the shared hook/policy entry points.

- [ ] **Step 2: Run required static checks**

Run: `npm run typecheck`
Expected: zero errors.

Run: `npm run lint`
Expected: zero warnings/errors.

- [ ] **Step 3: Run focused and regression tests**

Run: `npx tsx --test src/lib/public-feature-auth.test.ts`
Run: `npx playwright test tests/public-feature-auth.spec.ts tests/auth-role-navigation.spec.ts`
Expected: all tests pass, with credential-dependent cases either passing or explicitly skipped by existing environment guards.

- [ ] **Step 4: Run production build**

Run: `npm run build`
Expected: successful production build.

