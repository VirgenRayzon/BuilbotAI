# UI page, popup, and modal audit

This is a source-code audit of the 24 `src/app/**/page.tsx` routes and the overlays reachable from their rendered components, inspected on 26 October 2026. “Visible” means an item appears when the page, role, screen size, data, and loading state allow it. Actual labels and data can change based on Firestore content.

## Shared interface

`src/app/layout.tsx` and `src/components/app-layout.tsx` provide the app-wide header, optional footer, theme, notifications, loading state, and session handling. Public/onboarding routes use `HeaderMegaMenu`: logo, navigation links, sign-in entry, and mobile navigation drawer. Signed-in customers see Builder, Build Advisor, and Pre-builts links; staff see Dashboard and Prebuilt Builder. The signed-in header also has a role/account menu, profile/settings links, sign out, a theme toggle, and either customer notifications or the staff notification center (`src/components/header.tsx`). The footer, where enabled, links to FAQ, About, Group, and Contact; its “Privacy Policy” and “Terms of Service” links currently route to FAQ (`src/components/footer.tsx`). Loading, missing-profile, and maintenance screens can replace page content (`src/components/app-layout.tsx`).

## Page routes and their purpose

### `/` — public landing page

This page introduces BuildbotAI, its PC building tools, featured systems, accessories, and main actions. Guests can start the sign-in flow, while signed-in customers and staff are sent to their main work page (`src/app/page.tsx`, `src/components/landing/`).

### `/about` — public About page

This page explains the store, its history, hardware skills, warranties, delivery service, and customer support. It also gives key business facts and a link to the PC Builder (`src/app/about/page.tsx`).

### `/team` — public team page

This page introduces the project team with member photos, names, roles, and short descriptions. It does not contain a form or change saved data (`src/app/team/page.tsx`, `src/components/landing/team-section.tsx`).

### `/group` — team page alias

This address opens the same content as `/team`. It exists as another way to reach the team page (`src/app/group/page.tsx`).

### `/contact` — public contact page

This page shows the store’s contact details and lets a visitor send an inquiry. Signed-in users can follow staff replies in the Contact Inbox on their Profile, while guest inquiries cannot be followed inside the app (`src/app/contact/page.tsx`, `src/app/api/contact/route.ts`).

### `/faq` — public FAQ page

This page answers common questions about the store, PC builds, orders, delivery, and support. Users can search the questions, open each answer, or go to Contact for more help (`src/app/faq/page.tsx`, `src/app/faq/faq-data.ts`).

### `/signin` — customer sign-in

This page lets customers sign in with email and password or Google. It also links to password recovery and account creation, while staff are directed to System Access (`src/app/signin/page.tsx`).

### `/signup` — customer registration

This page creates a customer account using email and password or Google. It checks the password, requires agreement to the terms, and creates the customer profile (`src/app/signup/page.tsx`, `src/components/auth/terms-of-agreement-modal.tsx`).

### `/forgot-password` — password recovery

This page lets a customer request a password reset link by email. It shows a clear success or error message and links back to sign-in (`src/app/forgot-password/page.tsx`).

### `/system-access` — staff sign-in

This page lets Managers and Super Admins sign in with their staff account and role key. Managers can also request a key or open the manager sign-up page (`src/app/system-access/page.tsx`).

### `/system-access/signup` — manager registration

This page creates a Manager account using email and password or Google. A valid Manager key is required before the staff profile is saved (`src/app/system-access/signup/page.tsx`, `src/app/actions.ts`).

### `/parts` — public parts catalog

This page lists available PC parts with search, category and brand filters, sorting, stock details, and grid or list views. Users can open a part, and cart buttons appear when E-Commerce Mode is on (`src/app/parts/page.tsx`, `src/components/public-parts-catalog.tsx`).

### `/parts/[productId]` — part details

This page shows one part’s images, price, stock, description, and technical details. Customers can reserve the part or add it to the cart when allowed, while staff can open it in inventory management (`src/app/parts/[productId]/page.tsx`, `src/components/public-part-page.tsx`).

### `/builder` — customer PC builder

This customer page lets users choose PC parts and check price, power use, fit, and expected performance. Users can save, load, clear, download, or reserve a build, and they can ask the AI chat about their current choices (`src/app/builder/page.tsx`, `src/app/builder/builder-page.tsx`, `src/components/your-build.tsx`).

### `/ai-build-advisor` — customer AI advisor

This customer page can review a saved PC build or suggest a new build for a chosen use and budget. Users can stop, retry, or save a completed result (`src/app/ai-build-advisor/page.tsx`, `src/app/ai-build-advisor/components/`).

### `/pre-builts` — customer prebuilt catalog

This page lists ready-made PC systems with search, tier filters, sorting, and grid or list views. Users can open a system to see its full details, and staff can open the same catalog in preview mode (`src/app/pre-builts/page.tsx`).

### `/pre-builts/[id]` — individual prebuilt

This page shows one ready-made PC, including its images, parts, price, stock, and AI review. Customers can customize or reserve an available build, while staff can view it without customer actions (`src/app/pre-builts/[id]/page.tsx`, `src/app/pre-builts/[id]/components/`).

### `/checkout` — simulated store checkout

This page walks through delivery, address, payment, order review, and a sample receipt when E-Commerce Mode is on. It is clearly marked as a UI simulation and does not complete a real payment (`src/app/checkout/page.tsx`, `src/context/ecommerce-context.tsx`).

### `/profile` — registered account

This page lets signed-in users view their profile, change account details, and read or reply to contact inquiries. Customers also get reservations or sample orders, saved builds, and activity logs, while Super Admins get system safety controls (`src/app/profile/page.tsx`, `src/app/profile/components/`).

### `/support-requests` — old support link

This route does not show its own page. It sends the user to the Contact Inbox on `/profile` and keeps the selected inquiry ID when one is provided (`src/app/support-requests/page.tsx`).

### `/admin/contact-inquiries` — old staff inbox link

This route does not show its own page. It sends the user to the shared Contact Inbox on `/profile` and keeps the selected inquiry ID when one is provided (`src/app/admin/contact-inquiries/page.tsx`).

### `/admin` — staff dashboard

This staff page now uses a collapsible side menu, a top bar, page search, alerts, and clear section headings. Managers can handle stock, prebuilts, reservations, archives, and audit logs; Super Admins also get sales reports, account and key management, AI model settings, and system prompts. Storefront preview links open the public Parts and Pre-builts pages without leaving the staff flow (`src/app/admin/page.tsx`, `src/app/admin/components/`).

### `/admin/prebuilt-builder` — staff system composer

This staff page is used to choose parts and create a ready-made PC for the store. It includes search and filters, fit checks, build totals, saved browser state, AI chat, and the final save action (`src/app/admin/prebuilt-builder/page.tsx`, `src/components/your-build.tsx`).

### `/q/[token]` — QR opening screen

This short loading page checks a product QR code and sends the user to the matching product page. If the code cannot be used, it shows an error with retry, sign-in, or browse options (`src/app/q/[token]/page.tsx`, `src/hooks/use-qr-resolver.ts`).

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
- The Contact page sends an inquiry through `/api/contact`. Signed-in users can follow replies in their Profile, but guests cannot follow replies inside the app. The FAQ’s shipping and warranty statements are static page content.
- The landing feature illustrations contain fixed example values; they should not be read as calculated results for the viewer.
- Several admin controls perform destructive data operations, so the confirmation dialogs above are part of the user flow and should be tested with appropriate nonproduction data before deployment.
