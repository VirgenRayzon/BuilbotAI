# Codebase Cleanup & Verification Phased Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (Native inline execution selected) to implement this plan phase-by-phase. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute a 7-phase repository cleanup removing scratch/test/temporary artifacts, remaining non-directive comments, dead source files/assets, unused symbols/actions, and unused npm dependencies, followed by full build and live verification.

**Architecture:** Sequential 7-phase execution: baseline verification and uncommitted bugfix isolation first (Phase 1), filesystem/test/artifact pruning (Phase 2), comment stripping outside `src/` (Phase 3), dead module and asset removal (Phase 4), unused symbol/import/dead-action cleanup preserving `console.log`s (Phase 5), dependency/config pruning and tree regeneration (Phase 6), and final static build + port-9002 live smoke verification + whole-branch review (Phase 7).

**Tech Stack:** Next.js 15 (App Router, Turbopack), React 19, TypeScript 5 (`tsc --noEmit`), ESLint 9 (`next lint`), Mantine UI v8, Tailwind CSS v3, Playwright (`@playwright/test`), Firebase v11, Genkit v1.28, PowerShell.

**Spec:** User requirements gathered via `/grill-me` interactive scoping (Questions 1–6) in this session.

## Global Constraints

- **Scan Scope:** Whole repository excluding `node_modules`, `.next`, and `.git`.
- **Comment Policy:** Strip all inline and block comments, keeping only framework directives (`'use client'`, `'use server'`, and Next.js auto-generated `/// <reference ... />` in `next-env.d.ts`).
- **Tests & Artifacts:** Run Playwright E2E once in Phase 1 before deleting `tests/` and `src/**/*.test.ts` in Phase 2; also delete `output/pdf/`, `design_mocks/`, and the 3 unreferenced `execution/` scripts (`delete-test-builders.js`, `generate_favicon.js`, `migrate_audit_logs.ts`), while keeping hook and directive-backed `execution/` scripts.
- **In-File Cleanup:** Remove unused symbols/imports and dead actions only; **keep all existing `console.log` calls** for debugging, and do not split `>300`-line components.
- **Git Strategy:** Commit the uncommitted `AbortController` fix in `src/app/builder/hooks/use-builder-logic.ts` in its own commit first (Phase 1), then commit each cleanup phase separately with Conventional Commits.
- **Execution Mode:** Native execution (`executing-plans`) sequentially across Phases 1–7, followed by a fresh whole-branch code review.
- **Persistent Dev Server:** Treat any dev server on port `9002` (`http://localhost:9002/`) as user-owned and persistent; reuse if running, leave running if started for verification.
- **PowerShell Environment:** Use PowerShell-compatible commands or standalone `.mjs`/`.ts` scripts; keep temporary audit/ledger scripts outside the repo (in the conversation scratch folder).

## Review Focus

1. **Test Timing vs. Test Deletion:** `tests/` and `src/**/*.test.ts` are verified via `npx playwright test` in Phase 1 *before* Phase 2 deletes them; Phase 7 verifies the cleaned build via `typecheck`, `lint`, `build`, and a live port-9002 Chromium + HTTP smoke test.
2. **Next.js Special Files & Dynamic Media Routes:** `src/app/robots.ts`, `src/app/sitemap.ts`, and `src/app/landing-video/[name]/route.ts` (plus `public/videos/king45.mp4` and `public/videos/prism5.mp4`) have zero static TS imports but are live Next.js App Router entrypoints/assets and must NOT be deleted.
3. **Active Components with Legacy/Mock Filenames:** `src/app/pre-builts/[id]/legacy-prebuilt-product.tsx`, `src/components/ecommerce/simulated-gcash-modal.tsx`, `src/components/ecommerce/mock-orders-section.tsx`, and `src/components/ui/power-meter.tsx` are actively rendered in production routes and must be retained.
4. **Husky Hooks & `next-env.d.ts`:** `.husky/pre-push` relies on `execution/update_changelog.js` and `execution/generate_project_structure.js`; keep both scripts. Leave `next-env.d.ts` Next.js directives untouched.
5. **Preserving `console.log` Calls:** Ensure Phase 5 removes dead imports/variables/actions without stripping active `console.log` statements used for debugging.

---

### Phase 1: Git Baseline & Pre-Deletion Test Verification

**Files:**
- Commit first: `src/app/builder/hooks/use-builder-logic.ts`
- Verify (read-only): `tests/*.spec.ts`, `playwright.config.ts`

- [ ] **Step 1: Commit uncommitted `use-builder-logic.ts` fix in its own commit**

Run:
```powershell
git add src/app/builder/hooks/use-builder-logic.ts
git commit -m "fix(builder): abort load-favorite-build listener on cleanup"
```
Expected: Commit created cleanly; remaining dirty file is only `scratch/check-models.js` (removed in Phase 2).

- [ ] **Step 2: Run baseline static checks**

Run:
```powershell
npm run typecheck; npm run lint
```
Expected: Both exit `0` with zero errors.

- [ ] **Step 3: Ensure dev server is listening on port `9002` and run Playwright baseline**

If port `9002` is not listening, start `npm run dev` in background and wait until `http://localhost:9002/` responds, then run:
```powershell
npx playwright test
```
Expected: Baseline Playwright results captured prior to deleting `tests/` in Phase 2 (note any tests requiring unconfigured local emulators or missing E2E credentials if applicable).

---

### Phase 2: Remove Scratch, Temporary Artifacts, Root Logs, Optional Assets, and Test Files

**Files:**
- Delete untracked temp dirs & logs: `.tmp/` (379 files, ~196.28 MB incl. `qr-runtime` JRE), `tmp/` (1,355 files, ~78.75 MB incl. `tmp/release-inventory`), `.next-qr-test/` (654 files, ~1,645.98 MB), `test-results/`, `out/`, `.superpowers/`, empty `scripts/`, `debug.log`, `firestore-debug.log`, `grounding-debug.log`, `tsconfig.tsbuildinfo`
- Delete tracked scratch, tests, & zero-byte clutter:
  - `scratch/` (42 files: 14 tracked + 28 untracked screenshots and `scratch/test_placeholders/`)
  - `tests/` (21 files) and `playwright.config.ts`
  - All 41 `src/**/*.test.ts` files (`4` in `src/app/admin/`, `37` in `src/lib/`)
  - `.modified`, `models.json`, `firebase.qr-test.json`
  - `execution/verify_qr_feature.mjs`, `execution/verify_loading_layouts.mjs`
- Delete approved optional non-code artifacts & unreferenced scripts:
  - `output/pdf/` (3 PDFs) and empty `output/` if empty
  - `design_mocks/` (6 layout PNGs)
  - `execution/delete-test-builders.js`, `execution/generate_favicon.js`, `execution/migrate_audit_logs.ts`
- Modify temporarily if needed for `typecheck`: remove `.next-qr-test/types/**/*.ts` from `tsconfig.json` `include` (completed cleanly in Phase 6).

- [ ] **Step 1: Remove untracked temp directories, root logs, and caches**

```powershell
$untracked = @('.tmp','tmp','.next-qr-test','test-results','out','.superpowers','scripts','debug.log','firestore-debug.log','grounding-debug.log','tsconfig.tsbuildinfo')
foreach ($p in $untracked) { if (Test-Path $p) { Remove-Item -LiteralPath $p -Recurse -Force } }
```
Expected: All listed temporary folders and debug logs removed.

- [ ] **Step 2: Remove `scratch/`, `tests/`, `playwright.config.ts`, `src/**/*.test.ts`, `output/`, `design_mocks/`, and obsolete `execution/` / root files**

```powershell
$trackedTargets = @(
  'scratch','tests','playwright.config.ts','.modified','models.json','firebase.qr-test.json',
  'output','design_mocks',
  'execution/verify_qr_feature.mjs','execution/verify_loading_layouts.mjs',
  'execution/delete-test-builders.js','execution/generate_favicon.js','execution/migrate_audit_logs.ts'
)
foreach ($p in $trackedTargets) { if (Test-Path $p) { Remove-Item -LiteralPath $p -Recurse -Force } }
Get-ChildItem -Path 'src' -Recurse -File | Where-Object { $_.Name -match '\.(test|spec)\.[jt]sx?$' } | Remove-Item -Force
```
Expected: All scratch, test, mock, PDF output, and unreferenced script targets deleted.

- [ ] **Step 3: Verify TypeScript compilation**

Run:
```powershell
npm run typecheck
```
Expected: Exits `0` (if `tsconfig.json` complains about missing `.next-qr-test/types/**/*.ts`, remove that glob from `tsconfig.json` now).

- [ ] **Step 4: Commit Phase 2**

```powershell
git add -A
git commit -m "chore: remove scratch files, test suites, mockups, and unused scripts"
```

---

### Phase 3: Strip Remaining Comments (Keeping Framework Directives)

**Files:**
- Modify 5 `execution/` scripts (8 comments total): `execution/update_changelog.js` (3), `execution/benchmark_build_advisor.mjs` (2), `execution/audit_inventory_performance.mjs` (1), `execution/backup_qr_catalog.ts` (1), `execution/migrate_product_identities.ts` (1)
- Modify root config/rules files: `postcss.config.mjs` (1 JSDoc), `firestore.rules` (5 `//` comments), `storage.rules` (1 `//` comment), `apphosting.yaml` (6 `#` comments)
- Verify only (keep directives): `src/` (already 0 comments), `next-env.d.ts` (keep Next.js `/// <reference ... />`)

- [ ] **Step 1: Verify `src/` contains zero comments**

Run comment scan over `src/` excluding URL literals (`https://`).
Expected: `0` inline, block, JSDoc, or JSX comments in `src/`.

- [ ] **Step 2: Strip the 8 comments across the 5 `execution/` scripts**

Edit `execution/update_changelog.js`, `execution/benchmark_build_advisor.mjs`, `execution/audit_inventory_performance.mjs`, `execution/backup_qr_catalog.ts`, and `execution/migrate_product_identities.ts` to remove comments without altering executable logic.

- [ ] **Step 3: Strip non-directive comments in `postcss.config.mjs`, `firestore.rules`, `storage.rules`, and `apphosting.yaml`**

Remove comments while leaving `'use client'`, `'use server'`, and `next-env.d.ts` intact.

- [ ] **Step 4: Re-run comment scan and `npm run typecheck`**

Run:
```powershell
npm run typecheck
```
Expected: `0` non-directive comments in `src/`, `execution/`, and root configs; `typecheck` exits `0`.

- [ ] **Step 5: Commit Phase 3**

```powershell
git add execution postcss.config.mjs firestore.rules storage.rules apphosting.yaml
git commit -m "chore: strip remaining inline and block comments"
```

---

### Phase 4: Remove Dead / Unreachable Source Files & Unused Assets

**Files:**
- Delete 20 dead feature/AI files (verified 0 active callers; keeping `robots.ts`, `sitemap.ts`, `landing-video/[name]/route.ts`, `legacy-prebuilt-product.tsx`, `simulated-gcash-modal.tsx`, `mock-orders-section.tsx`, `power-meter.tsx`):
  - `src/app/admin/components/orders/orders-table.tsx` (369L)
  - `src/app/admin/components/orders/order-stage-control.tsx` (20L)
  - `src/app/pre-builts/[id]/components/prebuilt-ai-review.tsx` (231L)
  - `src/app/pre-builts/[id]/components/prebuilt-component-carousel.tsx` (135L)
  - `src/app/pre-builts/[id]/components/prebuilt-parts-accordion.tsx` (186L)
  - `src/app/profile/components/account-details.tsx` (183L)
  - `src/components/bottleneck/bottleneck-prototype-controller.tsx` (126L)
  - `src/components/bottleneck/prototype-bottom-dock.tsx` (154L)
  - `src/components/bottleneck/prototype-dual-sidebar.tsx` (4L)
  - `src/components/bottleneck/prototype-slide-drawer.tsx` (135L)
  - `src/components/bottleneck/prototype-top-hud.tsx` (117L)
  - `src/components/builder-floating-analytics.tsx` (156L)
  - `src/components/ecommerce/checkout-modal.tsx` (1,576L)
  - `src/components/full-page-loader.tsx` (135L)
  - `src/components/landing/features-section.tsx` (175L)
  - `src/components/landing/feature-showcase.tsx` (71L)
  - `src/components/product-identity-link.tsx` (11L)
  - `src/components/public-product-page.tsx` (49L)
  - `src/components/smart-budget.tsx` (207L)
  - `src/ai/flows/ai-smart-budget.ts`
- Delete 16 unused `src/components/ui/*` primitives:
  - `src/components/ui/accordion.tsx`, `avatar.tsx`, `breadcrumb.tsx`, `canvas-text.tsx`, `chart.tsx`, `collapsible.tsx`, `dropdown-menu.tsx`, `menubar.tsx`, `progress.tsx`, `radio-group.tsx`, `sidebar.tsx`, `slider.tsx`, `switch.tsx`, `tabs.tsx`, `toggle-group.tsx`, `toggle.tsx`
- Delete 4 unused static images:
  - `public/cosmic-bg.png`, `public/landing-hero.png`
  - `src/assets/branding/netcodex-logo-white.png`, `src/assets/landing/hero-custom.webp`
- Modify: `src/app/actions.ts` (remove `getAiSmartBudget` + `ai-smart-budget` import)

- [ ] **Step 1: Verify zero active imports into all 36 dead files and 4 unused assets**

Run import/string search across `src/` before deletion.
Expected: Zero active imports into any of the 36 dead files or 4 assets.

- [ ] **Step 2: Delete dead files/assets and remove `getAiSmartBudget` from `src/app/actions.ts`**

Remove all 36 dead `.ts`/`.tsx` files and 4 unused images; remove `aiSmartBudgetAction`/`AiSmartBudgetInput` import and `getAiSmartBudget` export in `src/app/actions.ts`.

- [ ] **Step 3: Verify TypeScript and lint**

Run:
```powershell
npm run typecheck; npm run lint
```
Expected: Zero errors and zero warnings.

- [ ] **Step 4: Commit Phase 4**

```powershell
git add -A src/ public/
git commit -m "refactor: remove unreachable components, unused UI primitives, and unused assets"
```

---

### Phase 5: Remove Unused Symbols, Imports, and Dead Actions (Preserving `console.log`s)

**Files:**
- Modify all `src/` files flagged by TypeScript unused-symbol diagnostics (`TS6133`, `TS6192`, `TS6196`, `TS6198`, `TS7027`), keeping all existing `console.log` calls intact.
- Modify `src/app/actions.ts`: remove unused `getAiRecommendations`, `authenticateSystemAccessAction`, and `migrateAllUsersClaimsAction`; extract shared `runAiAction` helper to remove duplicated `withTimeout` + `try/catch` boilerplate across the remaining AI actions.
- Modify `src/lib/*` & `src/components/*` where dead exported functions/constants have zero cross-file callers (keeping domain types/exports where needed cleanly).

- [ ] **Step 1: Remove all TypeScript unused imports, unused parameters, and dead local variables**

Resolve all TS unused-symbol suggestion diagnostics (`6133`, `6192`, `6196`, `6198`, `7027`) across `src/` without removing any `console.log` statements.

- [ ] **Step 2: Clean dead actions and deduplicate `src/app/actions.ts`**

Verify zero callers for `getAiRecommendations`, `authenticateSystemAccessAction`, and `migrateAllUsersClaimsAction`, remove them, and extract a single `runAiAction` wrapper. Keep existing `console.*` logging inside active functions.

- [ ] **Step 3: Verify zero unused diagnostics, typecheck, and lint**

Run:
```powershell
npm run typecheck; npm run lint
```
Expected: Zero TS unused-symbol suggestion diagnostics, zero `typecheck` errors, zero `lint` warnings/errors.

- [ ] **Step 4: Commit Phase 5**

```powershell
git add src/
git commit -m "refactor: remove unused imports, local variables, and dead server actions"
```

---

### Phase 6: Prune Unused Dependencies, Configs, and Refresh `docs/project_structure.md`

**Files:**
- Modify: `package.json` (and `package-lock.json` via `npm install`)
- Modify: `tsconfig.json`, `next.config.ts`
- Regenerate: `docs/project_structure.md`

- [ ] **Step 1: Remove 17 unused packages and `"test:qr"` script from `package.json`**

Remove from `dependencies`:
- `@genkit-ai/compat-oai`, `@genkit-ai/googleai`, `patch-package`, `zustand`
- `@radix-ui/react-accordion`, `@radix-ui/react-avatar`, `@radix-ui/react-collapsible`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-menubar`, `@radix-ui/react-progress`, `@radix-ui/react-radio-group`, `@radix-ui/react-slider`, `@radix-ui/react-switch`, `@radix-ui/react-tabs`, `@radix-ui/react-toggle`, `@radix-ui/react-toggle-group`
Remove from `devDependencies`: `@types/pngjs` (keep `@playwright/test` used by `execution/audit_*.mjs`).
Remove `"test:qr"` from `scripts`.

- [ ] **Step 2: Clean `tsconfig.json` and `next.config.ts`**

- Remove `".next-qr-test/types/**/*.ts"` from `tsconfig.json` `include`.
- Remove `QR_INVENTORY_TEST` `distDir`/header conditional from `next.config.ts`.

- [ ] **Step 3: Sync lockfile and regenerate `docs/project_structure.md`**

Run:
```powershell
npm install; node execution/generate_project_structure.js
```
Expected: Clean `package-lock.json` update and accurate `docs/project_structure.md`.

- [ ] **Step 4: Verify typecheck & lint and commit Phase 6**

Run:
```powershell
npm run typecheck; npm run lint
git add package.json package-lock.json tsconfig.json next.config.ts docs/project_structure.md
git commit -m "chore: prune unused dependencies, test config, and update project structure"
```

---

### Phase 7: Final Build, Live Smoke Testing (Port 9002), and Whole-Branch Review

**Files:**
- Verify only (no product edits unless fixing a review finding)

- [ ] **Step 1: Run full static & production build gates**

Run:
```powershell
npm run typecheck; npm run lint; npm run build
```
Expected: All three exit `0` with zero errors or warnings.

- [ ] **Step 2: Run live HTTP & Chromium smoke check on `http://localhost:9002/`**

Reuse or start persistent dev server on port `9002` (leaving it running afterward), and verify core public/auth/app routes (`/`, `/builder`, `/parts`, `/pre-builts`, `/ai-build-advisor`, `/signin`, `/system-access`, `/about`, `/contact`, `/faq`) respond with HTTP 200 and zero uncaught page errors in headless Chromium.

- [ ] **Step 3: Fresh whole-branch code review & git status check**

Dispatch a fresh reviewer subagent over the full diff against `542c560`, resolve any Critical/Important findings with verification, and confirm:
```powershell
git status --short
```
Expected: Clean working tree.
