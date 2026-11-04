# Admin Verification Loader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide the account-verification loader on all admin routes without weakening admin authorization.

**Architecture:** Add the admin-route exemption at both shared loader boundaries: `AppLayout` for the global overlay and `RouteGuard` for protected-page fallback content. Keep permission evaluation and redirects unchanged.

**Tech Stack:** Next.js 15, React 19, TypeScript, Playwright

**Spec:** `docs/superpowers/specs/2026-11-04-admin-verification-loader-design.md`

## Global Constraints

- Cover `/admin` and every path beginning with `/admin/`.
- Preserve staff permission and session checks.
- Preserve all non-admin loader behavior.
- Run commands from the repository root with the dev server on port 9002.

## Review Focus

- A delayed staff profile on `/admin` must not show “Verifying your account...”.
- A delayed staff profile must still resolve to the admin navigation.
- An unauthenticated admin visit must still redirect to System Access.
- Nested admin routes must receive the same exemption.
- Customer routes must retain their existing verification behavior.

---

### Task 1: Suppress both admin verification loaders

**Files:**
- Modify: `tests/auth-role-navigation.spec.ts`
- Modify: `src/components/app-layout.tsx`
- Modify: `src/components/auth/route-guard.tsx`

**Interfaces:**
- Consumes: `usePathname()` and existing `ProfileStatus` values.
- Produces: admin-route loading branches that return no loader while retaining authorization behavior.

- [ ] **Step 1: Change the delayed staff-profile test to require the verification message to remain hidden while the Firestore response is delayed**

- [ ] **Step 2: Run the focused test and verify it fails because the existing admin loader is visible**

Run: `$env:E2E_BASE_URL='http://localhost:9002'; npx playwright test tests/auth-role-navigation.spec.ts -g "delayed staff profile" --reporter=line`

Expected: FAIL on the hidden-state assertion.

- [ ] **Step 3: Exempt admin routes from the global loading overlay in `AppLayout`**

Use the existing `isAdminRoute` value in the `loading` branch of `showLoaderOverlay`.

- [ ] **Step 4: Return `null` from `RouteGuard` for loading admin paths**

Keep the existing loader for every non-admin route and leave denial/redirect logic unchanged.

- [ ] **Step 5: Run focused and static verification**

Run the focused Playwright test, `npm run typecheck`, and `npm run lint`.

Expected: focused test passes; typecheck and lint exit with zero errors.

