# Buildbot AI — Database Scalability Plan

This document outlines a comprehensive database scalability plan for the **Buildbot AI** application (Forge Architect AI). It addresses existing bottlenecks, optimizes query performance, improves write reliability during peak traffic, and controls operational costs within Firebase Firestore and Google Cloud Infrastructure.

---

## 1. Architectural Overview & Data Flow

Below is the target database architecture, optimizing read paths (via caching and query filters), authorization checks (using custom claims), and data lifecycles (archival & TTL).

```mermaid
graph TD
    %% User/Client Interactions
    Client[Next.js Client App Router] -->|Public Catalog| CDN[Vercel Edge CDN / ISR Caching]
    Client -->|Protected Queries| Firestore[Google Cloud Firestore]
    Client -->|Authentication| FirebaseAuth[Firebase Auth]

    %% Read Path
    CDN -->|Cache Miss / Revalidate| Firestore
    
    %% Authorization
    FirebaseAuth -->|Custom Auth Claims| FirestoreRules[Firestore Security Rules]
    FirestoreRules -->|Validate Permissions (0 Database Reads)| Firestore

    %% Write Path (Order & Stock)
    Client -->|Deduct Stock / Reserve| CloudFunc[Firebase Cloud Functions]
    CloudFunc -->|Transactional Update| Firestore

    %% Data Lifecycle (Audit Logs & Orders)
    Firestore -->|Audit Logs / System Notifications| TTL[Firestore TTL Engine]
    TTL -->|Auto-Purge 90 Days| DeletedLogs((Deleted/Purged Logs))
    
    %% Backup & Analytics
    CloudFunc -->|Daily Scheduled Cron| BackupFunc[Scheduled Export Function]
    BackupFunc -->|Export Legacy Logs| GCS[Google Cloud Storage GCS]
    BackupFunc -->|Sync Metrics for Analytics| BigQuery[Google Cloud BigQuery]
```

---

## 2. Identified Bottlenecks & Optimization Strategies

### A. Catalog Fetching Query (`useInventoryQuery` / `useInventory`)
> [!WARNING]
> **Current Issue:** The application reads parts from **12 separate root collections** in parallel. It fetches the *entire* collection of each category, then merges and filters the items (e.g. `!isArchived`) in JavaScript on the client side. As the inventory grows, client memory, network request overhead, and Firestore read costs will scale linearly, leading to severe slowdowns and high Firebase bills.

#### Action Plan:
1. **Single Collection Consolidation:** Combine all 12 hardware category collections into a single `/parts` collection with a `category` attribute and an index on `isArchived`.
2. **Server-Side Filtering:** Modify queries to request only active parts using Firestore's query-level parameters:
   ```typescript
   query(collection(firestore, 'parts'), where('isArchived', '==', false))
   ```
3. **Edge Caching / Incremental Static Regeneration (ISR):** Since the public PC part catalog changes relatively infrequently (e.g., daily or when admins update stock), serve it from Next.js ISR.
   - Cache catalog data at the Edge for 5–10 minutes (`revalidate = 300`).
   - Trigger on-demand revalidation only when an admin makes a significant change to the inventory.
   - **Impact:** Decreases database read actions by **up to 95%** for public page loads.
4. **Server-Side Pagination:** On catalog pages, fetch parts in pages of 24 items using `limit(24)` and pointer pagination (`startAfter(lastVisibleDocument)`).

---

### B. Audit Log Querying & Retention (`useAuditLogs`)
> [!WARNING]
> **Current Issue:** The `useAuditLogs` hook retrieves all audit logs from the `/auditLogs` collection and applies a client-side filter to only keep logs from the last 90 days. Because audit logs accumulate indefinitely with every admin operation, this client-side query will eventually fail under load and result in massive Firestore read charges.

#### Action Plan:
1. **Server-Side Date Filtering:** Query logs that are within the 90-day window directly in Firestore. This only requires a default single-field index:
   ```typescript
   const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
   const q = query(
       collection(firestore, 'auditLogs'), 
       where('createdAt', '>=', ninetyDaysAgo),
       orderBy('createdAt', 'desc')
   );
   ```
2. **Firestore Time-To-Live (TTL) Configuration:**
   - Add an `expireAt` timestamp field to all `auditLogs` and `system_notifications` documents at the time of creation (calculated as `createdAt + 90 days`).
   - Configure a native **Firestore TTL Policy** on the `expireAt` field in the Google Cloud Console. Firestore will automatically delete documents older than the timestamp in the background at no additional cost.
3. **Analytics Archival Pipeline:**
   - If historical logs must be kept for auditing or business analytics, deploy a scheduled Cloud Function (running daily) that exports logs older than 90 days to a **Google Cloud Storage (GCS)** bucket in JSON format, or streams them directly to **Google Cloud BigQuery** for low-cost, long-term analytics query support.

---

### C. Reservation & Order Processing (`useOrders`)
> [!IMPORTANT]
> **Current Issue:** The admin orders hook fetches the entire `/orders` collection client-side. Real-time subscriptions to this collection will download historical orders and recalculate statistics in memory. In addition, when inventory is reserved or sold, concurrent stock deductions are prone to race conditions if done via client-side `updateDoc`.

#### Action Plan:
1. **Admin Order Pagination:** Implement server-side pagination for the orders table. Sort by `createdAt` desc, with page sizes of 20.
2. **Pre-Aggregated Sales & Stats Metrics:**
   - Avoid downloading all orders to calculate total counts (e.g. `pendingOrdersCount`).
   - Maintain a dedicated stats document: `/metadata/sales_stats`.
   - Update counters atomically using `increment()` inside Firestore transaction batches when orders are created, cancelled, or finished:
     ```typescript
     // Example Update
     batch.update(doc(firestore, 'metadata', 'sales_stats'), {
         pendingOrdersCount: increment(1)
     });
     ```
3. **Transactional Inventory Deductions:**
   - All inventory deductions must run inside a **Cloud Function transaction**. This ensures that if two customers place an order for the last unit of a GPU simultaneously, the transaction will retry, only one order succeeds, and stock counts never dip below zero.
   - For high-concurrency hotspots (e.g., flash sales of high-demand items), decouple stock writes using **Distributed Counters** or a task queue (e.g., Google Cloud Tasks) to serialize writes and protect Firestore from hitting the 1 write/sec per document limit.

---

### D. AI Inventory Retrieval & Recommendation Flow (`getInventoryFromFirestore`)
> [!TIP]
> **AI Optimization Opportunity:** When "Web Search" is disabled, the AI chatbot fetches inventory menu context by performing **8 parallel queries** to different category collections (CPU, GPU, etc.) in every chat context assembly. Additionally, search matching is done in memory using client-side `.filter()`, which misses items when collections outgrow query limits.

#### Action Plan:
1. **Unified AI Catalog Querying:** Leverage the consolidated `/parts` collection to retrieve inventory details in a single query (using `in` category filters) or a unified access utility, reducing server-to-database connection round-trips.
2. **Context-level Caching:** Cache the formatted store inventory menu context on the Next.js server using Vercel/Next.js caching (e.g., `unstable_cache` or a simple Redis/memory block) with on-demand invalidation. The Genkit flow then fetches the stock list in sub-milliseconds without triggering Firestore reads on each chat generation.
3. **Firestore Native Key-matching:** Generate a `searchKeywords` lowercase array index for parts (e.g., `['intel', 'core', 'i5', '14600k']`). Update `getInventoryFromFirestore` to query natively using `where('searchKeywords', 'array-contains', query)`, avoiding memory filtering limits and ensuring no search results are missed.
4. **Denormalized Specs for Performance AI:** Populate complete denormalized component details directly within the `/prebuiltSystems` document to allow the AI Performance Critiquer (`ai-prebuilt-performance.ts`) to estimate and critique configurations with **1 single document read** instead of 8 parallel N+1 lookup reads.

---

## 3. Security Rules Optimization (Instant Auth Check)

> [!CAUTION]
> **Security Rules Cost Hook:** The current security rules verify roles (`isManager()`, `isSuperAdmin()`) by reading a user document on every check: `get(/databases/$(database)/documents/users/$(request.auth.uid))`. Under heavy traffic, this doubles the read overhead, as every document read requires an additional read evaluation.

### The Solution: Custom Auth Claims
We will move metadata checks into user token claims set via the Firebase Admin SDK (e.g., when a user is promoted or signs up).

```javascript
// Before (Database reads on every security rule execution):
function isManager() {
  return request.auth != null && 
         exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('isManager', false) == true;
}

// After (Zero database reads - claims evaluated in token payload):
function isManager() {
  return request.auth != null && request.auth.token.isManager == true;
}
function isSuperAdmin() {
  return request.auth != null && request.auth.token.isSuperAdmin == true;
}
```

#### Synchronization Routine (Cloud Function):
Create a trigger function on user profile update to sync the Firestore fields (`isManager`, `isSuperAdmin`) with the Authentication custom claims:
```typescript
export const syncUserClaims = onDocumentUpdated("users/{userId}", async (event) => {
    const newData = event.data?.after.data();
    const oldData = event.data?.before.data();
    
    if (!newData) return;
    
    // Check if claims changed
    if (newData.isManager !== oldData?.isManager || newData.isSuperAdmin !== oldData?.isSuperAdmin) {
        await getAuth().setCustomUserClaims(event.params.userId, {
            isManager: !!newData.isManager,
            isSuperAdmin: !!newData.isSuperAdmin
        });
    }
});
```

---

## 4. Scalable Data Models Reference (NoSQL Joins)

To maintain maximum query speed while eliminating complex multi-collection fetches, follow these denormalization guidelines:

| Entity | Field | Denormalization Strategy | Purpose |
| :--- | :--- | :--- | :--- |
| **Order** | `items` | Store snapshot array: `[{ id, name, category, price }]` | Keeps historical receipt intact even if the part catalog is edited or deleted. Avoids N+1 collection joins. |
| **PrebuiltSystem** | `components` | Store `[{ partId, name, brand, price, category }]` | Allows showing spec details instantly in prebuilt cards without resolving 8 different part IDs. |
| **AuditLog** | `actorName` & `actorEmail` | Store string values directly at the time of event | Avoids lookup query back to `/users/{userId}` to identify the actor. |

---

## 5. Implementation Roadmap & Milestones

### Phase 1: Query & Caching Polish (1-2 Weeks)
* [ ] Update `useAuditLogs` to use Firestore server-side queries filtering by `ninetyDaysAgo`.
* [ ] Implement Next.js ISR (Incremental Static Regeneration) on public catalog pages to cache parts list.
* [ ] Change `useOrders` in the Admin Dashboard to fetch paginated batches of 20 orders instead of the entire collection.
* [ ] Integrate Next.js memory cache (`unstable_cache`) for the AI's store inventory context in Genkit flow.

### Phase 2: Role Authorization & Rules Clean-up (2 Weeks)
* [ ] Write a script/Cloud Function to migrate role management to Custom Claims.
* [ ] Refactor `firestore.rules` to check roles via `request.auth.token`.
* [ ] Validate that security rules read operations count is reduced to 0 for static paths.

### Phase 3: Collection Consolidation & Archiving (3 Weeks)
* [ ] Run a migration script (`execution/consolidate_collections.ts`) to merge separate part category collections into a unified `/parts` collection.
* [ ] Add a lowercase `searchKeywords` array field on creation/update of parts for native Firestore keyword queries in `getInventoryFromFirestore`.
* [ ] Enable Google Cloud Firestore TTL on `/auditLogs` and `/system_notifications` collections.
* [ ] Set up GCS export / BigQuery pipeline for legacy compliance reports.
