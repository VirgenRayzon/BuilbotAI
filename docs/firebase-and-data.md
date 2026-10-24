# Firebase integration and data model

## Configuration

The browser app initializes one Firebase app and exposes Auth, Firestore, and Storage SDK instances through `FirebaseClientProvider` (`src/firebase/config.ts`, `init.ts`, `client-provider.tsx`, `provider.tsx`). The following client variables are read by `src/firebase/config.ts`:

```text
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

Server code initializes Firebase Admin on demand (`src/firebase/server-init.ts`). It accepts `FB_SERVICE_ACCOUNT` or `FIREBASE_SERVICE_ACCOUNT` as JSON or base64 JSON, then falls back to default credentials. It also reads `NEXT_PUBLIC_FIREBASE_PROJECT_ID` and constructs a `*.firebasestorage.app` bucket name. AI code reads one of `GOOGLE_GENERATIVE_AI_API_KEY`, `GEMINI_API_KEY`, or `GOOGLE_API_KEY`; Genkit and model routing also use `GOOGLE_VERTEX_LOCATION` and optionally `GEMINI_FINE_TUNED_MODEL` (`src/ai/genkit.ts`, `src/lib/ai-model-resolver.ts`). These are variable names only; actual values and deployment secrets are not verified here.

`firebase.json` points to `firestore.rules` and `firestore.indexes.json` and declares Firebase Hosting source `.`. The index file declares an `items` collection-scope index on `isArchived` plus `searchKeywords` and a 768-dimensional vector index on `items.embedding`. `storage.rules` is checked in but is not referenced from `firebase.json`. The source contains no evidence that the configured rules/indexes have been deployed.

## Authentication and authorization

Firebase Auth supports email/password and Google flows. Customer pages use local or session persistence according to sign-in choice; staff access uses browser session persistence. Customer sign-in rejects profiles marked as staff (`src/app/signin/page.tsx`, `src/firebase/auth/google-auth.tsx`). Staff sign-in/registration passes an Auth ID token and role key to server actions, which check Firestore `users/{uid}` and `authKeys/{key}`, update the role profile, and attempt to set custom claims (`src/app/actions.ts`). The code also contains server-side fallback keys; their presence is an implementation fact, not a deployment recommendation.

The live `users/{uid}` snapshot supplies the client role: `guest`, `user`, `manager`, or `superadmin` (`src/context/user-profile.tsx`, `src/lib/auth-utils.ts`). `RouteGuard` waits for the profile and redirects unauthorized navigation. Admin access additionally checks `sessionStorage.buildbot_admin_session_active` against the current UID; timeout handling lives under `src/components/auth/` and `src/hooks/use-idle-timeout.ts`. The admin dashboard exposes management, AI settings, content, and sales controls only for superadmins. Staff-only and customer-only route checks are UI checks; they do not replace Firestore or server authorization.

The checked-in Firestore rules (`firestore.rules`) use Auth custom claims for manager/superadmin writes. They allow public reads of catalog/prebuilt/site content and scoped reads/writes for user data, orders, notifications, staff logs, and settings. Storage rules permit public reads and check a Firestore staff profile for writes (`storage.rules`). Roles in the client profile and roles in custom claims can diverge if claims are not refreshed or setting claims fails; the action code catches some claim-setting failures.

**Authorization boundary requiring review:** `processCheckout`, `reservePrebuiltSystem`, and `updateReservationStatus` use Firebase Admin transactions but accept identity or actor information as action arguments and do not verify an ID token or independently resolve the caller inside those functions (`src/app/checkout-actions.ts`, `src/app/prebuilt-reservation-actions.ts`). The calling UI does check user/profile state. Because Admin SDK bypasses Firestore rules, those UI checks alone do not establish authorization for direct server-action invocation. The chat and advisor HTTP handlers also do not verify a Firebase ID token (`src/app/api/chat/route.ts`, `src/app/api/ai/build-advisor/recommendations/route.ts`). These are observations from source, not a claim that a deployed instance was exploited. No application code was changed during this documentation task.

## Firestore collections and relationships

Firestore is schemaless; the table summarizes structures evidenced by `src/lib/types.ts`, path helpers, rules, and writers. Fields can vary by document and migration state.

| Path | Key fields / relationship | Use |
| --- | --- | --- |
| `inventory/{categorySlug}` | Category metadata; slug is one of CPU, GPU, motherboard, RAM, storage, PSU, case, cooler, monitor, keyboard, mouse, headset in lowercase. | Parent category documents. |
| `inventory/{categorySlug}/items/{partId}` | `Part`: name, category, brand, PHP price, stock, image URL, specifications; optional wattage, performance, archive, popularity, USD SRP fields. | Canonical component catalog; item IDs appear in prebuilt component maps, orders, and favorites. |
| `prebuiltSystems/{systemId}` | Name, tier, description, price, images, component IDs by category, optional AI report and archive flag. | Prebuilt listing/detail and reservations. |
| `users/{uid}` | Email/profile fields, `isManager`, optional `isSuperAdmin`, and staff key metadata. UID matches Firebase Auth identity. | Profile and role lookup. |
| `users/{uid}/favorites/{favoriteId}` | Named build, selected part IDs/categories/prices, total, source, optional load context. | Customer saved builds. |
| `users/{uid}/notifications/{notificationId}` | User/order IDs, title/message, read flag, timestamp. | Customer reservation notifications. |
| `orders/{orderId}` | `userId`, email, item snapshot array, total, status, optional prebuilt ID/name/tier, timestamps. | Reservation and staff fulfillment status. |
| `system_notifications/{id}` | Actor, type, title/message, target ID, `readBy`, timestamp. | Staff notification center. |
| `auditLogs/{id}` | Staff action, actor, scope, resource, details, timestamp. | Staff audit view. |
| `user_auditLogs/{id}` | User ID, action, scope, resource, details, timestamp. | Customer activity and staff audit context. |
| `authKeys/{key}` | Role marker. Document ID is the access key in the checked-in implementation. | Staff key validation and management. |
| `keyRequests/{id}` | Request email/status and related fields. | Staff access-key requests and superadmin review. |
| `siteSettings/main` | Maintenance flag, AI model routing, prompts, and related settings. | Runtime site/AI behavior. |
| `siteContent/about` | Title, subtitle, section content and image references. | Editable About page. |
| `ai_critique_cache_v1/{key}`, `ai_recommendation_cache_v3/{key}` | Input/output and timestamp cache records. | Server AI result reuse. |
| `buildbot_hardware_vector/{category}/items/{id}` | Hardware vector records read by retriever. | Grounding for part specification lookup. |

`src/lib/inventory-paths.ts` defines canonical inventory paths. Some prebuilt resolution and favorite-inventory code still falls back to legacy top-level category collections (for example `CPU/{id}`), and `firestore.rules` retains read/write matches for those paths. A legacy `parts/{id}` rule also exists. This indicates migration compatibility, not proof that legacy documents remain in live Firestore.

## Storage and transactional updates

Part/prebuilt image upload helpers use Firebase Storage and save download URLs in Firestore (`src/firebase/database.ts`); the PDF route reads selected cover images from project Storage after validating bucket and `parts/` path (`src/app/api/builder/download/route.ts`). Catalog writes use client Firestore SDK batches/documents. Custom and prebuilt reservation actions use server-side transactions to check item stock, decrement stock, increment popularity, create an `orders` document, and write user/staff notifications plus a user audit entry. Status changes can return stock on cancellation (`src/app/checkout-actions.ts`). No relational foreign-key enforcement exists in the checked-in Firestore rules; references are application-managed IDs.
