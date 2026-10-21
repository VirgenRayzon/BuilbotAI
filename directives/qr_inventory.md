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
- Source and rules remain pending a coordinated hosted release. Re-run the read-only audit and migration dry-run at cutover to find any new legacy-client products; take a fresh private backup before another apply.
