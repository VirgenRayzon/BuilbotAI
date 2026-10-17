# UI page, popup, and modal audit

This is a source-code audit of the 17 `src/app/**/page.tsx` routes and the overlays reachable from their rendered components, inspected on 17 October 2026. “Visible” means the element is rendered when its route, role, viewport, data, and loading conditions allow it; this is not a screenshot or a claim that every element appears simultaneously. Repeated cards, icons, decorative backgrounds, and loading skeletons are described by function rather than enumerated per instance. Actual labels and data can vary with Firestore content.

## Shared interface

`src/app/layout.tsx` and `src/components/app-layout.tsx` provide the app-wide header, optional footer, theme, notifications, loading state, and session handling. Public/onboarding routes use `HeaderMegaMenu`: logo, navigation links, sign-in entry, and mobile navigation drawer. Signed-in customers see Builder, Build Advisor, and Pre-builts links; staff see Dashboard and Prebuilt Builder. The signed-in header also has a role/account menu, profile/settings links, sign out, a theme toggle, and either customer notifications or the staff notification center (`src/components/header.tsx`). The footer, where enabled, links to FAQ, About, Group, and Contact; its “Privacy Policy” and “Terms of Service” links currently route to FAQ (`src/components/footer.tsx`). Loading, missing-profile, and maintenance screens can replace page content (`src/components/app-layout.tsx`).

## Page-by-page visible elements and purpose

### `/` — public landing page

The hero shows a product image, headline, descriptive copy, hardware-preview cards, and “Launch Builder” and “AI Advisor” buttons; both buttons currently lead to sign-in for guests. Its feature section illustrates bottleneck analysis, build critique, and generated builds. A deferred prebuilt showcase displays available systems from Firestore when data loads, while the accessories section introduces peripheral categories. The final call-to-action links to sign-in. The hardware examples and performance numbers inside the hero/feature artwork are promotional illustrations, not a live analysis of a visitor’s build (`src/components/landing/landing-page.tsx`, `hero-section.tsx`, `features-section.tsx`, `prebuilt-showcase.tsx`, `accessories-section.tsx`, `cta-section.tsx`). Signed-in users are redirected to the customer builder or staff dashboard.

### `/about` — public About page

The heading and introduction explain the project. A section-navigation list jumps to content sections; each section shows a title, Markdown-formatted text, optional subtopics, and optional images. Image controls open a larger preview. A builder link leads into the customer flow. Content is read from `siteContent/about` when available, otherwise from the page’s default content (`src/app/about/page.tsx`).

### `/team` — public team page

The page displays the shared `TeamSection` presentation: section heading, team-member photos, role badges, names, descriptions, and social-media icons. Those icons are rendered as icons without links in the inspected component. It has no page-specific form or data mutation (`src/app/team/page.tsx`, `src/components/landing/team-section.tsx`).

### `/contact` — public contact page

Contact cards display an email address, phone number, and location/hours information. The message form contains full name, email, subject, and message controls plus a send button. An inline success alert and “send another” path appear after submission. The submit handler only waits briefly and changes local UI state; it does not send email, save a ticket, or call an API (`src/app/contact/page.tsx`).

### `/faq` — public FAQ page

The page has an introduction, a search box that filters question text and answers, category headings, expandable question/answer accordions, an empty-search state, and a contact link. Answers are static content in the page source; they are not a live policy or shipment-status lookup (`src/app/faq/page.tsx`).

### `/signin` — customer sign-in

The page shows logo, heading, back navigation, Google sign-in button, email and password fields, password-reset link, “remember me” checkbox, submit button, and sign-up link. Inline validation/authentication and session-expiry messages explain errors or redirects. Staff accounts are rejected from this customer flow and directed to System Access (`src/app/signin/page.tsx`).

### `/signup` — customer registration

The page presents a terms-of-agreement dialog, then logo, Google registration, email and password fields, password-strength feedback, a terms checkbox/link, registration button, and sign-in link. Validation and registration errors appear inline. It creates the Firebase Auth account and Firestore customer profile when successful (`src/app/signup/page.tsx`, `src/components/auth/terms-of-agreement-modal.tsx`).

### `/forgot-password` — password recovery

The page contains a back-to-sign-in link, logo, explanatory heading, email field, submit button, and validation/error alerts. A success state states that a reset link was requested and offers a return to sign-in. Submission calls Firebase Auth’s password-reset email method (`src/app/forgot-password/page.tsx`).

### `/system-access` — staff sign-in

This separate staff form shows manager/superadmin role selection, email and password fields, a role-key field, email/password sign-in, Google sign-in, request-key entry, manager registration link, and customer sign-in link. Inline notices explain session expiry, authentication errors, and key errors. A verified staff session leads to `/admin` (`src/app/system-access/page.tsx`).

### `/system-access/signup` — manager registration

The page has a back link, logo/heading, Google signup option, email, password and password-strength display, assigned manager-key field, register button, sign-in link, and validation alerts. The manager key is checked through a server action before the staff profile is created or updated (`src/app/system-access/signup/page.tsx`).

### `/builder` — customer PC builder

The heading identifies the builder. The catalog area provides a search field, category and brand filters, sort selector and direction, compatible-only toggle, grid/list switch, paginated product cards, stock/price/specification summaries, and add/remove selection controls. The “Your Build” area lists core and optional part slots, current selections, price and wattage totals, resolution/workload settings, compatibility/performance analysis, and action buttons for reservation or analysis. Its options menu offers save, PDF download when a complete customer build is eligible, clear, and saved-configuration loading. On mobile, the build area opens as a floating-button drawer. A floating AI chat panel can answer questions and use current build context. Initial catalog data is prefetched by the server route and then handled by client hooks (`src/app/builder/page.tsx`, `builder-page.tsx`, `components/inventory-view.tsx`, `src/components/your-build.tsx`).

### `/ai-build-advisor` — customer AI advisor

The heading and maintenance alert explain AI availability. The Critique tab places “Your Build” beside an analysis panel with status, results, refresh, retry, and cancel controls where applicable. The Generate tab has an intended-use selector, goal/performance selector, PHP budget field, flexible-budget, AI Search, and Web Search switches, and a generate button. The result panel shows progress/error states, selected component recommendations, estimated total, research information when enabled, cancel, and save-to-favorites control when a build exists. Tab choice also follows the URL hash (`src/app/ai-build-advisor/page.tsx`, `components/critique-tab.tsx`, `components/recommendation-tab.tsx`, `src/components/chat-form.tsx`, `src/components/build-summary.tsx`).

### `/pre-builts` — customer prebuilt catalog

The heading and introductory copy precede tier filters, search, sort/direction controls, and view controls. System cards/table rows show image, name, tier, price, descriptions/specifications and expandable details, with links to a product page and reservation actions where stock and role allow them. Loading and no-results states explain unavailable content. The list reads `prebuiltSystems` and omits archived entries (`src/app/pre-builts/page.tsx`, `src/components/prebuilt-system-card.tsx`, `src/components/prebuilts-table.tsx`).

### `/pre-builts/[id]` — individual prebuilt

The page has a return link, product image gallery, name/tier/description/price, component accordion with part names and stock status, AI highlights or analysis panel, and an action card. The action card offers “Customize in Builder” and, for eligible customers with a complete in-stock configuration, “Reserve this Build”; it displays missing-part or out-of-stock notices otherwise. Loading and not-found states include a way back. Part names can open detailed specifications, and the image opens a full-screen preview (`src/app/pre-builts/[id]/page.tsx`, its `components/` and `hooks/use-prebuilt-details.ts`).

### `/profile` — registered account

The identity banner shows user information/role and account actions. A navigation sidebar selects Profile and Settings for all signed-in roles; customers also see Reservations, Saved Favourites, and Activity Logs with counts; superadmins also see System Safeguards. Profile shows identity, account summary, reservation/favorite summaries, and a settings link. Settings includes display name, biography, profile photo upload or URL, personal/contact/address fields, and save controls; staff settings can expose key controls. Customer Reservations lists order status, items, dates and prices with cancellation/deletion actions. Saved Favourites lists named builds with load, rename, delete, and “Create New Build.” Activity Logs shows recorded customer actions. System Safeguards shows maintenance, Storage, and AI switches for superadmins (`src/app/profile/page.tsx`, `src/app/profile/components/`).

### `/admin` — staff dashboard

The page has a tab-specific heading and horizontal tab bar. Stock contains component counts, search, category/brand/availability/sort filters, card/table presentations, selection/bulk actions, and add/edit/stock/archive/delete controls. Prebuilts contains tier filtering, system cards, add/edit, archive/delete, and selection/bulk actions. Reservations displays order counts/value, status filtering and order records with customer, component, price, and status information; staff can change status or delete records. Archive lists inactive parts and systems for restore or deletion. Audit shows staff event records. Superadmin-only tabs add Sales & Analytics (charts/metrics and exports), Management Portal (manager accounts, keys and requests), AI (model routing/projects and system prompts), and Site Content (editable About text/images). The header conditionally shows pending-order counts and sales test-data/reset controls (`src/app/admin/page.tsx`, `src/app/admin/components/`, `src/components/sales-analytics.tsx`, `src/components/super-admin-settings.tsx`).

### `/admin/prebuilt-builder` — staff system composer

The heading introduces prebuilt creation. It reuses “Your Build” for selected parts and analysis, with staff-specific save/add-prebuilt action. The catalog offers search, category/brand filters, compatibility filtering, sort/direction, grid/list views, part selection, and pagination. Selected state is saved in browser storage. The floating AI chat can discuss the proposed configuration. Completion opens the prebuilt creation flow, which collects a name and saves a system to the catalog (`src/app/admin/prebuilt-builder/page.tsx`, `src/components/your-build.tsx`, `src/components/build/build-action-footer.tsx`).

## Popups, dialogs, drawers, and other overlays

The following list groups overlays by entry point. Standard close/cancel controls dismiss an overlay without submitting its action unless noted. A reusable overlay may be reachable from several pages.

### Global navigation and notifications

| Overlay | Where opened; visible elements and purpose | Source |
| --- | --- | --- |
| Mobile navigation drawer | Hamburger button in the public or signed-in header opens navigation links and role-appropriate account links on narrow screens. | `src/components/header-mega-menu.tsx`, `src/components/header.tsx` |
| Account menu and sign-out confirmation | Header avatar/menu offers profile, settings, role-relevant links, and sign out. Confirming the sign-out modal ends the Firebase session; cancel retains it. Similar confirmation is available in profile header/sidebar. | `src/components/header.tsx`, `src/app/profile/components/profile-hero.tsx`, `profile-sidebar.tsx` |
| Customer notifications popover | Notification bell opens a list of customer messages with read/delete controls; selecting an order-related notice can open Order Details. | `src/components/user-notifications.tsx` |
| Order Details modal | Shows order ID and status, reservation date, total, each item/category/price, dismiss, and link to the Reservations tab. It is opened from a customer notification. | `src/components/order-details-modal.tsx` |
| Staff notification popover and detail modal | Staff bell lists system alerts, read state, and event summaries. Selecting one opens its message, relative time, abbreviated ID, Close, and Open Audit Log. | `src/components/notification-center.tsx` |
| Session-timeout warning modal | For signed-in users, shows an inactivity warning, logout countdown/progress bar, “Log Out Now,” and “Stay Signed In.” Staff copy specifies a 15-minute inactivity period. | `src/components/auth/session-timeout.tsx`, `src/hooks/use-idle-timeout.ts` |

### Public and authentication routes

| Overlay | Where opened; visible elements and purpose | Source |
| --- | --- | --- |
| About image lightbox | Clicking an About-section image opens a larger image preview with close control. | `src/app/about/page.tsx` |
| Terms of Agreement modal | Opens during customer signup. Displays agreement text and an accept action that enables the form’s terms requirement. | `src/components/auth/terms-of-agreement-modal.tsx` |
| Request Manager Key modal | “Request Key” from staff sign-in opens email entry, explanatory text, Cancel, and Send Request. It registers a key request for superadmin review rather than sending an email directly. | `src/app/system-access/components/request-key-modal.tsx`, `src/app/system-access/page.tsx` |
| Google staff key modal | After Google staff authentication begins, asks for the selected role’s key; shows verification errors and confirm/cancel controls. | `src/app/system-access/page.tsx` |
| Google manager signup key modal | After Google manager signup begins, asks for the manager key before registration; displays key errors and confirm/cancel controls. | `src/app/system-access/signup/page.tsx` |

### Customer builder, AI, and prebuilts

| Overlay | Where opened; visible elements and purpose | Source |
| --- | --- | --- |
| Product details dialog | Product cards, prebuilt component lists, and AI highlights can open part name/brand, price, stock, description, technical specifications, and product images. An image can open a second full-size preview. | `src/components/part-details-content.tsx`, `src/components/part-details-dialog.tsx` |
| Mobile “Your Build” drawer | Floating build button on narrow screens opens selected slots, totals, analysis, and actions otherwise shown in the desktop sidebar. | `src/components/your-build.tsx` |
| Build options menu | The “Your Build” menu exposes Save Current Build, customer PDF download when eligible, Clear All Parts, and saved configurations for loading. | `src/components/your-build.tsx` |
| Save Build Configuration modal | Name field, selected-part summary, Cancel, and Save Configuration store the current build in the signed-in user’s favorites. | `src/components/your-build.tsx` |
| Clear All Parts modal | States the impact of clearing selections, with Cancel and Clear Build actions. | `src/components/your-build.tsx` |
| Confirm Reservation modal | In the customer builder, reviews selected components and total before invoking custom-build reservation. The Reserve Build button first requires all core parts. | `src/components/build/build-action-footer.tsx` |
| AI progress overlay | During AI-assisted prebuilt creation, displays phase logs, progress, elapsed time, and cancellation/completion controls. | `src/components/ai-progress-modal.tsx`, `src/components/your-build.tsx` |
| Floating chat and diagnostics expansion | A floating chat panel provides conversation input, messages, suggested products, and close/minimize controls. A per-message diagnostics expansion shows timing/token information; it is an inline panel, despite the component name “TelemetryDrawer.” | `src/components/builder-floating-chat.tsx`, `src/components/chat/chat-message-list.tsx`, `chat-telemetry-drawer.tsx` |
| Prebuilt card reservation confirmation | A catalog card’s Reserve Rig action can open a component/price review with Cancel and Confirm Reservation. | `src/components/prebuilt-system-card.tsx` |
| Prebuilt image preview | On a prebuilt detail page, clicking the image opens a larger gallery preview with image navigation and close control. | `src/app/pre-builts/[id]/components/prebuilt-image-view.tsx` |

### Customer profile

| Overlay | Where opened; visible elements and purpose | Source |
| --- | --- | --- |
| Cancel Reservation dialog | From a reservation record, shows its items and total and asks the customer to confirm cancellation or go back. | `src/app/profile/page.tsx` |
| Delete reservation record confirmation | From a cancelled reservation, confirms permanent removal of that order record from history. | `src/app/profile/page.tsx`, `components/reservations-list.tsx` |
| Delete favorite confirmation | From Saved Favourites, names the build and confirms deletion. Rename is an inline edit field rather than a modal. | `src/app/profile/components/favorites-list.tsx` |

### Staff inventory, orders, and settings

| Overlay | Where opened; visible elements and purpose | Source |
| --- | --- | --- |
| Add/Edit Part dialog | Stock tab or item edit opens part identity/category, price/stock, images, description/specification fields, optional AI Autofill, Cancel, and Save. Exact specification inputs change with category. | `src/components/add-part-dialog.tsx`, `add-part-editor.tsx`, `src/components/parts/` |
| Adjust Stock dialog | From an inventory item, displays the part and current quantity with controls to add/reduce stock and save or cancel. | `src/components/add-stock-dialog.tsx` |
| Part archive/restore and delete confirmations | Stock/archive cards or table rows ask before hiding, restoring, or permanently deleting an inventory part. | `src/components/inventory-part-card.tsx`, `src/components/inventory-table.tsx` |
| Add/Edit Prebuilt dialog | Prebuilts tab opens name, tier, PHP price, image/description, component selectors, AI Assist, Cancel, and Save/Update. | `src/components/add-prebuilt-dialog.tsx` |
| Prebuilt archive/restore and delete confirmations | Prebuilt cards/table rows confirm archive, restore, or permanent delete. | `src/components/inventory-prebuilt-card.tsx`, `src/components/prebuilts-table.tsx` |
| Prebuilt Builder naming modal | “Add New Prebuilt” after a complete staff build asks for a prebuilt name, then submits the selected configuration; Cancel dismisses it. | `src/components/build/build-action-footer.tsx` |
| Bulk-action confirmation modal | Admin selection actions show the proposed operation and selected count before confirming or cancelling. | `src/app/admin/page.tsx` |
| Delete reservation modal | Admin Reservations asks for confirmation and shows customer email, order ID, total, and status. | `src/app/admin/components/reservations-tab.tsx` |
| Ingest Dummy Data / Reset Analytics modals | Superadmin Sales actions explain that dummy ingestion generates randomized reservations and that reset deletes reservations and clears popularity metrics, then require confirmation. These are test/administrative operations, not customer workflows. | `src/app/admin/components/admin-tab-header.tsx` |
| Delete AI project confirmation | Superadmin AI model settings asks before removing a configured fine-tuned project. | `src/components/ai-model-settings.tsx` |
| Reset system prompts modal | Superadmin prompt editor asks before resetting configured prompts to defaults. | `src/components/ai-system-prompts-settings.tsx` |

Menus, filters, tooltips, selectors, stock/specification accordions, status alerts, and toast messages also appear throughout the app. They expose choices or short feedback in place; they do not create separate pages. `src/components/bottleneck/prototype-slide-drawer.tsx` defines another drawer for a bottleneck prototype, but the inspected page routes do not establish it as a production page overlay, so it is excluded from the reachable-overlay table.

`src/components/prebuilt-builder-add-dialog.tsx` defines a separate prebuilt creation/edit dialog with identity fields, component selectors, AI Assist, and completion actions, but no mounted caller was found in `src/app/` or `src/components/`. It is therefore a source component, not a confirmed reachable popup.

## Audit notes

- The list documents source wiring, not a visual check against a running Firebase dataset. Empty, loading, error, staff/customer, and mobile states change what appears.
- The Contact page’s “Message Received” alert is a local simulated state, not evidence of message delivery. The FAQ’s shipping and warranty statements are static copy.
- The landing feature illustrations contain fixed example values; they should not be read as calculated results for the viewer.
- Several admin controls perform destructive data operations, so the confirmation dialogs above are part of the user flow and should be tested with appropriate nonproduction data before deployment.
