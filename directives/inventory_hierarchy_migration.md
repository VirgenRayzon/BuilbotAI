# Inventory hierarchy migration plan

## Goal and canonical paths

Make Firestore inventory items appear under one root collection, with lowercase category document IDs:

```text
/inventory/cpu/items/{partId}
/inventory/gpu/items/{partId}
/inventory/psu/items/{partId}
```

Use these twelve category IDs: `cpu`, `gpu`, `motherboard`, `ram`, `storage`, `psu`, `case`, `cooler`, `monitor`, `keyboard`, `mouse`, `headset`. `/inventory` is a collection; each category is a small document; `items` is a subcollection; each part remains an individual document. The 1 MiB document limit applies independently to each category document and each part document. Do not place all parts in a category document or store images as document bytes. Keep images in Firebase Storage and store their URLs in part documents.

Category path IDs are lowercase storage slugs. Keep the existing `Part.category` display/domain values (`CPU`, `GPU`, `Motherboard`, etc.) during this migration so builders, AI schemas, specifications, filters, orders, and UI copy continue to work. Create one central mapping between those values and lowercase slugs, with validation that rejects unknown categories. Do not derive paths from unchecked order or form data. The category document may hold small metadata such as `label`, `sortOrder`, and `isActive`.

## Current project state (code inspection, 2026-10-10)

- The screenshot shows twelve legacy root collections. `execution/consolidate_collections.ts` copies them into `/parts`, and current catalog/admin writes and most reads use `/parts`.
- `src/firebase/database.ts` writes parts, updates stock, archives, and deletes under `/parts`.
- `src/app/actions.ts` serves the cached builder catalog from `/parts`; `src/app/admin/hooks/use-inventory.ts`, `src/app/ai-build-advisor/hooks/use-advisor-data.ts`, and `src/app/admin/prebuilt-builder/page.tsx` also read `/parts`.
- `src/lib/inventory-fetcher.ts` serves AI inventory queries from `/parts`, filtering on the existing title-case `category` field.
- `src/app/checkout-actions.ts` and `src/app/prebuilt-reservation-actions.ts` still resolve item IDs against the legacy category root collections for stock transactions. These must be updated in the same cutover as the catalog. Historical order snapshots contain category labels and must remain readable.
- `firestore.rules` grants access to `/parts` and contains a broad root category match. `firestore.indexes.json` currently has a vector index on a different `items` subcollection. The live database's exact contents and deployment state must be checked before copying or deleting anything.
- `docs/database_scalability_plan.md` previously proposed `/parts` as the future target. This directive supersedes that inventory path recommendation; the new target is `/inventory/{categorySlug}/items/{partId}`.

## Execution status (2026-10-10)

- Completed a managed Firestore export of all 13 source collections (624 documents) at `gs://studio-3150054754-c7d0b.firebasestorage.app/backups/inventory-hierarchy-2026-10-10-v2`. The export operation finished successfully.
- Ran `execution/migrate_inventory_hierarchy.ts` against project `studio-3150054754-c7d0b`. It copied 312 unique part documents into the twelve lowercase category paths and created category metadata documents. The source collections were not changed.
- Reconciled 18 source differences: 17 matched checkout stock deductions and popularity increments in the legacy category collections; one stock-only difference retained the `/parts` value. The migration tool records the exact reconciliations and fails on any unexplained difference.
- `execution/verify_inventory_hierarchy.ts` confirmed 312 destination documents, category metadata, and active-item queries. A second migration dry run matched all 312 destination documents with zero conflicts.
- Deployed `firestore.rules` and `firestore.indexes.json` to the same project. The broad root read wildcard was replaced with explicit matches for legacy categories, prebuilt systems, and site content; the new inventory paths have explicit rules. The `isArchived` plus `searchKeywords` index reached READY, and an active CPU search query succeeded.
- Verified unauthenticated client reads for an inventory category, an inventory item, a prebuilt system, and About content using `execution/verify_public_firestore_reads.ts`.
- Application code now targets the new hierarchy; `npm run typecheck`, `npm run build`, and the path tests pass. The App Hosting backend deploys from GitHub. Verify its rollout after the main-branch push, rerun the dry run to detect any writes made to old paths during the transition, and verify stock transactions against the new paths. Do not delete the source collections yet.

## Implementation sequence

1. **Preflight and backup.** Confirm the active Firebase project and database, count documents in `/parts` and each legacy category collection, identify duplicate part IDs and divergent versions, and record the source of truth for each part. Take a recoverable Firestore export before production changes. Treat `/parts` as the default source only after verifying it has the current stock and edits. Record a manifest of source path, destination path, ID, category, and key fields. Do not run the existing consolidation script for this target; it writes to `/parts`.
2. **Centralize paths.** Add a typed category-to-slug map and one path helper for `/inventory/{slug}/items/{partId}`. Preserve part IDs. Update all part CRUD and bulk actions in `src/firebase/database.ts`, catalog readers in `src/app/actions.ts`, admin/builder/advisor readers, AI inventory retrieval in `src/lib/inventory-fetcher.ts`, and every server action that resolves an item by ID. Search the repository again for literal `/parts`, legacy category collection references, and `collection(item.category)` before cutover. Keep prebuilt systems and non-inventory collections outside this hierarchy.
3. **Fix checkout as one unit.** Make checkout, cancellation stock restoration, and prebuilt reservation use the same canonical path helper inside their Firestore transactions. Preserve the existing stock and popularity updates. Keep order `category` values compatible with historical snapshots; map them to slugs when resolving paths. Check that historical orders can still be cancelled or updated after cutover.
4. **Rules and indexes.** Add an explicit rule for `/inventory/{categorySlug}` metadata and `/inventory/{categorySlug}/items/{partId}`, with the intended public catalog read and staff write permissions. Restrict category slugs to the approved list. Replace the broad root wildcard with explicit rules for the legacy categories and other root collections that the client uses; retire those legacy rules after cutover. Define and deploy indexes for the actual category `items` queries, including archive/search filters and pagination if used. Avoid a broad `collectionGroup('items')` query without a discriminator: the project already has `/buildbot_hardware_vector/{category}/items/{id}`. Query each category subcollection directly unless a separately reviewed cross-category query is required.
5. **Stage and copy.** First deploy code/rules able to read the target and handle the transition, then copy source documents to the new paths in resumable bounded batches. Set category metadata documents, preserve timestamps and item IDs, and log collisions instead of overwriting silently. Validate counts and representative values per category, including stock, archived state, images, specifications, and search keywords. Ensure any writes during the copy are replayed or temporarily coordinated so stock cannot diverge.
6. **Cut over and verify.** Switch all inventory writes and reads to the new paths together. Exercise add/edit/archive/delete, stock adjustment, admin listing, builder and advisor retrieval, AI lookup, checkout, cancellation, and prebuilt reservation against the emulator and a staging project. Run `npm run typecheck` and `npm run build`; use port 9002 for browser checks. Confirm reads return the expected categories and that a stock deduction lands on the same document displayed in the catalog. Keep old collections and `/parts` read-only until production checks and a rollback window are complete. Archive/delete them only as a separately reviewed cleanup step.

## Completion criteria

- Every new part and every stock transaction uses `/inventory/{lowercaseCategory}/items/{partId}`.
- Existing part IDs and user-facing category labels remain stable; historical orders resolve correctly.
- Rules permit intended reads and authorized writes and deny invalid category slugs.
- Per-category source/destination counts and sampled document fields match; no inventory writes remain on `/parts` or legacy root collections.
- The scalability plan and any related architecture documentation refer to this hierarchy as the inventory source of truth.
