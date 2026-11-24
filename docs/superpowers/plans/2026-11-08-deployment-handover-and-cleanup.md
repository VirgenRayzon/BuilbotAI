# Buildbot AI Full Deployment Handover, Codebase Cleanup & Production Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a production-ready, clean, and thoroughly documented Buildbot AI repository for deployment handover by pruning redundant files/assets, removing dead code and unnecessary comments across the codebase, adding vital production configurations (security headers, health-check endpoint, environment template, robots/sitemap, Firebase storage wiring, and CI workflow), and authoring a comprehensive operational handover guide.

**Architecture:** Next.js 15 App Router running on Vercel with Google Genkit AI flows (Gemini API), backed by Firebase v11 (Authentication, Cloud Firestore, Cloud Storage), and PayMongo payment integration.

**Tech Stack:** Next.js 15 (Turbopack, React 19), TypeScript strict mode, Mantine UI v8, Tailwind CSS v3, Firebase v11, Genkit v1.28, Playwright.

**Spec:** `docs/turnover-readiness-plan.md` and user handover requirements.

## Global Constraints
- Target hosting platform is **Vercel** for the Next.js app/APIs and **Firebase** for Auth/Firestore/Storage.
- All development and local verification must strictly respect port `9002` (`http://localhost:9002/`).
- Automated verification loop (`npm run typecheck` and `npm run lint`) must pass with zero errors after every task.
- Zero customer or staff feature regressions (preserve builder compatibility logic, order checkout, inventory management, and AI advisor flows).
- Safe asset deduplication: Never delete an image if code or live CSS references its path without redirecting or updating references first.

## Review Focus
1. Accidental broken image paths when consolidating duplicate images between `public/` and `src/assets/`.
2. Removal of essential structural comments/directives (e.g. `'use client'`, `'use server'`) when stripping code comments.
3. Overly aggressive CSP headers in `next.config.ts` blocking Firebase Auth popups, PayMongo iframes, or Genkit streaming.
4. Missing or misnamed environment variables in `.env.example` leading to production deployment runtime crashes on Vercel.
5. Incomplete Firebase deployment config where `storage.rules` remains disconnected from `firebase.json`.

---

### Task 1: Audit and Remove Redundant Root Files & Tracked Scratch Artifacts

**Files:**
- Delete:
  - `debug-response.json`
  - `temp_build.json`
  - `test-ai.ts`
  - `test-genkit.ts`
  - `test-nv.ts`
- Remove Git Tracking & Add to `.gitignore`:
  - `test-results/`
  - `.next-qr-test/`
- Delete Unused Mockups:
  - `design_mocks/` directory (6 mock PNGs, ~3 MB)
- Modify:
  - `.gitignore`

**Interfaces:**
- Consumes: Existing root files and `.gitignore`.
- Produces: Clean root repository directory with no scratch/debug files or tracked test artifacts.

- [ ] **Step 1: Verify no active runtime imports reference root test files**
  - Run: `git grep -E "(test-ai|test-genkit|test-nv|temp_build|debug-response)" src/`
  - Expected: No matches found in `src/`.

- [ ] **Step 2: Update `.gitignore` to explicitly ignore test artifacts and test builds**
  - Add `test-results/`, `playwright-report/`, and `.next-qr-test/` to `.gitignore`.

- [ ] **Step 3: Remove redundant root files, untrack test results, and remove `design_mocks/`**
  - Delete `debug-response.json`, `temp_build.json`, `test-ai.ts`, `test-genkit.ts`, `test-nv.ts`.
  - Untrack `test-results/` from git via `git rm -r --cached test-results/` (if tracked).
  - Delete `design_mocks/` folder.

- [ ] **Step 4: Verify typecheck and git status**
  - Run: `npm run typecheck`
  - Run: `git status --short`
  - Expected: Zero type errors, clean deletion list.

- [ ] **Step 5: Commit changes**
  - Command: `git add .gitignore debug-response.json temp_build.json test-ai.ts test-genkit.ts test-nv.ts design_mocks test-results`
  - Commit: `chore: remove redundant root scratch files, mock designs, and untrack test results`

---

### Task 2: Deduplicate Static Assets Between `public/` and `src/assets/`

**Files:**
- Modify / Consolidate:
  - `src/assets/team/` vs `public/team/` (8 duplicate PNGs: `developer.png`, `developer_m.png`, `documentation.png`, `documentation_m.png`, `pm.png`, `pm_m.png`, `ui.png`, `ui_m.png`)
  - `src/assets/branding/` vs `public/` (`netcodex-emblem.png`, `netcodex-logo-white.png`, `netcodex_cc_2026_white.png.webp`)
  - `src/assets/about/` vs `public/` (`netcodex-storefront.png`)
- Target: Code importing from `src/assets/*` or referencing `/public/*`.

**Interfaces:**
- Consumes: Image references across `src/components/`, `src/app/`.
- Produces: Single source of truth for static assets, saving ~6.5MB of duplicate files.

- [ ] **Step 1: Audit all imports of `src/assets/` across the project**
  - Run: `git grep "src/assets" src/` and `git grep "@/assets" src/`
  - Identify which components import from `src/assets/` vs URLs referencing `/team/...` or `/netcodex-...`.

- [ ] **Step 2: Standardize asset imports and prune byte-identical duplicate files**
  - Update any import paths to reference the unified asset location.
  - Safely remove duplicate file copies that are no longer referenced.

- [ ] **Step 3: Verify build and typecheck**
  - Run: `npm run typecheck`
  - Run: `npm run lint`
  - Expected: PASS with zero errors.

- [ ] **Step 4: Commit asset deduplication**
  - Commit: `refactor(assets): deduplicate static team and branding images between public and src/assets`

---

### Task 3: Clean Comments, Obsolete Notes, and Dead Commented-Out Code Across `src/`

**Files:**
- Modify:
  - `src/app/**/*.ts`, `src/app/**/*.tsx`
  - `src/components/**/*.ts`, `src/components/**/*.tsx`
  - `src/lib/**/*.ts`, `src/lib/**/*.tsx`
  - `src/hooks/**/*.ts`, `src/hooks/**/*.tsx`
  - `src/firebase/**/*.ts`, `src/firebase/**/*.tsx`
  - `src/context/**/*.ts`, `src/context/**/*.tsx`

**Interfaces:**
- Consumes: Source files containing legacy developer comments, dead commented-out code blocks, and obsolete notes.
- Produces: Pristine, professional, readable code retaining only essential framework directives (`'use client'`, `'use server'`) and purposeful JSDoc.

- [ ] **Step 1: Clean comments in `src/lib/` and `src/hooks/`**
  - Remove dead commented-out code blocks, obsolete debugging comments, and redundant inline commentary.
  - Preserve required TypeScript type definitions and functional logic.
  - Verify: `npm run typecheck`

- [ ] **Step 2: Clean comments in `src/firebase/` and `src/ai/`**
  - Remove dead comments in Genkit flows, schemas, and Firebase client/admin initializers.
  - Verify: `npm run typecheck`

- [ ] **Step 3: Clean comments in `src/components/` and `src/app/`**
  - Remove commented-out JSX elements, obsolete UI notes, and dead styling comments.
  - Keep `'use client'` and `'use server'` directives intact at top of files.
  - Verify: `npm run typecheck` and `npm run lint`

- [ ] **Step 4: Verify entire codebase clean pass**
  - Run: `npm run typecheck`
  - Run: `npm run lint`
  - Expected: Zero type errors, zero lint warnings/errors.

- [ ] **Step 5: Commit cleaned code**
  - Commit: `chore(code-style): remove obsolete comments and dead commented-out code across src`

---

### Task 4: Production Hardening — Security Headers and Strict Build Gates in `next.config.ts`

**Files:**
- Modify: `next.config.ts`

**Interfaces:**
- Consumes: Next.js configuration.
- Produces: Secure HTTP response headers (HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy) and strict type/lint checking for production builds.

- [ ] **Step 1: Add standard production security headers in `next.config.ts`**
  - Implement headers for all routes:
    - `X-DNS-Prefetch-Control: on`
    - `X-XSS-Protection: 1; mode=block`
    - `X-Frame-Options: SAMEORIGIN`
    - `X-Content-Type-Options: nosniff`
    - `Referrer-Policy: strict-origin-when-cross-origin`
    - `Permissions-Policy: camera=(self), microphone=(), geolocation=()`
  - Retain `X-Buildbot-QR-Test` during QR test emulator mode.

- [ ] **Step 2: Remove or conditionalize build bypass flags**
  - Change `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` from unconditional `true` to `false` (or only bypass in isolated test mode if explicitly specified).
  - Test: Run `npm run build` to verify clean build under strict gates.

- [ ] **Step 3: Verify build passes cleanly**
  - Run: `npm run build`
  - Expected: Production build completes successfully without errors.

- [ ] **Step 4: Commit `next.config.ts` updates**
  - Commit: `chore(config): add production security headers and enforce strict build gates in next.config.ts`

---

### Task 5: Production Deployment Essentials — Health Check API & Production SEO

**Files:**
- Create: `src/app/api/health/route.ts`
- Create: `src/app/robots.ts`
- Create: `src/app/sitemap.ts`

**Interfaces:**
- Consumes: Next.js App Router route handlers and metadata API.
- Produces:
  - `GET /api/health` returning operational status JSON `{ status: "ok", timestamp, uptime, environment }`.
  - `/robots.txt` dynamically generated disallowing sensitive paths (`/admin`, `/system-access`) and referencing sitemap.
  - `/sitemap.xml` dynamically generated for public store and builder routes.

- [ ] **Step 1: Create `src/app/api/health/route.ts`**
  - Implement standard health check endpoint returning JSON response with status code 200.
  - Must not leak internal credentials or server keys.

- [ ] **Step 2: Create `src/app/robots.ts`**
  - Use Next.js Metadata `MetadataRoute.Robots`.
  - Allow `/`, `/builder`, `/pre-builts`, `/about`, `/contact`, `/faq`.
  - Disallow `/admin`, `/system-access`, `/api/`.
  - Reference `https://buildbot.ph/sitemap.xml` (or `process.env.NEXT_PUBLIC_APP_URL`).

- [ ] **Step 3: Create `src/app/sitemap.ts`**
  - Use Next.js Metadata `MetadataRoute.Sitemap`.
  - Return canonical public routes with change frequency and priority.

- [ ] **Step 4: Verify routes via typecheck and build**
  - Run: `npm run typecheck`
  - Run: `npm run lint`

- [ ] **Step 5: Commit health and SEO endpoints**
  - Commit: `feat(production): add /api/health route, dynamic robots.txt, and sitemap.ts`

---

### Task 6: Firebase Production Deployment Sync & Environment Secrets Template

**Files:**
- Modify: `firebase.json`
- Create: `.env.example`

**Interfaces:**
- Consumes: Firebase CLI rules configuration and current runtime environment needs.
- Produces:
  - `firebase.json` with `storage.rules` properly declared alongside `firestore.rules` and `firestore.indexes.json`.
  - Clear, comprehensive `.env.example` documenting all client public vars (`NEXT_PUBLIC_*`) and server secrets (Firebase Admin, Gemini API, PayMongo).

- [ ] **Step 1: Link `storage.rules` in `firebase.json`**
  - Add `"storage": { "rules": "storage.rules" }` to `firebase.json`.
  - Verify JSON syntax.

- [ ] **Step 2: Author comprehensive `.env.example`**
  - Document all public client keys:
    - `NEXT_PUBLIC_FIREBASE_API_KEY`
    - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
    - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
    - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
    - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
    - `NEXT_PUBLIC_FIREBASE_APP_ID`
    - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
    - `NEXT_PUBLIC_APP_URL`
  - Document all server-side secrets:
    - `FIREBASE_ADMIN_PROJECT_ID`
    - `FIREBASE_ADMIN_CLIENT_EMAIL`
    - `FIREBASE_ADMIN_PRIVATE_KEY`
    - `GEMINI_API_KEY`
    - `PAYMONGO_SECRET_KEY`
    - `PAYMONGO_PUBLIC_KEY`
    - `PAYMONGO_WEBHOOK_SECRET`
    - `SUPER_ADMIN_SETUP_KEY`
    - `MANAGER_SETUP_KEY`

- [ ] **Step 3: Commit Firebase config and environment template**
  - Commit: `chore(deploy): link storage.rules in firebase.json and provide comprehensive .env.example`

---

### Task 7: GitHub Actions CI/CD Quality Gate Workflow

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: Git push / PR events on `main`.
- Produces: Automated verification pipeline running Node 20, dependency install, typecheck, lint, and build.

- [ ] **Step 1: Create `.github/workflows/ci.yml`**
  - Configure workflow with:
    - Node version: `20.x`
    - Package manager: `npm` with cache
    - Run: `npm ci`
    - Run: `npm run typecheck`
    - Run: `npm run lint`
    - Run: `npm run build` with dummy public env vars to validate build compilation.

- [ ] **Step 2: Commit CI workflow**
  - Commit: `ci: add GitHub Actions continuous integration quality gate workflow`

---

### Task 8: [SKIPPED per user request] Author Comprehensive Deployment Handover Package (`docs/DEPLOYMENT_HANDOVER.md`)
*Skipped by user instruction.*

---

### Task 9: [SKIPPED per user request] Final Full-System Verification & Changelog Update
*Handover doc generation & changelog update skipped by user instruction. Core verification loop (`typecheck`, `lint`, and `build`) remains executed within Tasks 1-7.*

