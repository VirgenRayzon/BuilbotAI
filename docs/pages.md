# Page audit and purpose

This list covers all 24 page routes found under `src/app`. Each purpose is based on the current source code checked on 26 October 2026.

| Page | Simple purpose | Source |
| --- | --- | --- |
| `/` | Introduces BuildbotAI, its main tools, featured PCs, and links to start. Signed-in users are sent to their customer or staff work page. | `src/app/page.tsx`, `src/components/landing/` |
| `/about` | Explains the store, its history, hardware skills, warranties, delivery, and support. | `src/app/about/page.tsx` |
| `/team` | Introduces the project team with photos, names, roles, and short descriptions. | `src/app/team/page.tsx` |
| `/group` | Opens the same team content as `/team`. | `src/app/group/page.tsx` |
| `/contact` | Shows store contact details and lets a visitor send an inquiry. Signed-in users can follow replies from their Profile. | `src/app/contact/page.tsx`, `src/app/api/contact/route.ts` |
| `/faq` | Gives searchable answers to common questions and links to more help. | `src/app/faq/page.tsx` |
| `/signin` | Lets customers sign in with email and password or Google. Staff are sent to System Access. | `src/app/signin/page.tsx` |
| `/signup` | Creates a customer account after checking the password and terms agreement. | `src/app/signup/page.tsx` |
| `/forgot-password` | Sends a password reset link to the customer’s email. | `src/app/forgot-password/page.tsx` |
| `/system-access` | Lets Managers and Super Admins sign in with a staff account and role key. | `src/app/system-access/page.tsx` |
| `/system-access/signup` | Creates a Manager account after checking the Manager key. | `src/app/system-access/signup/page.tsx` |
| `/parts` | Lists PC parts with search, filters, sorting, stock details, and product links. Cart buttons appear when E-Commerce Mode is on. | `src/app/parts/page.tsx`, `src/components/public-parts-catalog.tsx` |
| `/parts/[productId]` | Shows one part’s images, price, stock, description, and technical details. It also offers the actions allowed for the current user and store mode. | `src/app/parts/[productId]/page.tsx`, `src/components/public-part-page.tsx` |
| `/builder` | Lets customers choose PC parts and check cost, power use, fit, and expected performance. Builds can be saved, loaded, downloaded, discussed with AI, or reserved. | `src/app/builder/page.tsx`, `src/app/builder/builder-page.tsx` |
| `/ai-build-advisor` | Reviews a customer’s build or suggests a new build for a chosen use and budget. | `src/app/ai-build-advisor/page.tsx` |
| `/pre-builts` | Lists ready-made PCs with search, filters, sorting, and links to full details. | `src/app/pre-builts/page.tsx` |
| `/pre-builts/[id]` | Shows one ready-made PC with its images, parts, price, stock, AI review, and allowed actions. | `src/app/pre-builts/[id]/page.tsx` |
| `/checkout` | Shows a sample delivery, payment, order review, and receipt flow when E-Commerce Mode is on. It is a UI simulation, not a real payment page. | `src/app/checkout/page.tsx` |
| `/profile` | Lets signed-in users manage their profile and contact inbox. Other sections depend on the user role and may include orders, reservations, saved builds, activity, or system safety controls. | `src/app/profile/page.tsx` |
| `/support-requests` | Sends users to the Contact Inbox on `/profile`. It has no separate screen. | `src/app/support-requests/page.tsx` |
| `/admin/contact-inquiries` | Sends staff to the shared Contact Inbox on `/profile`. It has no separate screen. | `src/app/admin/contact-inquiries/page.tsx` |
| `/admin` | Gives staff a side menu and top bar for stock, prebuilts, reservations, archives, and audit logs. Super Admins also get sales, staff and key management, AI model settings, and system prompts. | `src/app/admin/page.tsx`, `src/app/admin/components/` |
| `/admin/prebuilt-builder` | Lets staff choose parts, check the build, use AI chat, and save a ready-made PC to the store. | `src/app/admin/prebuilt-builder/page.tsx` |
| `/q/[token]` | Checks a product QR code and opens the matching product. It shows a short loading screen or a clear error if the code cannot be used. | `src/app/q/[token]/page.tsx`, `src/hooks/use-qr-resolver.ts` |

The shared layout provides the main header, footer where used, theme, alerts, loading state, and session handling (`src/app/layout.tsx`, `src/components/app-layout.tsx`). What a user sees can change based on their role, signed-in state, store settings, screen size, and saved data.
