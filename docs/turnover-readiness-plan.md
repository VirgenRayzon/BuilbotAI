# BuildbotAI deployment and code handover plan

**Status:** Proposed plan, 8 November 2026. This document is a work plan, not a deployment approval or a claim that production has been verified.

## Goal and scope

Hand over a deployable, maintainable BuildbotAI release with repeatable checks, documented operations, and a clear owner for production access. Preserve customer, staff, inventory, order, and AI behavior while making targeted cleanup changes. Do not run data migrations or delete legacy paths merely to make the repository look smaller.

## Findings that shape the work

- The working tree was clean when this plan was prepared. `npm run typecheck` and `npm run lint` passed. A fresh build, full Playwright run, and hosted smoke test were **not** performed for this plan.
- [`next.config.ts`](../next.config.ts) sets `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` to `true`. A successful build therefore cannot serve as the only quality gate.
- [`package.json`](../package.json) uses the deprecated `next lint` command, lacks a single test script, and has no declared Node engine. No `.github` workflow was found.
- Current checkout and reservation actions verify Firebase ID tokens, while [`docs/firebase-and-data.md`](firebase-and-data.md) still describes some of those paths as unverified. The security documentation needs reconciliation with current code.
- [`src/app/actions.ts`](../src/app/actions.ts) contains a server-side hardcoded superadmin key fallback. Its necessity and removal path need an explicit access review before release.
- [`storage.rules`](../storage.rules) exists, but [`firebase.json`](../firebase.json) does not reference it. The actual deployment state is unknown.
- 92 TypeScript/TSX files exceed 300 lines; the largest include checkout actions, checkout page, checkout modal, prebuilt dialog, and AI settings. These are candidates for focused extraction, not a mass refactor.
- The repository tracks `test-results/.last-run.json`, root-level temporary/debug-looking files (`debug-response.json`, `temp_build.json`, `test-ai.ts`, `test-genkit.ts`, `test-nv.ts`), six images in `design_mocks/`, and 12 byte-identical image pairs across `public/` and `src/assets/`. These are audit candidates, not approved deletions. App code imports some `src/assets/` copies; the `public/` copies need a separate URL-reference check.
- `.agents/skills/` accounts for 360 tracked files. Confirm which local agent skills are part of the handover before pruning this directory; it is not application runtime code.
- [`docs/implementation-plan-and-results.md`](implementation-plan-and-results.md) already outlines release steps, but production revision, live service state, and operator handover remain unverified there.

## Work sequence

### P0 — Release blockers

1. **Freeze and identify the release.** Record the intended Git commit, hosting backend, Firebase project, domain, owner, and staging environment. Establish a known-good revision and a rollback path. Keep test and production credentials out of the repository.
   - **Done when:** the release record names the exact revision and target, and an operator can identify who can deploy and roll back.
2. **Review every privileged boundary.** Inventory Server Actions, API routes, Firestore rules, and Storage rules. Verify identity and role checks on the server, especially admin SDK writes, key management, inventory mutations, order/payment status, and webhook handling. Remove hardcoded role-key fallback after a replacement access process is proven. Add focused authorization tests for denied and allowed calls.
   - **Done when:** each privileged entry point has an explicit actor check, negative tests pass, and the fallback key is retired or has a documented release-blocking exception.
3. **Make release checks reliable.** Replace `next lint` with the ESLint CLI, align the ESLint/Next configuration, and remove build bypass flags after fixing any exposed failures. Add repeatable unit and E2E test commands and a CI workflow that runs install, typecheck, lint, tests, and build. Pin a supported Node runtime.
   - **Done when:** a clean checkout passes the same checks locally and in CI, and `npm run build` fails on TypeScript or lint errors.
4. **Verify Firebase configuration and data safety.** Compare deployed Firestore rules/indexes and Storage rules with checked-in files; wire Storage rules into deployment configuration if this repo owns deployment. Validate required environment variables, Auth providers, service identity, and least-privilege access. Export Firestore before any data or rule migration; rehearse recovery in staging.
   - **Done when:** the operator has deployment evidence, a recoverable export, and a tested staging rollback procedure.

### P1 — Targeted code and test cleanup

5. **Map and protect critical journeys.** Run targeted Playwright and unit coverage for customer sign-in, builder compatibility, stock/price authority, checkout and cancellation, manager/superadmin access, PayMongo/webhook paths, PDFs, and AI fallback behavior. Use emulators or staging for state-changing tests; avoid production test orders.
   - **Done when:** critical tests are repeatable, failures are triaged, and a release test report records the commands and results.
6. **Refactor only high-risk large modules.** Start with checkout actions and the checkout UI; move validation, data access, and mutations into focused server modules/hooks and leave components as presentation. Continue with other files over 300 lines only where a clear ownership or review problem remains. Keep behavior tests green after each slice.
   - **Done when:** the touched UI components meet the project size/style rules, responsibility boundaries are clear, and no observed customer or staff flow changes unintentionally.
7. **Inventory and remove redundant files.** Build a tracked-file manifest with path, size, owner, references, runtime/test/deployment role, and proposed action (`keep`, `move to archive`, or `remove`). Start with the tracked Playwright result, temporary/debug-looking root files, `design_mocks/`, duplicate image pairs, and unused assets. Check static imports **and** literal URL use before choosing one image copy. Inspect debug artifacts for sensitive content before sharing or archiving them. Review `.agents/skills/`, old docs, and test scripts with their owners; keep migration and recovery tools that are still needed. Use import/reference searches and runtime checks before deleting components, old flags, logging, or legacy Firestore fallbacks. Add generated test output to `.gitignore` where appropriate, and update `docs/project_structure.md` after approved removals.
   - **Done when:** a removal log records evidence and owner for each deleted or archived file, no runtime URL/import is broken, generated output stays untracked, and the release suite passes.

### P1 — Handover package

8. **Reconcile documentation with code.** Update README, architecture, API/Firebase documentation, project structure, environment variable template, and operational directives. Correct the stale authorization description and distinguish configured, tested, and deployed states.
   - **Done when:** a new maintainer can install, configure, run, test, and trace the main flows from current docs without asking for undocumented commands or secrets.
9. **Write an operator runbook.** Include release and rollback commands, secret ownership and rotation, Firestore export/restore, rules and index deployment, health checks, expected logs, incident contacts, and known limitations. Keep credentials in a secret manager, not the runbook.
   - **Done when:** a second operator can rehearse deployment and rollback in staging using the runbook.

### P2 — Final release and transfer

10. **Rehearse, release, and observe.** Run the full gate on the exact release commit, perform staging smoke tests, deploy through the chosen pipeline, and repeat smoke checks on the hosted URL. Check stock/order consistency, payment callbacks, AI failures, and error logs during the agreed observation window.
    - **Done when:** the release record contains commit, time, target, check results, smoke-test evidence, outstanding issues, and an owner acceptance sign-off.

## Release gate

Do not mark turnover complete until typecheck, lint, unit tests, relevant Playwright tests, and production build pass on the release commit; privileged boundaries and Firebase rules are reviewed; backup and rollback are rehearsed; documentation matches code; and hosted smoke tests pass. Record any exception with impact, mitigation, and owner before deciding whether to ship.

## Suggested execution order

Run P0 items first, then critical-journey tests before behavior-preserving refactors. Land cleanup in small conventional commits so each change can be reviewed and reverted independently. Documentation and runbook updates should follow the verified implementation, with a final reconciliation immediately before handover.
