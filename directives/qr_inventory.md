# QR inventory identity, public pages and migration

## Identity and creation

- Keep the existing Firebase document ID and all stock/order/component references. The public product ID is a separate global sequential `PRD-000123` value shared by parts and prebuilts.
- SKUs use `SKU-` followed by CPU, GPU, MTB, RAM, STG, PSU, CSE, CLR, MNT, KBD, MOU, HDT or PC, immediately followed by eight random characters. Do not insert another hyphen.
- Only verified manager/super-admin server operations may allocate identities. Read/allocate the counter and reserve the SKU, public ID, QR mapping and actor-scoped operation result in one Firestore transaction.
- Opening a form reserves nothing. Display read-only pending labels, then actual immutable identifiers with copy buttons in saved/edit views. Retries of an unchanged save return the same identity.
- Preserve one catalog record plus stock count. Do not introduce per-unit, batch or duplicated inventory entries.
- Preserve the current saving guards: disable Cancel/AI/Save during persistence, prevent outside/Escape dismissal, retain inputs after errors, close only after confirmed persistence. Ancillary audit/cache failures must not make a committed creation look unsuccessful.

## QR and public behavior

- Default QR origin: `https://buildbotai--studio-3150054754-c7d0b.us-central1.hosted.app`; optional override is `NEXT_PUBLIC_QR_ORIGIN`, an HTTPS origin without a path. Tokens survive edits and downloads.
- Guests and customers use the same public `/parts/PRD-...` or `/pre-builts/PRD-...` page. Reservations require verified customer identity and fresh server stock/prices. Reject a stale displayed price before any deduction.
- Staff QR scans go to the exact admin item; archived items go to Archive. Preserve the selected item through required System Access verification. Query parameters are never role authority.
- Wait for initial auth resolution before QR routing. Return role-dependent destinations with no-store caching. Scanning never mutates stock.
- Public responses explicitly select safe fields and omit canonical paths/Firebase IDs. Existing client inventory reads still carry internal IDs; a public display ID is not an access-control boundary.
- Include every prebuilt component and missing/out-of-stock placeholder, count repeated RAM/storage references and retain legacy name lookup. Do not expose an unresolved internal ID as a public component name.
- Derive prebuilt prices from resolved current component prices, including repeats and the virtual included cooler at zero price. Legacy reservation calls also require identity and use server product data.
- Individual QR PNG download only, named with the SKU, black on white with four-module margins. No bulk export, printer setup or label sheets.

## Verification

1. Run `npm run typecheck` and `npm run lint` after edits. Finish both before `npm run build`; the build rewrites generated Next type files.
2. With Java 21+ available and port 9002 free, run `npm run test:qr`. The runner starts only a demo Firebase project through `firebase.qr-test.json`, executes integration tests and starts an isolated Next dev server on port 9002 for Playwright.
3. The test server uses `.next-qr-test`, a demo-project response header and explicit emulator configuration. Refuse an occupied port rather than testing an unrelated/live server. On Windows, stop the entire task-owned test server tree; killing only the Next CLI can leave its listener running.
4. Browser checks cover public part/accessory/prebuilt pages, customer sign-in return, staff QR destinations, actual PNG decoding, Add Part, Add System and mobile overflow. Do not weaken compatibility validation to accommodate incomplete fixtures.
5. Prebuilt selectors need explicit `type="button"`, accessible category labels and collision bounds inside the modal scroll viewport. Keep popups within the visible interactive surface; do not force test clicks through an overlay.
6. Verify every existing catalog field with the before/after read-only hash audit. Metadata assignment must preserve stock, prices, images, descriptions and component/order references.
7. Clear only the isolated server's validated `.next-qr-test/cache/fetch-cache` before each browser run. Fresh emulator fixtures must not reuse the prior run's persisted public-catalog results. Keep selectors aligned with the current UI; scope alert assertions to exclude Next's route announcer. A disabled QR download has no href and is not exposed as a navigable link.

## QR recovery and diagnostics

- All resolver responses, including failures, carry private/no-store caching and Vary: Authorization. Use typed public-safe errors; stale staff roles require sign-in again rather than a customer downgrade. Preserve only allowlisted internal QR paths through reauthentication.
- Keep QR images keyed to the current token, SKU and rendering attempt. Hide stale images synchronously when props change; rendering retries never create catalog records.
- Preserve the existing UI. Copy QR link joins the current QR actions; retain the existing View product page action. QR health is an on-demand dialog in the existing stock/prebuilt header, not a new dashboard layout.
- The authenticated health endpoint checks both token claims and current profile before returning even cached results. Its read-only snapshot has a 10,000-product/registry limit and a one-minute process-local cache. Oversized or failed audits must not appear healthy. Report intentional disabled/archive states separately from defects.
- Reuse `execution/verify_product_identities.ts --project=<project> --report=<local-json-path>` for structured diagnostics. Reports never repair mappings, regenerate identifiers or alter stock. Production reports and release evidence belong under ignored `.tmp/`.

## Camera scanner lifecycle

- Keep camera-start effects independent of inline scan callbacks. Store the latest scan handler in a ref so status renders do not close and reopen the stream.
- Stop tracks when a camera request resolves after the dialog closes or the user switches tabs/cameras. Ignore scan frames from an earlier camera session.
- Browser camera access requires HTTPS or localhost. Show actionable permission, missing-device and busy-device errors, with a retry action and manual lookup available.
- Browser regression coverage should count camera starts while the dialog stays open and verify one new start after switching away and back.
- QR image uploads decode locally in the browser and must use the same validated result handler and authenticated resolver as camera scans. Accept only supported image formats, enforce a bounded file size, and never persist or transmit the uploaded image.

## Production data and rollout

1. Confirm `--project=studio-3150054754-c7d0b` and take a recoverable managed Firestore export in the separate `<project>-private-backups` bucket with public access prevention and uniform IAM access enforced. Never use the public Firebase asset bucket for database exports. `execution/backup_qr_catalog.ts` checks the private bucket and supports an Admin identity with export permissions. If that identity is denied, use an already authorized gcloud account; do not grant additional IAM privileges as a workaround.
2. For gcloud, run `gcloud firestore export gs://<project>-private-backups/backups/<unique-prefix> --project=<project> --format=json`, then verify the full operation with `gcloud firestore operations describe <operation> --project=<project> --format=json`. Only `done: true` and successful operation state establish a completed backup. Verify guest/customer access is denied. Record its project, private URI, operation, `private: true` and completion time in the ignored local backup manifest. If an export is relocated, preserve the export folder/metadata names, compare every object's size and checksum, and remove only the verified task-created source copy afterward.
3. Run the read-only original-field snapshot:
   `npx tsx execution/verify_product_identities.ts --project=<project> --snapshot=.tmp/qr-original-fields.json`.
4. Dry-run: `npx tsx execution/migrate_product_identities.ts --project=<project>`. Its audit path must use reads only; never call a potentially mutating identity helper during dry-run validation.
5. Apply the approved additive migration only with a completed matching backup less than 24 hours old:
   `npx tsx execution/migrate_product_identities.ts --project=<project> --apply --backup=.tmp/qr-backup.json --manifest=.tmp/qr-migration-applied.json`.
6. Verify with `npx tsx execution/verify_product_identities.ts --project=<project> --before=.tmp/qr-original-fields.json`, then rerun the migration dry-run. Require valid unique identifiers, correct mappings, no pending identities and unchanged original-field hashes. Review concurrent catalog changes instead of overwriting them.
7. Release application source and rules as one coordinated rollout. Do not deploy the new create-denying rules while the hosted UI still uses legacy client creation. Recheck for products created by old clients during the transition.
8. The fixed hosted QR address only serves the new resolver after the application release. Local implementation and metadata backfill alone do not publish that route.
9. Roll back feature routes/flags without renumbering products or restoring an old database snapshot over subsequent activity. Keep the export and migration manifest; delete neither original documents nor historical records during rollout.

## Completed backfill reference (2026-10-21 Asia/Manila)

- Project `studio-3150054754-c7d0b`: 324 parts plus 56 prebuilts received 380 unique identities; counter 380, unassigned zero. The original-field hash audit passed for every record.
- Private export: `gs://studio-3150054754-c7d0b-private-backups/backups/qr-inventory-2026-10-20-v1`; 316 objects, 819135661 bytes, size/checksum verification completed. A temporary copy in the public asset bucket was removed after the verified private copy was secured. Never repeat that export destination.
- Evidence: ignored `.tmp/qr-backup.json`, `.tmp/qr-original-fields.json`, `.tmp/qr-migration-applied.json` (interrupted initial run), `.tmp/qr-migration-resumed.json` (completed), and `.tmp/qr-private-copy-check.json`. Preserve these for release reconciliation.
- Release reconciliation on 2026-10-21: hosted commit `3676b1456485c6076428176661a11684b1cb8f8d` was already live. After explicit user approval, deployed the matching QR rules at 20:35 Asia/Manila and verified exact normalized contents at 20:37. The dry-run found zero pending identities; all 23 hosted checks passed and original catalog-field hashes stayed unchanged. Evidence: `.tmp/qr-phase0-release.json`, `.tmp/qr-phase0-hosted-checks.json`, `.tmp/qr-phase01-before.json`, `.tmp/qr-phase01-dry-run.json`, `.tmp/qr-phase01-health.json`. No additional backfill was needed. Physical printed-label scanning remains a manual check.
