# App Router page audit

This inventory covers every checked-in `src/app/**/page.tsx`. Access refers to the implemented UI guard or sign-in flow. It does not establish server authorization for every downstream operation.

| Route | Access and implemented behavior | Source |
| --- | --- | --- |
| `/` | Public landing page with hero, features, prebuilt showcase, team, and calls to action. Prebuilt showcase reads Firestore. | `src/app/page.tsx`, `src/components/landing/` |
| `/about` | Public About content from `siteContent/about`, with hardcoded fallback sections, section navigation, and image modal. | `src/app/about/page.tsx` |
| `/team` | Public team presentation via `TeamSection`. | `src/app/team/page.tsx` |
| `/contact` | Public contact information and form. Submitting sets a success state after a timer; no send request is implemented. | `src/app/contact/page.tsx` |
| `/faq` | Public searchable accordion of static FAQ entries. The text is content, not proof of service operations. | `src/app/faq/page.tsx` |
| `/signin` | Customer email/password or Google sign-in, optional local persistence, profile lookup, staff-account rejection, then navigation to builder. | `src/app/signin/page.tsx`, `src/firebase/auth/google-auth.tsx` |
| `/signup` | Customer email/password or Google registration, terms acceptance, password validation, and Firestore profile creation. | `src/app/signup/page.tsx` |
| `/forgot-password` | Validates an email and calls Firebase Auth `sendPasswordResetEmail`. | `src/app/forgot-password/page.tsx` |
| `/system-access` | Staff email/password or Google sign-in with manager/superadmin key verification; supports key requests. Uses session persistence and a sessionStorage marker for admin navigation. | `src/app/system-access/page.tsx`, `src/app/actions.ts` |
| `/system-access/signup` | Manager registration with email/password or Google and a manager key. | `src/app/system-access/signup/page.tsx`, `src/app/actions.ts` |
| `/builder` | Customer-only component catalog and build workspace. Dynamic server prefetch, search/filter/sort/pagination, category and brand filters, compatibility filtering, saved browser build state, analysis, chat, reservation, favorites, and PDF actions are wired through hooks/components. | `src/app/builder/page.tsx`, `builder-page.tsx`, `hooks/`, `src/components/your-build.tsx` |
| `/ai-build-advisor` | Customer-only critique and recommendation tabs. Loads builder state; offers workload/resolution settings, generated recommendations with budget/options, and cancellation. AI maintenance setting is read from site settings. | `src/app/ai-build-advisor/page.tsx`, `hooks/`, `components/` |
| `/pre-builts` | Customer-only Firestore prebuilt listing with tier filters, search, sorting, expanded details, and product links. Archived entries are filtered. | `src/app/pre-builts/page.tsx` |
| `/pre-builts/[id]` | Product detail by Firestore document ID. Resolves component references, shows images and AI report/analysis, stock/completeness status, and customize/reserve actions. Staff may view via the admin flow; the reserve button is hidden for staff. | `src/app/pre-builts/[id]/page.tsx`, `hooks/use-prebuilt-details.ts` |
| `/profile` | Registered-user profile, account, and settings tabs. Customer tabs add reservations, favorite builds, and activity. Superadmin adds safeguards; staff have fewer tabs. | `src/app/profile/page.tsx`, `hooks/`, `components/` |
| `/admin` | Staff-only dashboard with stock, prebuilts, reservations, archive, and audit tabs. Superadmin-only tabs expose sales, account/key management, AI settings/prompts, and About content editing. | `src/app/admin/page.tsx`, `hooks/`, `components/` |
| `/admin/prebuilt-builder` | Staff-guarded catalog builder for composing and saving prebuilt systems; includes compatibility checking, browser-persisted state, and chat. | `src/app/admin/prebuilt-builder/page.tsx` |

The root layout applies shared navigation, footer/layout behavior, theme, notifications, and session components to these routes (`src/app/layout.tsx`, `src/components/app-layout.tsx`). A client-side `RouteGuard` is explicitly used by the builder, advisor, prebuilt listing, profile, and admin pages. The individual prebuilt detail page checks profile state within its hook/components rather than wrapping the page in that guard.
