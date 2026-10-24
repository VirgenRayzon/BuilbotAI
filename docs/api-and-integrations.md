# API routes, server actions, and integrations

## HTTP routes

There are three checked-in `src/app/api/**/route.ts` handlers, all implementing `POST`.

| Route | Input and response | Implementation |
| --- | --- | --- |
| `/api/chat` | Accepts a JSON `messages` array with optional `userProfile` and `currentBuild`; rejects an absent/empty message array. Streams AI SDK UI messages. | Resolves a site prompt and selected model, supplies recent conversation and current build context, and offers tools for current-build analysis, inventory search, and part specifications. Reads local knowledge and Firestore-backed inventory (`src/app/api/chat/route.ts`). No Firebase token check is present in the handler. |
| `/api/ai/build-advisor/recommendations` | Validates JSON with `AiBuildAdvisorRecommendationsInputSchema` (intended use, PHP budget, performance level, optional notes and search/budget flags). Returns generated structured output serialized as text, or JSON errors. | Reads maintenance and model/prompt settings, local knowledge, inventory, optional Google web research, validates budget and compatibility, retries invalid model output, and caches non-web results in `ai_recommendation_cache_v3` (`src/app/api/ai/build-advisor/recommendations/route.ts`, `src/ai/schemas/build-advisor-schemas.ts`). No Firebase token check is present in the handler. |
| `/api/builder/download` | Requires `Authorization: Bearer <Firebase ID token>` and JSON `{ "parts": [{ "category": "CPU", "id": "..." }, ...] }`. Returns a PDF attachment or JSON error. | Verifies the token and Firestore profile, restricts staff accounts, validates required core selections, reloads canonical catalog items, checks Storage cover image URLs, and renders a build PDF (`src/app/api/builder/download/route.ts`). |

The advisor response is produced after model generation and validation; its `ReadableStream` wrapper does not imply progressive model-token streaming. The chat route does use AI SDK streaming. HTTP status, shape, and error strings should be taken from the handlers when integrating a client.

## Server actions

These are Next.js server actions imported by components/hooks, not separate named REST endpoints.

| File | Exported operations |
| --- | --- |
| `src/app/actions.ts` | Genkit wrappers for prebuilt performance, recommendations, part extraction, prebuilt suggestions, build critique, and smart budget; catalog cache helpers; Auth claim sync, staff key sign-in/registration, manager account listing and claim migration; model test, settings/prompt updates and reset; diagnostic `logAdminAction` (console logging only). |
| `src/app/checkout-actions.ts` | `processCheckout` reserves custom-build stock and creates an order and notifications; `updateReservationStatus` changes status and restores stock on cancellation; notification pruning. |
| `src/app/prebuilt-reservation-actions.ts` | `reservePrebuiltSystem` reserves component stock and creates a prebuilt order plus notifications/audit log. |
| `src/app/image-actions.ts` | `fetchImageBase64` proxies a remote image for staff image import after validating its URL and staff Auth token. |

Client-side Firestore operations are also important integration points: `src/firebase/database.ts` writes inventory and prebuilts; profile and admin hooks read/update orders, favorites, profile, settings, logs, and keys under the restrictions in `firestore.rules`. For authorization caveats on Admin SDK actions, see [Firebase authorization](firebase-and-data.md#authentication-and-authorization).

## External systems

| System | Where used | Verified scope |
| --- | --- | --- |
| Firebase Authentication | Sign-in/up pages, Google auth helpers, server token verification | Email/password, Google popup flow, reset email, custom claim attempts, session persistence. |
| Cloud Firestore | Client hooks, catalog writer, server actions/routes | Catalog, profiles, orders, notifications, settings, content, audit logs, keys, AI caches, and vector records. |
| Cloud Storage | Image upload helpers and PDF cover-image lookup | Stores/retrieves product images; deployment of `storage.rules` is unverified. |
| Google Gemini / Vertex AI | `src/ai/`, `src/lib/ai-model-resolver.ts`, API routes | Model routing, chat, advisor, critique, prebuilt and part-detail flows. Availability depends on configured credentials and model access. |
| Google Search grounding | `src/lib/advisor-web-research.ts`, `src/lib/chat-part-specifications.ts` | Optional external hardware research/specification fallback. Output is treated as reference data by application code. |
| Local Markdown knowledge | `src/knowledge/`, `src/lib/knowledge-retriever.ts` | Checked-in hardware guidance used to ground AI context. |

No payment processor, shipping provider, contact form delivery, or ticketing integration was found in the inspected application source. Product copy about these topics should not be interpreted as implemented integrations.
