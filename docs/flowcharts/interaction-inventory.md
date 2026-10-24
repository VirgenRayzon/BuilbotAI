# Source interaction inventory and coverage

This inventory is the completeness crosswalk for checked-in UI. Counts refer to source instances, not the number of times a reusable component can be mounted. The diagrams were verified by static source inspection on 18 October 2026. Paths below are repository-relative. `O` denotes an overlay instance; menus and native browser confirmation are listed separately. A repeated confirmation component is mapped once per source instance.

## Page and HTTP routes

| Route | Source | Diagram |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | [Public navigation](public-navigation-flowchart.md) |
| `/about` | `src/app/about/page.tsx` | [Public navigation](public-navigation-flowchart.md) |
| `/team` | `src/app/team/page.tsx` | [Public navigation](public-navigation-flowchart.md) |
| `/contact` | `src/app/contact/page.tsx` | [Public navigation](public-navigation-flowchart.md) |
| `/faq` | `src/app/faq/page.tsx` | [Public navigation](public-navigation-flowchart.md) |
| `/signin` | `src/app/signin/page.tsx` | [Authentication](authentication-flowchart.md) |
| `/signup` | `src/app/signup/page.tsx` | [Authentication](authentication-flowchart.md) |
| `/forgot-password` | `src/app/forgot-password/page.tsx` | [Authentication](authentication-flowchart.md) |
| `/system-access` | `src/app/system-access/page.tsx` | [Authentication](authentication-flowchart.md) |
| `/system-access/signup` | `src/app/system-access/signup/page.tsx` | [Authentication](authentication-flowchart.md) |
| `/builder` | `src/app/builder/page.tsx`, `builder-page.tsx` | [Builder](builder-flowchart.md) |
| `/ai-build-advisor` | `src/app/ai-build-advisor/page.tsx` | [AI recommendations](ai-system/ai-recommendations-flowchart.md), [critique](ai-system/ai-build-critique-flowchart.md) |
| `/pre-builts` | `src/app/pre-builts/page.tsx` | [Prebuilts](prebuilts-flowchart.md) |
| `/pre-builts/[id]` | `src/app/pre-builts/[id]/page.tsx` | [Prebuilts](prebuilts-flowchart.md) |
| `/profile` | `src/app/profile/page.tsx` | [Profile](profile-flowchart.md) |
| `/admin` | `src/app/admin/page.tsx` | [Inventory](admin-inventory-flowchart.md), [operations](admin-operations-flowchart.md) |
| `/admin/prebuilt-builder` | `src/app/admin/prebuilt-builder/page.tsx` | [Manager](manager-flowchart.md), [AI prebuilt assist](ai-system/ai-prebuilt-assist-flowchart.md) |
| `POST /api/chat` | `src/app/api/chat/route.ts` | [AI chatbot](ai-system/ai-chatbot-flowchart.md) |
| `POST /api/ai/build-advisor/recommendations` | `src/app/api/ai/build-advisor/recommendations/route.ts` | [AI recommendations](ai-system/ai-recommendations-flowchart.md) |
| `POST /api/builder/download` | `src/app/api/builder/download/route.ts` | [Builder](builder-flowchart.md), [errors](error-handling-flowcharts.md) |

## Action and decision coverage

| User-facing action family | Implementation | Diagram |
| --- | --- | --- |
| Customer email/Google sign-in, registration, terms, reset | `src/app/signin/page.tsx`, `signup/page.tsx`, `forgot-password/page.tsx`, `src/firebase/auth/google-auth.tsx` | [Authentication](authentication-flowchart.md) |
| Staff key sign-in, registration and request | `src/app/system-access/`, `src/app/actions.ts` | [Authentication](authentication-flowchart.md) |
| Header links, drawer, profile menu, theme, sign-out | `src/components/header.tsx`, `header-mega-menu.tsx`, `theme-toggle.tsx` | [Public navigation](public-navigation-flowchart.md), [pop-ups](popup-decision-flowcharts.md) |
| Catalog search, filters, sort, view, pagination, details | `src/components/inventory-toolbar.tsx`, `part-card.tsx`, `src/app/builder/` | [Builder](builder-flowchart.md) |
| Add/remove, compatibility, clear, favorites, PDF | `src/app/builder/hooks/use-builder-logic.ts`, `src/components/your-build.tsx` | [Builder](builder-flowchart.md) |
| Custom and prebuilt reservation | `src/hooks/use-build-actions.ts`, `src/components/prebuilt-system-card.tsx`, `src/app/pre-builts/[id]/hooks/use-prebuilt-details.ts` | [Reservations](reservations-flowchart.md), [prebuilts](prebuilts-flowchart.md) |
| Customer profile, saved builds, notifications and activity | `src/app/profile/`, `src/components/user-notifications.tsx` | [Profile](profile-flowchart.md) |
| Admin part/prebuilt CRUD, stock, archive and bulk actions | `src/app/admin/hooks/`, `src/app/admin/components/`, `src/firebase/database.ts` | [Admin inventory](admin-inventory-flowchart.md) |
| Admin order status and archive | `src/app/admin/hooks/use-orders.ts`, `components/reservations-tab.tsx` | [Reservations](reservations-flowchart.md), [admin operations](admin-operations-flowchart.md) |
| Super Admin sales, keys, content and safeguards | `src/components/sales-analytics.tsx`, `super-admin-settings.tsx`, `about-management.tsx`, `src/app/profile/hooks/use-emergency-controls.ts` | [Admin operations](admin-operations-flowchart.md) |
| All AI entry points and settings | `src/ai/`, `src/app/actions.ts`, `src/app/api/`, AI UI components | [AI inventory](ai-system/ai-interaction-inventory.md) |

### Control-to-outcome crosswalk

These rows split the action families into the user-visible choices that change a route, local state, or stored data. The linked diagram shows success, cancellation, and handled failure branches; display-only controls with the same state transition (for example, each filter option) are grouped.

| Surface and control | Observed result | Source | Diagram |
| --- | --- | --- | --- |
| Header desktop links, mobile drawer links, profile menu | Navigate to public or role-available pages; drawer closes after selection | `src/components/header.tsx`, `header-mega-menu.tsx` | [Public navigation](public-navigation-flowchart.md) |
| Theme toggle; sign-out confirmation | Change theme; confirm signs out, cancel keeps session | `src/components/theme-toggle.tsx`, `header.tsx` | [Public navigation](public-navigation-flowchart.md), [pop-ups](popup-decision-flowcharts.md) |
| Landing page feature and prebuilt calls to action | Open builder, advisor, prebuilt detail, or auth path as rendered | `src/app/page.tsx`, `src/components/prebuilt-system-card.tsx` | [Public navigation](public-navigation-flowchart.md), [prebuilts](prebuilts-flowchart.md) |
| About section links and image preview; FAQ search and disclosure | Change anchor or preview; filter and expand local question data | `src/app/about/page.tsx`, `faq/page.tsx` | [Public navigation](public-navigation-flowchart.md), [pop-ups](popup-decision-flowcharts.md) |
| Contact form submit | Validate fields, then show local timed success; no delivery integration found | `src/app/contact/page.tsx` | [Public navigation](public-navigation-flowchart.md) |
| Customer email/Google sign-in and remember choice | Authenticate, reject staff profile, set persistence and navigate or show error | `src/app/signin/page.tsx`, `src/firebase/auth/google-auth.tsx` | [Authentication](authentication-flowchart.md) |
| Customer sign-up, terms acknowledgment, password reset | Validate, create profile or request reset; terms modal gates registration | `src/app/signup/page.tsx`, `forgot-password/page.tsx`, `src/components/auth/terms-of-agreement-modal.tsx` | [Authentication](authentication-flowchart.md), [pop-ups](popup-decision-flowcharts.md) |
| Staff role tab, email/Google key verification and manager registration | Verify role/key via server action; establish or reject staff session | `src/app/system-access/page.tsx`, `signup/page.tsx`, `src/app/actions.ts` | [Authentication](authentication-flowchart.md) |
| Access-key request and idle-session choice | Record valid request; reset idle timer or sign out | `src/app/system-access/components/request-key-modal.tsx`, `src/components/auth/session-timeout.tsx` | [Authentication](authentication-flowchart.md), [pop-ups](popup-decision-flowcharts.md) |
| Builder search, category/brand/availability, sort, view and page | Change displayed catalog without changing saved build | `src/components/inventory-toolbar.tsx`, `src/app/builder/hooks/use-inventory-query.ts` | [Builder](builder-flowchart.md) |
| Part card details, gallery and add/remove | Open previews or update selection after stock/compatibility check | `src/components/part-details-content.tsx`, `src/app/builder/hooks/use-builder-logic.ts` | [Builder](builder-flowchart.md), [pop-ups](popup-decision-flowcharts.md) |
| Build panel, mobile sheet, clear and favorite | Review totals; clear after confirmation; name and write favorite | `src/components/your-build.tsx`, `src/components/build/build-action-footer.tsx` | [Builder](builder-flowchart.md), [pop-ups](popup-decision-flowcharts.md) |
| Build reserve, analyze and PDF | Confirm stock-backed order; open critique; download authenticated PDF or show failure | `src/hooks/use-build-actions.ts`, `src/app/api/builder/download/route.ts` | [Builder](builder-flowchart.md), [reservations](reservations-flowchart.md) |
| Prebuilt listing search/filter/sort and card actions | Filter catalog, open detail, customize build, or confirm reservation | `src/app/pre-builts/page.tsx`, `src/components/prebuilt-system-card.tsx` | [Prebuilts](prebuilts-flowchart.md) |
| Prebuilt detail gallery, reserve, customize and report | Preview image; direct reserve; load build; staff can generate AI report | `src/app/pre-builts/[id]/components/`, `hooks/use-prebuilt-details.ts` | [Prebuilts](prebuilts-flowchart.md), [AI report](ai-system/ai-prebuilt-performance-flowchart.md) |
| Profile tabs, editable fields and saved builds | Switch profile content, update allowed fields, load or delete favorites | `src/app/profile/page.tsx`, `components/favorites-list.tsx` | [Profile](profile-flowchart.md) |
| Customer reservation cancellation modal | Keep reservation or navigate to Contact Staff; no direct status mutation from modal | `src/app/profile/page.tsx`, `components/reservations-list.tsx` | [Profile](profile-flowchart.md), [reservations](reservations-flowchart.md) |
| Customer notification list and order detail | Filter, mark read, delete, inspect linked order | `src/components/user-notifications.tsx`, `order-details-modal.tsx` | [Profile](profile-flowchart.md) |
| Staff notification and audit controls | Filter, mark read, inspect detail or open audit record | `src/components/notification-center.tsx`, `src/app/profile/components/audit-logs-section.tsx` | [Admin operations](admin-operations-flowchart.md), [pop-ups](popup-decision-flowcharts.md) |
| Admin stock and prebuilt table/card controls | Filter, page, add/edit, change stock, archive/restore; Super Admin delete | `src/app/admin/components/stock-tab.tsx`, `prebuilt-tab.tsx`, `src/components/inventory-table.tsx`, `prebuilts-table.tsx` | [Admin inventory](admin-inventory-flowchart.md) |
| Admin selection and bulk confirmation | Apply supported archive/restore/delete action to selected rows, or cancel | `src/app/admin/page.tsx`, `hooks/use-bulk-actions.ts` | [Admin inventory](admin-inventory-flowchart.md), [pop-ups](popup-decision-flowcharts.md) |
| Admin reservation status and archive controls | Validate status transition and write; archive/restore/delete via separate confirmation | `src/app/admin/components/reservations-tab.tsx`, `hooks/use-orders.ts` | [Reservations](reservations-flowchart.md), [admin operations](admin-operations-flowchart.md) |
| Super Admin sales, key, account, content and safeguard controls | Export/reset/sample sales; manage keys/accounts; save site content or settings | `src/app/admin/components/`, `src/components/super-admin-settings.tsx`, `about-management.tsx`, `src/app/profile/hooks/use-emergency-controls.ts` | [Super Admin](super-admin-flowchart.md), [admin operations](admin-operations-flowchart.md) |
| AI controls: prompt, send, retry, regenerate, save, cancel, model and prompt settings | Distinct per-feature AI path and failure outcome | `src/components/chat/`, `src/components/chat-form.tsx`, `src/app/ai-build-advisor/hooks/`, `src/components/ai-model-settings.tsx`, `ai-system-prompts-settings.tsx` | [AI inventory](ai-system/ai-interaction-inventory.md) |

## Overlay inventory

The 50 source-level overlays below map to [pop-up decisions](popup-decision-flowcharts.md) and their parent workflow. A source line is the opening JSX tag. `Unmounted` means no page import chain was found.

| ID | Source instance | Trigger, choices and result | Diagram |
| --- | --- | --- | --- |
| O01 | `src/components/add-prebuilt-dialog.tsx:181` | Component selector: search, select, clear or close; updates form slot | [Admin inventory](admin-inventory-flowchart.md) |
| O02 | `src/components/add-prebuilt-dialog.tsx:760` | Prebuilt editor: AI assist, edit, save or close; validation/write feedback | [Admin inventory](admin-inventory-flowchart.md) |
| O03 | `src/components/add-part-editor.tsx:126` | Part editor: autofill, edit, save or close | [Admin inventory](admin-inventory-flowchart.md) |
| O04 | `src/components/add-stock-dialog.tsx:74` | Add/reduce mode, quantity presets, confirm or cancel | [Admin inventory](admin-inventory-flowchart.md) |
| O05 | `src/components/ai-system-prompts-settings.tsx:365` | Reset current/all prompt, confirm or cancel | [AI settings](ai-system/ai-settings-flowchart.md) |
| O06 | `src/components/ai-model-settings.tsx:1066` | Delete local project, confirm or cancel | [AI settings](ai-system/ai-settings-flowchart.md) |
| O07 | `src/app/about/page.tsx:140` | About image preview, close | [Public navigation](public-navigation-flowchart.md) |
| O08 | `src/app/admin/page.tsx:404` | Bulk archive/restore/delete, confirm or cancel | [Admin inventory](admin-inventory-flowchart.md) |
| O09 | `src/components/auth/terms-of-agreement-modal.tsx:50` | Check acknowledgment, Accept & Continue, Review Later or close | [Authentication](authentication-flowchart.md), [pop-ups](popup-decision-flowcharts.md) |
| O10 | `src/components/auth/session-timeout.tsx:42` | Stay logged in, logout, or expire | [Authentication](authentication-flowchart.md) |
| O11 | `src/app/admin/components/reservations-tab.tsx:1155` | Archive/restore/delete reservation, confirm or cancel | [Admin operations](admin-operations-flowchart.md) |
| O12 | `src/app/admin/components/admin-tab-header.tsx:235` | Ingest sample sales data, confirm or cancel | [Admin operations](admin-operations-flowchart.md) |
| O13 | `src/app/admin/components/admin-tab-header.tsx:295` | Reset sales, confirm or cancel | [Admin operations](admin-operations-flowchart.md) |
| O14 | `src/components/build/build-action-footer.tsx:115` | Name prebuilt, generate or cancel | [AI prebuilt assist](ai-system/ai-prebuilt-assist-flowchart.md) |
| O15 | `src/components/build/build-action-footer.tsx:166` | Review custom build, reserve or cancel | [Reservations](reservations-flowchart.md) |
| O16 | `src/components/header-mega-menu.tsx:86` | Guest/auth mobile navigation drawer, choose link or close | [Public navigation](public-navigation-flowchart.md) |
| O17 | `src/components/component-card.tsx:158` | Expand AI rationale, close | [AI recommendations](ai-system/ai-recommendations-flowchart.md) |
| O18 | `src/components/bottleneck/prototype-slide-drawer.tsx:80` | Prototype analysis drawer; unmounted | [Unresolved](#unverified-and-unresolved) |
| O19 | `src/app/profile/page.tsx:394` | Keep reservation or navigate to Contact Staff | [Profile](profile-flowchart.md) |
| O20 | `src/components/inventory-part-card.tsx:117` | Archive/restore part, confirm or cancel | [Admin inventory](admin-inventory-flowchart.md) |
| O21 | `src/components/inventory-part-card.tsx:136` | Delete part, confirm or cancel | [Admin inventory](admin-inventory-flowchart.md) |
| O22 | `src/app/system-access/signup/page.tsx:475` | Google manager key, verify or cancel/sign out | [Authentication](authentication-flowchart.md) |
| O23 | `src/components/inventory-prebuilt-card.tsx:167` | Archive/restore prebuilt, confirm or cancel | [Admin inventory](admin-inventory-flowchart.md) |
| O24 | `src/components/inventory-prebuilt-card.tsx:215` | Delete prebuilt, confirm or cancel | [Admin inventory](admin-inventory-flowchart.md) |
| O25 | `src/components/inventory-table.tsx:154` | Archive/restore part, confirm or cancel | [Admin inventory](admin-inventory-flowchart.md) |
| O26 | `src/components/inventory-table.tsx:192` | Delete part, confirm or cancel | [Admin inventory](admin-inventory-flowchart.md) |
| O27 | `src/app/system-access/page.tsx:600` | Google staff role key, verify or cancel/sign out | [Authentication](authentication-flowchart.md) |
| O28 | `src/components/header.tsx:445` | Signed-in mobile navigation drawer, choose link or close | [Public navigation](public-navigation-flowchart.md) |
| O29 | `src/components/header.tsx:624` | Sign out, confirm or cancel | [Authentication](authentication-flowchart.md) |
| O30 | `src/app/profile/components/audit-logs-section.tsx:281` | Audit filter/details popover, choose or close | [Admin operations](admin-operations-flowchart.md) |
| O31 | `src/app/system-access/components/request-key-modal.tsx:35` | Submit key request or cancel | [Authentication](authentication-flowchart.md) |
| O32 | `src/app/profile/components/favorites-list.tsx:326` | Delete favorite, confirm or cancel | [Profile](profile-flowchart.md) |
| O33 | `src/components/notification-center.tsx:218` | Staff notifications: filter, mark read, inspect or audit | [Profile](profile-flowchart.md) |
| O34 | `src/components/notification-center.tsx:459` | Staff notification detail, close or open audit | [Profile](profile-flowchart.md) |
| O35 | `src/components/order-details-modal.tsx:77` | Customer order detail, close or view reservations | [Profile](profile-flowchart.md) |
| O36 | `src/app/profile/components/profile-hero.tsx:247` | Profile sign out, confirm or cancel | [Authentication](authentication-flowchart.md) |
| O37 | `src/app/profile/components/profile-sidebar.tsx:323` | Sidebar sign out, confirm or cancel | [Authentication](authentication-flowchart.md) |
| O38 | `src/components/part-details-content.tsx:124` | Part details, add/remove, preview or close | [Builder](builder-flowchart.md) |
| O39 | `src/components/part-details-content.tsx:625` | Full-size part image, next/previous/close | [Builder](builder-flowchart.md) |
| O40 | `src/app/pre-builts/[id]/components/prebuilt-image-view.tsx:177` | Prebuilt image preview, next/previous/close | [Prebuilts](prebuilts-flowchart.md) |
| O41 | `src/components/prebuilt-builder-add-dialog.tsx:92` | Prebuilt editor, AI assist, save or cancel; unmounted | [Unresolved](#unverified-and-unresolved) |
| O42 | `src/components/prebuilt-system-card.tsx:477` | Listing/card prebuilt reservation, confirm or cancel | [Prebuilts](prebuilts-flowchart.md) |
| O43 | `src/components/prebuilts-table.tsx:340` | Archive/restore prebuilt, confirm or cancel | [Admin inventory](admin-inventory-flowchart.md) |
| O44 | `src/components/prebuilts-table.tsx:380` | Delete prebuilt, confirm or cancel | [Admin inventory](admin-inventory-flowchart.md) |
| O45 | `src/components/prebuilt-builder/part-selector.tsx:56` | Part selection popover; parent editor unmounted | [Unresolved](#unverified-and-unresolved) |
| O46 | `src/components/your-build.tsx:349` | Mobile build sheet, review actions or close | [Builder](builder-flowchart.md) |
| O47 | `src/components/your-build.tsx:421` | Name/save favorite or cancel | [Builder](builder-flowchart.md) |
| O48 | `src/components/your-build.tsx:505` | Clear build or cancel | [Builder](builder-flowchart.md) |
| O49 | `src/components/user-notifications.tsx:188` | Customer notifications: filter, read, delete, order detail | [Profile](profile-flowchart.md) |
| O50 | `src/app/profile/components/user-audit-logs-section.tsx:255` | User activity filter/details popover, choose or close | [Profile](profile-flowchart.md) |

Other interactive overlays: ten `Menu` instances provide category, brand, availability, sort, build-action, and profile choices in `src/app/admin/components/stock-tab.tsx`, `prebuilt-tab.tsx`, `src/components/inventory-toolbar.tsx`, `your-build.tsx`, and `header.tsx`. `window.confirm` in `src/app/profile/hooks/use-emergency-controls.ts` is a native confirmation for safeguard switches. Select dropdowns, tabs, toasts, inline alerts and the custom AI progress display are mapped by their parent feature diagrams. An AI progress display is a custom overlay component rather than one of the 50 JSX dialog primitives (`src/components/ai-progress-modal.tsx`).

## Unverified and unresolved

| Item | What source proves and what remains unknown |
| --- | --- |
| Runtime service state | Static inspection does not establish Firebase data, deployed rules, indexes, credentials, model availability or hosted navigation behavior. |
| Unmounted components | `SmartBudget`, `PrebuiltBuilderAddDialog`, and `BottleneckPrototypeController` have implementations but no page import chain found. Their flows are documented as code-present only. |
| Customer cancellation | The profile's visible cancellation modal routes to Contact Staff. A token-verified cancellation hook exists but is not wired to this modal. Whether staff processes the contact request is outside this source. |
| Contact delivery | The form shows local success after a timer and has no submission integration. |
| AI cancellation | Client abort/ignore behavior is visible, but remote request termination cannot be proven. |
| Authorization differences | UI guards, Firestore rules and Admin SDK action checks are separate. Reservation creation actions accept caller identity parameters without token verification; status changes verify a token and staff/customer permissions. |
| Price conversion | General helper uses USD × 60; part extraction prompts use USD × 56. Live catalog price provenance is unknown. |

No application code or Firebase data was modified for this documentation set.
