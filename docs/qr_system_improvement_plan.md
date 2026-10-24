# QR system improvements — draft roadmap

Date: 2026-10-21 (Asia/Manila). Status: Phase 0/1 verified and builds cleanly. Phase 2 (audited lifecycle management, in-app staff scanner with manual fallback, and part-to-builder compatibility analysis) implemented with tests passing. Phase 3 proposals remain for future consideration.


## Recommendation

Finish the existing release, then improve recovery and staff visibility before adding more scanning workflows. The recommended first increment is better error recovery, reliable QR preview/download state, a read-only QR health report, and explicit public-preview controls for staff.

Preserve the current model: one catalog record with a stock count, immutable public product ID/SKU/token, and no stock changes from scanning. Additional features below are proposals, not changes to the approved scope in `directives/qr_inventory.md`.

## Confirmed UI constraint

Preserve the existing UI as much as possible when implementing new features. Any necessary additions must fit the current aesthetic. This applies to every phase of this roadmap.

- Keep existing page layouts, navigation, card arrangements and working interactions. Prefer behavioral fixes that need no visual changes; avoid unrelated redesigns or restyling.
- Reuse the surrounding components and established button variants, icons, typography, colors, spacing, borders, radii and light/dark styling. Match the actual screen where the feature appears, not a new design direction.
- Place new actions within existing action groups or menus where practical. Use the existing dialog/drawer patterns for scanner and health-report details; choose the smallest addition that remains clear and accessible.
- Keep secondary tools unobtrusive without hiding essential recovery actions. Preserve responsive behavior and accessible touch targets rather than squeezing extra controls into crowded rows.
- Compare affected screens before and after implementation on mobile and desktop, in light and dark modes. Acceptance requires familiar layouts and additions that look native to the existing interface.

## Current baseline and evidence

- Implemented: atomic product identities, role-aware QR resolution, public part/prebuilt pages, authenticated reservations, exact staff item destinations, individual PNG downloads, and emulator/browser coverage.
- The existing plan records 380 migrated identities and successful local checks. It also records the hosted application/rules release and a physical printed scan as pending. These are documented historical results; this review did not re-audit production or verify current deployment status.
- `src/app/q/[token]/page.tsx` currently combines failures into a “QR unavailable” screen with a catalog link. It has no explicit retry or sign-in recovery action.
- `src/app/api/qr/[token]/route.ts` handles disabled links, invalid credentials and archived products, but explicitly sets private/no-store headers only on its successful response. Database failures have no route-specific structured recovery response.
- `src/components/product-qr.tsx` already supports PNG rendering retries and four-module margins. It retains the previous image while a new token renders; clear that image when the token changes or disappears so an old QR cannot be downloaded for a newly selected item.
- QR mappings already have an `enabled` field. A corresponding staff lifecycle workflow was not found in the reviewed QR code paths.
- Reuse `execution/verify_product_identities.ts`, `execution/verify_qr_feature.mjs`, and the existing QR integration/browser suites rather than introducing duplicate audit tooling.

## Prioritized recommendations

Effort estimates are rough engineering days for one developer, including focused tests; they are not delivery commitments and exclude deployment access delays and product decisions.

| Priority | Improvement | User benefit | Estimated effort |
| --- | --- | --- | --- |
| P0 | Complete release verification | Distributed QR images resolve on the intended hosted address | 1–2 days after environment readiness |
| P1 | Recovery for network errors, expired login and unavailable products | Users can recover without rescanning or guessing | 2–3 days |
| P1 | QR preview/download state and copy/open actions | Staff reliably download the selected product and verify its destination | 1–2 days |
| P1 | Read-only QR health report | Staff can identify missing identities and broken mappings before customers do | 2–4 days |
| P2 | Audited enable/disable management | Authorized staff can suspend a problem QR without changing product identity | 2–3 days |
| P2 | In-app scanner with manual lookup fallback | Faster repeated staff lookups using a phone or desktop scanner | 4–6 days |
| P2 | Product-to-builder compatibility action | Customers can evaluate a scanned part against their selected build | 3–5 days |
| P3 | Aggregate QR usage and conversion reporting | Shows which product codes lead to useful customer activity | 3–5 days |
| P3 | Back-in-stock subscriptions | Interested customers have a next action when a scanned product is unavailable | 3–5 days plus notification setup |

### Phase 0 — verify and complete the existing release

1. Confirm actual hosted source/rules versions before assuming deployment remains pending.
2. Re-run the existing read-only identity audit and migration dry-run at cutover; reconcile products created by legacy clients. Follow the existing private-backup requirements if another metadata apply is needed.
3. Coordinate the application and rules rollout so old clients are not left using creation paths denied by the new rules.
4. Check the real hosted QR origin for a part, accessory, prebuilt, archived item and unknown token using guest, customer and staff sessions.
5. Scan a physically printed sample on representative Android and iPhone devices. Preserve the required four-module clear margin. [DENSO WAVE layout guidance](https://www.qrcode.com/en/howto/code.html).

Acceptance: every active sampled code resolves to the correct item; staff authorization is preserved; scans leave stock unchanged; existing printed URLs remain supported. Do not distribute additional labels until the hosted resolver is verified.

### Phase 1 — reliability and staff visibility

**Recovery and rendering**

- Return typed error codes for invalid/unavailable QR, expired authentication, temporary service failure and throttling. Keep public messages safe and provide Retry, Sign in again, or Browse products as appropriate.
- Add request timeouts and a fresh attempt that clears old errors. Preserve the intended QR path through staff authentication; do not silently route expired staff sessions as guests.
- Set explicit no-store behavior for all resolver outcomes. Keep role destinations uncached across users and validate destinations against the existing internal route formats.
- Clear old QR images immediately on token changes, disable download during generation, and ensure slow rendering cannot overwrite the currently selected product.
- Add Copy QR link and Open public product page beside Download QR. The public-preview action must use the public product URL because opening the resolver as staff intentionally routes to admin.
- Retain individual PNG output and the existing immutable identity rules.

**Read-only health report**

- Show missing metadata, malformed identities, duplicate identities, broken product/SKU/QR mappings, missing targets and the last completed audit time.
- Distinguish intentionally disabled codes and archived products from broken mappings. Display audit failures separately from healthy results.
- Extend the deterministic audit to produce structured results, then expose a staff-only summary with links to the affected items. Load it on demand or through a bounded job, not a full catalog scan per dashboard render.
- Provide diagnostics first; do not auto-repair, regenerate tokens, renumber products or modify stock.

Acceptance: network recovery succeeds without page reload; an expired session resumes the same item after sign-in; switching products cannot download the previous code; the audit detects seeded mapping defects and performs zero catalog writes.

### Phase 2 — operational controls and faster scanning

**Lifecycle management**

- Add enable/disable actions with a reason and an impact preview explaining that all copies of that product QR are affected.
- Use a verified server operation and an atomic audit record containing actor, timestamp, product ID, reason and before/after state. Repeated submissions must be safe.
- Default proposal: managers inspect status; super admins change it. Confirm the role policy before implementation.
- Re-enabling restores the same code. Disabled codes show a neutral public unavailable message; authorized staff can find the item through admin lookup.
- Keep token regeneration out of routine operations. A shared product QR can be copied and is neither proof of ownership nor proof of product authenticity.

**In-app scanner — optional scope expansion**

- Start with a staff Scan item entry point and a focused scanner dialog; provide camera switching, clear success feedback, duplicate-frame suppression and stop-camera behavior on close/navigation.
- Offer manual PRD/SKU lookup and keyboard-input scanner support. Image-file decoding can follow after the camera workflow is validated.
- Accept only recognized BuildbotAI origins and supported QR paths; reject arbitrary scanned URLs rather than navigating to them automatically. Resolve roles through the existing server path.
- Feature-detect native barcode support and supply a tested decoder fallback. Native Barcode Detection has limited browser availability; camera access requires a secure context and permission. [MDN Barcode Detection](https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API), [MDN camera access](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).
- Keep offline behavior limited to a clear connection message and manual recovery; do not queue stock edits or reservations offline.

Acceptance: supported mobile devices can scan real labels; denied permissions and unsupported cameras retain usable lookup; repeated detections navigate once; malformed/external codes cannot redirect users outside the approved routes.

### Phase 3 — customer value and measurement

- Add “Check with my build” for scanned parts. Reuse the existing compatibility engine, show the selected build context, and require an explicit action before changing it. Keep compatibility logic in hooks/services and preserve existing prebuilt customization.
- Consider “Notify me when available” for out-of-stock items after choosing a delivery channel, subscription/unsubscribe behavior and duplicate-notification policy. A subscription must not reserve stock.
- Measure successful resolver opens, unavailable results, rendering failures, latency and completed reservations attributed to QR visits. Label these as resolver activity rather than unique physical scans: repeated opens, shared links and bots can inflate totals.
- Separate staff activity and automated checks from customer conversion reporting. Record minimal data, define retention before launch, and avoid collecting camera images or precise location. Analytics failure must never block product navigation.
- Add structured server failure logs and bounded abuse protection after measuring traffic; choose limits that accommodate store Wi-Fi where many customers share an address.

Acceptance: compatibility results match existing engine checks; reporting definitions and denominators are explicit; customer navigation works when telemetry fails; no stock change occurs without an existing authorized commerce action.

## Boundaries and later decisions

- Keep bulk export, label sheets, printer setup, per-unit inventory, serial-number tracking, scan-to-sell, returns, warranty/RMA and branch transfers deferred. These require separate workflow and data-model decisions; they are not necessary for a better product QR experience.
- A shorter branded QR domain can be considered before a large label rollout. It requires ownership, hosting and ongoing redirect support. Existing printed codes cannot be changed by updating configuration, so preserve their original host and paths.
- Before adding supplier costs, internal notes or warranty records, place private information in separately protected documents. Firestore reads operate at document level; hiding a field in the UI does not protect it. [Firebase field-access guidance](https://firebase.google.com/docs/firestore/security/rules-fields).
- Continue using Mantine, light/dark themes, mobile-first layouts, 44px touch targets and the repository's compact modal/card conventions. Keep components under 300 lines and route scanner state and mutations through hooks/services.

## Implementation and verification plan

1. Deliver Phase 1 as small reviewable changes: resolver recovery, QR display/actions, then structured audit/reporting. Each change must preserve the current QR identity and stock behavior.
2. Extend existing emulator tests for disabled/re-enabled links, revoked or mismatched roles, archived/missing targets, mapping corruption, server failures and no-store headers across outcomes.
3. Extend browser tests for retries, interrupted authentication, old-image prevention, public preview, mobile accessibility and scanner fallbacks when enabled. Use port 9002 and the isolated demo project.
4. Run `npm run typecheck` and `npm run lint` after implementation edits; finish both before `npm run build`. Run `npm run test:qr` with Java 21+ and port 9002 available. Perform physical-device camera/printed-label checks separately.
5. Pilot with a small set of active parts, accessories and prebuilts. Record baseline resolver success and latency before choosing numerical service targets; treat incorrect destinations, unauthorized access and scan-induced stock changes as release blockers.
6. Release optional scanner, analytics and lifecycle controls independently. Rollback must preserve identities, QR mappings and the existing resolver; never restore an old inventory snapshot over subsequent commerce activity.

## Phase 0/1 implementation record

- Verified the original hosted QR release at commit `3676b1456485c6076428176661a11684b1cb8f8d`. Detected and corrected the missing QR rules rollout after the user explicitly approved production deployment. Deployed rules match the repository; no additional data migration was needed.
- Production diagnostics: 324 parts plus 56 prebuilts, 380 assigned identities, zero unassigned records, 51 archived products, zero disabled links and zero mapping/identity issues. Before/after hashes confirm all original catalog fields unchanged.
- All 23 hosted checks passed before and after rules deployment: guest/customer/manager/super-admin destinations for a part, accessory, prebuilt, archived item and unknown QR, plus three public product pages.
- Implemented typed QR errors, uniform no-store headers, 15-second recovery timeout, strict destination validation, stale-role rejection and sign-in return to the original QR.
- Implemented image state tied to the current product and rendering attempt, an accessible disabled download state, rendering retries and Copy QR link. Retained the existing public-preview action in its original location.
- Added an on-demand QR health dialog within the existing admin stock/prebuilt header. It uses the same theme and modal conventions, performs no writes, distinguishes disabled/archived status from defects and retains the last completed result if a refresh fails. Reports use a bounded consistent snapshot and can be reused for one minute after fresh staff authorization.
- Extended the existing audit CLI with `--report=<path>`. The browser runner clears only its validated isolated fetch cache so fresh emulator fixtures cannot reuse stale catalog data.
- The Phase 1 application changes have not been committed, pushed or deployed. Production rules deployment applies to the already-hosted original QR release. The two pre-existing image-view edits in the workspace were preserved.
- Physical printed-label scans on Android and iPhone remain outstanding; emulator and PNG decoding checks do not replace that step.

## Phase 2 implementation record

- Implemented audited QR lifecycle management:
  - Super-admin role authorization strictly enforced on `POST /api/admin/qr-status/[token]`, with manager read-only inspection on `GET`.
  - Immutable audit trails recorded in top-level `qrAudits` collection with actor ID, email, action, timestamp, reason, and before/after states; status and timestamp updated on `qrLinks/{token}`.
  - Reason validation enforces at least 3 characters when disabling a QR code.
  - UI control integrated into `AdminProductFocus` via `ProductQR` and `AdminQRLifecycleModal`, including impact preview, audit history, and disabled QR indicator.
- Implemented in-app staff scanner and manual fallback:
  - Added "Scan item" entry point in `AdminTabHeader` for stock and prebuilts tabs.
  - `QRScannerDialog` and `useQRScanner` provide responsive camera feed with viewfinder overlay and camera flip toggle.
  - Hybrid decoding pipeline uses native `BarcodeDetector` when available with `jsQR` canvas fallback.
  - Immediate single-navigation suppression on detection, resolving via `/api/qr/[token]` or product query params.
  - Manual lookup tab accepts `PRD-000123`, `SKU-...`, or QR URLs, fully supporting keyboard wedge barcode/QR scanner guns.
- Implemented product-to-builder compatibility analysis:
  - Added "Check with my build" action on public part pages (`/parts/[productId]`).
  - Evaluates component compatibility against active `pc_builder_state` in `localStorage` via `checkCompatibility()`.
  - Displays `PartBuilderCompatibilityModal` with socket, memory, wattage, and clearance checks.
  - Provides "Add to build & open PC Builder" button staging the part and navigating to `/builder`.
- Automated checks:
  - `tests/qr-phase2.test.ts` unit tests passing 3/3 suites (decoder parsing, lifecycle schema validation, and socket compatibility).
  - `npm run typecheck` passes with zero errors.
  - `npm run lint` passes with zero warnings or errors.
  - `npm run build` generates production bundle successfully.

