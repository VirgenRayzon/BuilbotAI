# Implementation Plan and Results

This section is based on the checked-in application, configuration, scripts, and dated project records. The **plan** describes a proposed release process; it is not a claim that every step has occurred. The **results** distinguish artifacts visible in this repository from previously recorded checks and work that still needs verification.

## Implementation Plan

### System overview and deployment approach

BuildbotAI is a Next.js 15 web application for PC component selection, compatibility analysis, AI advice, prebuilt browsing, reservations, and staff management. The browser uses Firebase Authentication, Cloud Firestore, and Cloud Storage. Next.js route handlers and server actions use the Firebase Admin SDK and Google AI services. The configured Firebase project is selected in `.firebaserc`; `apphosting.yaml` contains App Hosting runtime settings and environment variable declarations. `firebase.json` defines Firestore rules, indexes, and a Hosting source. These files describe intended configuration, but do not by themselves prove the current deployed revision or its service state.

The proposed transition is a staged release of the existing application, followed by validation of the deployed revision and a monitored handover. No new infrastructure product, payment service, or data migration is assumed for a routine code release.

### Major implementation tasks

| Stage | Planned work | Completion evidence |
| --- | --- | --- |
| 1. Confirm target | Identify the release revision, Firebase project, App Hosting backend, domain, and responsible operator. Review required environment variables without copying secrets into source control. Confirm that Auth providers, Firestore, Storage, and Google AI access exist in the target project. | Recorded revision and target, validated configuration and access. |
| 2. Protect data | Take a recoverable Firestore export before any schema or data change. Compare live inventory paths with `src/lib/inventory-paths.ts`; run migration scripts only if a specific migration is required and reviewed. Preserve existing orders and legacy references during any cutover. | Export record, collection counts, migration dry-run/verification output if applicable. |
| 3. Prepare release | Install from the lockfile, run `npm run typecheck`, `npm run lint`, `npm run build`, and relevant Playwright tests against a production-like build. The Next.js configuration skips type and lint checks during `next build`, so the separate commands are required. | Command logs with zero errors and test report. |
| 4. Review access and configuration | Check Firestore rules/indexes against the target project and verify customer, manager, and superadmin flows. Resolve the Admin SDK server-action authorization boundary documented in [Firebase integration](firebase-and-data.md#authentication-and-authorization) before treating the release as production-ready. Confirm whether `storage.rules` is deployed; `firebase.json` currently has no Storage rules entry. | Role test results, rule/index deployment record, security review outcome. |
| 5. Deploy and smoke test | Release the verified revision through the project's actual hosting workflow. Check public landing/content pages, customer sign-in and builder, prebuilt listing/detail, reservation and cancellation stock effects, staff inventory and order controls, PDF download, and AI behavior where credentials are available. Use the actual hosted URL for this stage. | Deployment revision, timestamp, URL, smoke-test notes, monitored errors. |
| 6. Handover and recovery | Give the operator the setup/runbook links, note known limitations, and monitor errors and stock/order consistency after rollout. If a release fails, redeploy the prior known-good revision; restore data from an export only when a data change requires it and its effects are reviewed. | Handover record, monitoring notes, rollback decision or closure. |

The existing local workflow is `npm install`, `npm run dev` on port **9002**, and optionally `npm run genkit:dev` for AI flow development (`package.json`). A production-like local check can use `npm run build` followed by `npm run start -- -p 9002`; the production performance directives say to stop the development server first so both commands do not share `.next` concurrently. `tests/` contains Playwright coverage for role navigation, chat part specifications, sales export, and landing behavior. Live service tests need suitable test accounts, credentials, and a safe target project.

### Resources and site-specific requirements

These are requirements inferred from the implementation, not measured capacity estimates.

| Resource | Needed for implementation |
| --- | --- |
| Hardware and connectivity | Developer/test computer able to run Node.js and a browser; reliable internet access to Firebase and Google AI. App Hosting capacity should be sized from actual traffic. `apphosting.yaml` currently sets `maxInstances: 1`; no load-capacity benchmark is established here. |
| Software and services | Node.js/npm, Git, Next.js dependencies, Firebase project with Auth/Firestore/Storage, App Hosting or another verified Next.js host, Google AI credentials, and Playwright browser for E2E checks. |
| Facilities and materials | A controlled test environment or staging project, credential storage, Firestore export location, test accounts, deployment log, test report, and operator documentation. No physical retail facility requirement can be established from source code. |
| Personnel | A maintainer/operator to manage the release and secrets, a Firebase administrator to confirm rules/data/access, and testers familiar with customer and staff flows. Exact staffing and ownership are project decisions not recorded in the codebase. |
| Philippine-market behavior | Display prices in PHP; `src/lib/utils.ts` defines a USD-to-PHP helper using a rate of 60. Validate real inventory prices and stock in the target Firestore project before customer use. |

## Implementation Results

### Outputs present in the repository

| Output | Verified evidence | Limit |
| --- | --- | --- |
| Web application | Seventeen App Router pages, three HTTP POST handlers, shared components/hooks, and server actions are present under `src/app/`; see the [page audit](pages.md) and [API inventory](api-and-integrations.md). | Presence of code does not prove hosted availability. |
| Data and access configuration | `firestore.rules`, `firestore.indexes.json`, `storage.rules`, `firebase.json`, `.firebaserc`, and `apphosting.yaml` are present. Canonical inventory paths are implemented in `src/lib/inventory-paths.ts`. | The live rules, indexes, data, Auth provider settings, and Storage rules deployment were not checked in this documentation task. |
| Operational scripts and checks | `execution/` includes inventory migration and verification tools; `tests/` includes Playwright scenarios. Husky's pre-commit hook runs the typecheck. | Scripts and test files are available; a full deployment rehearsal was not run for this section. |
| User and staff workflows | Source implements customer sign-in and profile, builder/advisor, prebuilt reservation, staff dashboard, order status updates, and notifications. | External shipping, payment, contact-form delivery, and warranty operations are not established by the source. |

### Previously recorded implementation evidence

- The [inventory hierarchy directive](../directives/inventory_hierarchy_migration.md#execution-status-2026-10-10) records a **10 October 2026** Firestore export, migration of **312 unique part documents** to twelve category paths, verification of destination documents, and deployment of Firestore rules/indexes to the named project. This is a dated project record, not a fresh count of the live database.
- The [landing performance audit](landing_performance_audit.md#verification-and-artifacts) records a local production build, typecheck, lint, and **17 passing Playwright tests** for its 16 October 2026 phase. The [admin and builder audit](inventory_performance_audit.md#validation-and-artifacts) records **23 passing Playwright tests** and local performance samples for a later phase. Both reports explicitly say their performance changes had **not** yet been verified on the hosted revision.

### Current documentation-phase verification

For this documentation update, `npm run typecheck` and `npm run lint` were run locally and passed. This verifies the current checkout's TypeScript and lint state. It does not validate a production deployment, the live Firebase project, or AI provider availability. A fresh production build, full Playwright suite, deployed smoke test, user acceptance result, and operator handover remain **unverified for this documentation phase**. No application functionality or infrastructure setting was changed here.

The most important release gate is the server-side authorization review noted above. The project also needs a confirmed live deployment revision and post-deployment checks before reporting a completed operational transition.
