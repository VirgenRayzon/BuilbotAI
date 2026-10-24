# QR inventory and public product catalog — implementation plan

Date: 2026-10-20. Updated: 2026-10-21 (Asia/Manila). Status: original QR feature deployed; production metadata migration and rules rollout verified. A physical printed-label scan remains a manual release check. Phase 1 follow-up changes are tracked in `docs/qr_system_improvement_plan.md`.

## Confirmed requirements

- Make the prebuilt listing and product pages accessible to guests.
- Add a public parts catalog and individual part pages with features and descriptions, using a similar layout to prebuilt pages.
- Keep the existing inventory model: one product record with a stock count. The proposal to allow multiple inventory entries is withdrawn and must not be implemented. Retain duplicate-name protection and current stock/reservation behavior.
- Automatically assign a product ID, SKU and QR link when a new part or prebuilt is saved.
- In Add Part and Add System, show read-only identifier previews and finalize identifiers only on a successful save. Existing identifiers remain read-only in edit forms.
- Keep the Firebase document ID as the internal database key. Assign a separate public product ID in the sequential format `PRD-000123` across parts and prebuilts.
- Guests scanning a QR open the matching public product page. Signed-in customers open the same URL and content, with account actions enabled.
- Managers and super admins scanning a QR open the matching item in the admin inventory or prebuilt management view.
- Guest pages show price, specifications, description and availability. Reserving requires sign-in.
- Backfill existing parts and prebuilts with public product IDs, SKU and QR support while preserving their existing internal database IDs and references.
- Use `https://buildbotai--studio-3150054754-c7d0b.us-central1.hosted.app` as the QR origin for this release, with configuration supporting a later domain change.
- Include individual QR downloads only. Bulk label sheets and built-in print/printer workflows are excluded from this release.

## Selected identifier formats

The user selected `SKU-<CATEGORY CODE><8 random characters>` with no separator between the category code and random suffix. The only SKU hyphen is after `SKU`. The public product ID is a separate sequential `PRD-000123` value; Firebase document IDs remain internal database keys.

| Identifier | Format / example | Behavior |
| --- | --- | --- |
| Part SKU | `SKU-CPU7K4M2Q8X`, `SKU-GPU9R3W6H2N` | Literal `SKU-` prefix, approved category code, then eight random uppercase characters with no additional separator. |
| Prebuilt SKU | `SKU-PC6R8W3H2N` | Same format with `PC` as the category code. |
| Public product ID | `PRD-000001`, `PRD-000002`, ..., `PRD-000123` | One sequence shared by parts, accessories and prebuilts; allocated once on the server. |
| Internal database ID | Existing random Firestore document ID | Preserve existing internal IDs and references; generate a random document ID for new records. Do not use it as the displayed public product ID. |
| QR URL | `https://buildbotai--studio-3150054754-c7d0b.us-central1.hosted.app/q/<random-token>` | Stable resolver URL identifying a part or prebuilt; route according to the scanner's verified role. |

Approved category mapping and examples:

| Category | Code | Example SKU |
| --- | --- | --- |
| CPU | `CPU` | `SKU-CPU7K4M2Q8X` |
| GPU | `GPU` | `SKU-GPU9R3W6H2N` |
| Motherboard | `MTB` | `SKU-MTB4T8K6P3W` |
| RAM | `RAM` | `SKU-RAM6N2X9R4K` |
| Storage | `STG` | `SKU-STG3H7M5Q8T` |
| PSU | `PSU` | `SKU-PSU8W4K2N6R` |
| Case | `CSE` | `SKU-CSE5Q9T3X7H` |
| Cooler | `CLR` | `SKU-CLR2R6N8K4M` |
| Monitor | `MNT` | `SKU-MNT7X3H9W5Q` |
| Keyboard | `KBD` | `SKU-KBD4M8R2T6N` |
| Mouse | `MOU` | `SKU-MOU9K5Q7H3X` |
| Headset | `HDT` | `SKU-HDT6T2W4N8R` |
| Prebuilt PC | `PC` | `SKU-PC3N7K9M5W` |

Implementation details: use the explicit category-code mapping above rather than deriving codes from category names. Existing inventory paths and category labels remain unchanged. Use an unambiguous uppercase alphabet for the eight-character random suffix, excluding easily confused characters. Reserve the complete SKU atomically on the server and retry a collision. Keep assigned SKUs stable after product renames or category correction.

A SKU identifies the product record, not each physical unit. Stock changes do not generate another SKU or QR. Downloading again produces the same product QR. A QR token is a routing identifier, not an authentication credential.

Public product ID allocation uses an atomic server counter and unique mapping, with at least six digits padded with zeros. Do not reset the sequence by category or date, reuse retired IDs, or renumber existing products. Values beyond six digits grow naturally. IDs must be unique and increasing; retries, abandoned operations or archived records must not force a gapless sequence. Product renames, category changes and stock updates retain the public product ID.

## Hosted origin and download scope

- Configure the QR origin explicitly as `https://buildbotai--studio-3150054754-c7d0b.us-central1.hosted.app`; do not derive production download URLs from a request host, localhost or a preview deployment.
- Persist the QR token independently from the configured origin. Download an individual PNG named after the SKU, using a black QR symbol on a white background with the required margin in both application themes.
- A future domain configuration change affects newly generated download URLs. Already printed or distributed QR images still contain the original hosted address; keep that host and its resolver available, or maintain redirects there, for those codes to continue working. Updating configuration cannot rewrite an existing physical code.
- No label printer, paper-size setup, bulk export, A4 sheets or built-in printing controls are required for the first release.

## Findings from the repository

- Canonical parts live at `/inventory/{categorySlug}/items/{partId}`; prebuilts live at `/prebuiltSystems/{systemId}`. Preserve these paths and the current category labels.
- `Part` already stores stock, images, specifications and description. `Part` and `PrebuiltSystem` need separate `productId`, SKU and QR fields; new internal database IDs are already generated during creation.
- `src/app/admin/hooks/use-inventory.ts` blocks duplicate names. Preserve that behavior; this feature does not introduce unit records, delivery records, duplicate listings or a new stock authority.
- Part and prebuilt creation currently use client writes. A server operation should allocate SKU and QR metadata with verified manager/admin authorization, strict input validation and retry protection.
- The prebuilt listing has a customer-only route guard, while the detail page already fetches its record without that wrapper. Update route requirements, guest navigation, product actions and auth-dependent layout behavior consistently.
- Firestore currently permits public catalog reads, including archived records. Guest-safe rendering must not expose internal data; visibility rules and readers must agree about unpublished and archived records.
- Checkout and prebuilt reservations already deduct component stock; cancellation restores it. This feature preserves that model and does not reconstruct stock or reallocate pending reservations.
- Prebuilts, builders, favorites, AI retrieval and orders depend on part IDs. Existing IDs, component references, descriptions, images, prices and quantities must remain intact.
- Existing client catalog reads and prebuilt URLs currently carry internal IDs. Audit those exposures and migrate customer-facing links and product responses to the public ID. Calling the database ID internal does not itself make existing public reads confidential; access boundaries must be addressed wherever confidentiality is required.
- Reuse dry-run, project-check and reconciliation patterns from the existing migration scripts and `directives/inventory_hierarchy_migration.md`. Historical migration counts do not establish current live counts.

## QR routing and page behavior

| Scanner | Destination | Actions |
| --- | --- | --- |
| Guest | Matching public part or prebuilt product page | Browse details; sign in to reserve. |
| Signed-in customer | The same product page as a guest | Enable applicable existing customer actions. |
| Manager / super admin | Matching item in the admin inventory or prebuilt management view | Existing authorized management actions. |

- The QR resolver uses server-managed mappings to identify the target's product kind, public product ID and internal canonical path. Guest/customer destinations use the public product ID; canonical paths remain server-side or in authorized staff handling. It waits for initial authentication state to settle before choosing a role destination; it must not mistake an auth-loading state for a guest.
- Use verified authentication/profile roles for routing. Query parameters such as `from=admin` never grant staff access. Admin routes and mutations continue to enforce permissions independently of the resolver.
- Firebase browser authentication may not be available to a server route without a verified session cookie. Choose client-side role resolution using the existing provider, or the existing verified server session if present; do not assume every QR request carries a server session.
- Do not permanently cache redirects whose destination varies by role. Opening a QR never changes stock, reserves a product, or performs an edit.
- Add an admin deep link that selects the correct Parts/Prebuilts tab and opens or visibly highlights the exact record. Preserve both category and ID for part lookup. After required staff sign-in, restore the intended item destination.
- Unknown or disabled tokens show a useful unavailable/not-found page. Out-of-stock product pages remain readable. Archived targets show a public-safe unavailable state; authorized staff can reach the existing archive management view.
- Public browsing must work without a user profile. An account/profile loading error must not block guest-safe product content.
- Guest sign-in for reservation returns to an allowlisted internal product URL. Sign-in must not silently submit a reservation.

## Data and creation flow

- Add `productId`, `sku`, `qrToken` and a small `schemaVersion` to canonical part/prebuilt documents; derive the QR URL from the configured permanent origin and saved token. Keep the internal document `id` separate from `productId` in types and payloads.
- Add a server-managed SKU registry for uniqueness, a global product-ID counter and server-only `productIds/{productId}` mappings to product kind and canonical path. Add server-managed `qrLinks/{token}` mappings to the public product ID and enabled state. Restrict destinations to recognized internal routes and return only the role-appropriate destination to public callers.
- Use `/parts/[productId]` and `/pre-builts/[productId]` for public detail pages. Resolve public IDs through the server-managed directory; category/path corrections update that mapping while public IDs and URLs stay stable. Retain required legacy link resolution during transition without generating new customer links from Firebase IDs.
- The creation service verifies staff identity and validates payloads with Zod. Generate the internal database ID, allocate the next public product ID, SKU and QR token, and commit the counter, product and registry/mapping records atomically. Keep random Firestore document IDs even though public product numbers are sequential.
- Prevent double-click/retry creation with an operation key scoped to the authenticated actor. Preserve the existing dialog saving/error behavior.
- Prepare image uploads before the database commit using the existing storage workflow. A failed QR image export must be retryable without creating another product.
- Make the generated QR immediately available after save. Render an individual PNG from the configured hosted origin and persisted token on demand; avoid storing large QR image bytes in Firestore.
- Updating a product preserves its internal ID, public product ID, SKU and QR token. If category/path changes, update the product-ID directory consistently while preserving existing reference-handling behavior.
- Canonical catalog documents stay public-safe. Private costs, supplier data and internal notes must not be added to publicly readable documents. Firestore reads return whole documents, so UI hiding is insufficient.
- Guest pages show availability badges. Current public database reads also expose stock fields; if exact stock counts must be confidential, use a public projection and update affected readers/rules rather than claiming UI badges enforce privacy.

## Public and admin UI

- Add `/parts` with category/search/sort controls, responsive product cards and individual part detail pages.
- Detail pages include gallery, brand/model, public product ID, SKU, PHP price, availability, product highlights, normalized description and category-specific specifications. Firebase IDs are not displayed as product IDs.
- Reuse small visual components from prebuilt pages while keeping part and prebuilt content distinct. Follow Mantine, mobile-first, light/dark, spacing and touch-target requirements.
- Make `/pre-builts` and detail navigation work for all roles. Generate public-ID URLs and retain legacy prebuilt link resolution during transition. Preserve repeated RAM/storage presentation and unavailable-component warnings.
- Keep AI report generation and management actions restricted to their existing authorized roles.
- Add public product ID and SKU display/search, QR preview and individual download actions to the existing inventory and prebuilt views. Do not introduce a Stock Entries section or receiving overhaul.
- Preserve a white margin of at least four QR modules in downloaded images. Verify scanning from the screen and a manually printed sample; printer integration and label layouts remain outside scope.

## Approved Add Part / Add System workflow

The user approved automatic, read-only identifiers finalized during saving, with no manual generation step.

### Before saving

- Place a compact Product identification section beneath the name/category fields in both forms.
- Show Product ID as `Assigned automatically on save`. Do not display a predicted next PRD number or reserve a number when the dialog opens.
- Show the SKU prefix only: for example, `SKU-CPU…`, `SKU-MTB…` or `SKU-PC…`. Changing the part category updates this prefix preview using the approved mapping; Add System always uses `PC`.
- Show QR as `Available after saving`. Do not offer a QR for an unsaved record.
- Staff cannot type or override product IDs or SKUs. AI Autofill does not assign identifiers.

### Saving and success

1. Validate existing form fields and duplicate-item constraints. Keep existing AI verification blockers and saving-state protections.
2. Submit to the authorized creation service using a stable creation-operation key. Allocate the next shared public product number and final SKU/token on the server.
3. Commit the product, public-ID counter and identity/QR mappings atomically. Return a typed result containing the saved public product ID, SKU and the destination needed for View item; adapt the current `onSave` callbacks, which return no saved record, accordingly.
4. Close and reset the create form only after confirmed persistence succeeds, matching the existing dialog behavior. Show a success notification with a View item action opening the saved inventory/prebuilt item.
5. The saved item's details show the actual product ID and SKU with copy buttons, QR preview and Download QR. Do not automatically download a file or introduce a second mandatory dialog.

For example, saving a CPU may create `PRD-000123` / `SKU-CPU7K4M2Q8X`, and saving a prebuilt afterward may create `PRD-000124` / `SKU-PC3N7K9M5W`. Concurrent staff activity determines the actual committed sequence.

### Editing and failure recovery

- Edit Part and Edit System display the actual public product ID and SKU as read-only values with copy buttons; the Firebase ID is not shown in this identification section.
- No Generate or Regenerate control is provided. Rename, category correction, pricing/specification edits and stock adjustments preserve public product ID, SKU and QR identity.
- On validation/persistence failure, retain form contents, show an actionable error and release the submitting state. Keep the existing guard against closing the dialog while saving.
- If persistence succeeds but the response is lost, retrying the same unchanged operation returns the saved record and identifiers instead of creating another product or allocating another committed identity. The operation key is scoped to the authenticated actor and bound to the submitted payload so it cannot silently reuse an earlier result for a different product.
- If QR image rendering/download fails after persistence, retry that operation independently. The saved product remains valid; do not resubmit product creation or allocate new identifiers.

## Implementation phases

1. **Preflight the confirmed scope.** Verify actual catalog paths, duplicate-name handling, auth/session behavior and existing category-change support. Use the selected hosted origin and individual-download scope.
2. **Identity and QR services.** Add typed schemas, global sequential public-ID allocation, SKU generation, product-ID directory, QR registry, authorized creation and idempotent retries. Keep existing inventory stock semantics.
3. **Public catalog and auth behavior.** Make prebuilt browsing public; build parts listing/detail pages; add role-appropriate actions and safe sign-in return handling. Preserve protected admin/customer actions.
4. **Role-aware QR routing and admin links.** Implement `/q/[token]`, resolve guest/customer/staff destinations, and ensure staff deep links find the exact inventory/prebuilt record after initial authentication.
5. **QR previews and individual downloads.** Add immediate preview and single-PNG download using saved tokens and the configured hosted origin. Repeated downloads retain the same identity.
6. **Rehearse and apply additive migration.** Back up, dry-run, backfill missing public product ID/SKU/QR fields and mapping records, and reconcile before rollout. Coordinate product creation/edits and the shared counter with the final backfill.
7. **Verify and release.** Run required checks, test guest/customer/staff paths and existing commerce flows, verify migrated data and confirm downloaded QR scans.

## Existing-data migration

1. Verify the Firebase project/database, take a fresh recoverable backup, and record current per-category part and prebuilt counts.
2. Build a dry-run manifest with canonical path, existing internal ID, proposed public product ID/SKU/token and before-values. Audit public-ID/SKU collisions, cross-category internal-ID collisions, archived items and broken references. Use a deterministic manifest order for the initial sequence; preflight any already assigned public numbers.
3. Backfill only missing metadata; preserve internal IDs, existing assigned public IDs, stock, prices, images, specifications, prebuilt components, favorites and historical orders. Do not merge records or create physical inventory entries.
4. Allocate public numbers through the same atomic counter used by new product creation and create matching product-ID, uniqueness and QR registry documents in bounded, resumable atomic groups. Keep the counter at or above the highest assigned number. Reuse assigned identifiers on retries and report inconsistent existing mappings. Treat dry-run numbers as provisional until allocation commits.
5. Preserve all reservation quantities and statuses as-is. No stock deduction, restoration or allocation occurs during this migration.
6. Coordinate concurrent creates/edits by deploying metadata-aware creation first and checking document versions/preconditions during backfill. Resolve conflicts explicitly.
7. Reconcile source/destination counts, unchanged stock and references, unique public product IDs/SKUs, counter position and every QR target. A repeat dry-run must assign no replacement identifiers or duplicate registry records.
8. Roll back by disabling feature routes/flags while retaining additive metadata. Do not restore an old database snapshot over subsequent orders or inventory activity. Retain the backup and manifest; do not delete original records.

## Acceptance checks

- Run typecheck, lint and production build; use Playwright against port 9002 and emulator checks for new permissions and atomic creation.
- Existing duplicate-item protection and stock-count behavior remain intact. No unit/batch collections, stock-entry UI or serialized tracking are introduced.
- New parts use `SKU-<APPROVED CATEGORY CODE><8 random characters>`; prebuilts use `SKU-PC<8 random characters>`. Verify all thirteen approved codes, including accessories, and no hyphen after the category. Internal database IDs remain intact, and each product receives a separate sequential `PRD-000123` public ID.
- Concurrent creation cannot claim the same public product ID, SKU or token. Verify the counter across parts, accessories and prebuilts, migration retries and values beyond six digits. Repeated submission of the same create operation does not create another product or consume another committed identity.
- Opening/cancelling either create dialog allocates no PRD number or SKU. Both forms show the approved pending labels; changing part category updates only the SKU prefix preview. Unsaved products have no downloadable QR.
- Successful creation closes the form and exposes View item; the destination shows actual identifiers, copy buttons, QR preview and individual download. Edit fields cannot override identifiers and provide no regeneration control.
- A lost-response retry returns the same saved product. Form validation/save failures retain entered data, and QR rendering failures never trigger another product creation.
- Every newly saved product immediately has a valid QR; migrated parts and prebuilts have matching mappings. Rename, category correction, price changes and repeated downloads preserve public product ID, SKU and token.
- New public URLs, customer-facing product identifiers and QR response payloads use public product IDs rather than Firebase IDs or canonical paths. Verify legacy link compatibility separately and enforce permissions on internal mappings.
- Guests and signed-in customers reach the same matching product URL, with the appropriate actions. Guests can see price/specifications/description/availability but must sign in to reserve.
- Managers and super admins reach the exact matching admin item, including after refresh/sign-in. Pending auth does not cause incorrect role routing; forged role parameters do not grant access.
- Scanning, previews and repeat requests never modify stock. Guest/public APIs do not expose newly introduced private data.
- Out-of-stock, archived, missing and disabled targets have defined behavior. Product pages remain usable when no customer profile exists.
- Existing checkout, prebuilt reservation, cancellation, builder, favorites and AI catalog reads still work; migration changes no stock or order values.
- Each individual PNG decodes to `https://buildbotai--studio-3150054754-c7d0b.us-central1.hosted.app/q/<saved-token>` and downloads using the product SKU as its filename. The symbol scans from a screen and a manually printed sample, with a white four-module margin in either application theme.
- Bulk download, label sheets, printer setup and built-in printing actions are absent from the first-release UI.

## Implementation defaults

- Public parts use `/parts/[productId]`; prebuilts use `/pre-builts/[productId]`. Public identity is sequential `PRD-000123`; the existing random Firebase ID remains the internal database key.
- Download format is an individual PNG with a SKU-based filename. Additional output formats can be considered separately.
- The requirements interview is complete. The approved form workflow and QR/public catalog implementation are present in the workspace; rollout status is recorded below.

## Out of scope

Multiple entries of the same item, per-unit or delivery tracking, unit tags, inventory movement ledgers, assembled-PC allocation, stock model replacement, in-app camera scanning, scan-to-sell/returns, multi-branch transfers, warranty/RMA tracking, scan analytics, bulk QR export, A4 label sheets and built-in printer workflows are excluded from this feature plan.

## Implementation and verification results

- Add Part and Add System now assign immutable SKU, public product ID and QR identity on successful server saves. Pending previews allocate nothing; unchanged retries reuse the committed identity.
- Public parts/accessory and prebuilt pages, customer actions, staff item destinations, search/copy controls and individual QR PNG downloads are implemented.
- Production backfill completed for 324 parts and 56 prebuilts: 380 unique identities, no unassigned records and a counter value of 380. A read-only comparison against the original snapshot confirmed every pre-existing catalog field was unchanged, including stock, prices, component references and archive flags.
- Typecheck, lint and production build passed. The isolated demo-emulator suite passed 13 integration tests and five browser tests; the strengthened save-retry payload check also passed after its final adjustment.
- Read-only checks against the normal local app passed for the migrated parts catalog, part detail, active prebuilt detail, guest QR destinations and public prebuilt listing. Mobile part detail had no horizontal overflow or browser errors. Archived products remain unavailable publicly.
- Managed Firestore export retained at `gs://studio-3150054754-c7d0b-private-backups/backups/qr-inventory-2026-10-20-v1`. Public access prevention and uniform IAM access are enforced. All 316 export objects were checked by size/checksum after relocation; guest/customer access was denied. The temporary export in the public asset bucket was removed and its absence verified. It had been readable before removal; external access was not audited.
- Local audit snapshots and migration manifests are retained under ignored `.tmp/`. The ordinary development preview is restored on port 9002.
- Release verification on 2026-10-21 confirmed hosted commit `3676b1456485c6076428176661a11684b1cb8f8d` with a successful rollout. The deployed rules were still missing QR protections; after explicit user approval, the matching repository rules were deployed and their contents verified at 20:37 Asia/Manila. All 23 hosted role/destination and public-page checks passed again afterward. The migration dry-run found no pending identities and the before/after audit found no catalog-field changes.
- Automated PNG decoding was verified. A physical printed-label scan remains a manual release check.

## Technical references

- [Firestore best practices](https://firebase.google.com/docs/firestore/best-practices): use random technical database IDs.
- [Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions): commit related identity/product writes atomically and make retry behavior safe.
- [Firestore field access](https://firebase.google.com/docs/firestore/security/rules-fields): document reads cannot selectively hide private fields.
- [DENSO WAVE QR layout](https://www.qrcode.com/en/howto/code.html/index.html): standard QR symbols require a four-module margin.
