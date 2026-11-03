# BuildbotAI Database Scalability Plan

_Updated 3 November 2026 based on the application code and Firebase files in this repository. The live database, deployed indexes, usage, and costs have not been checked._

## 1. How the database works today

BuildbotAI uses Cloud Firestore for products, orders, accounts, notifications, support messages, and AI data. The browser listens for changes in some collections so screens update automatically. Next.js server actions and API routes also read and write Firestore. Firebase Storage holds product images.

- PC parts are stored by category at `inventory/{category}/items/{partId}`. Prebuilt PCs are stored separately in `prebuiltSystems`. Older collection paths are still supported during the inventory migration.
- Orders are stored in `orders`. Each order keeps a copy of the purchased item details, so later product edits do not change the order record. Checkout and stock updates use server transactions to prevent overselling. Operation records make retries safer.
- Each user has their own saved builds and notifications. Audit logs, staff notifications, contact inquiries, AI caches, and hardware search data have separate collections.
- Public parts data has a 10-minute Next.js cache that is refreshed after inventory changes. The builder and AI inventory use short-lived server memory caches. Firestore indexes are configured for inventory keyword search, contact history, order audit history, and hardware vector search.

## 2. Where growth could cause problems

| Area | What happens now | Why it matters as the store grows |
| --- | --- | --- |
| Product loading | Some staff and AI screens listen to all 12 part categories, even when the user needs only one. Prebuilt lists also load without a database page limit. | More products mean more reads, longer loading, and more work in the browser. |
| Order loading | The staff order screen starts with 100 orders. “Load more” expands the same live query by another 100 rather than fetching a separate page. Some sales actions read every order and product. | Old orders increase read costs and slow down staff screens and reports. |
| Logs and stored results | The audit screen reads all logs from the past 90 days. There is no page limit or checked-in automatic expiry policy for logs, notifications, AI caches, or retry records. | These collections keep growing, along with their storage and index costs. |
| Product details | Some prebuilt screens fetch each included part separately and may search by name or an older path. | A page of prebuilts can trigger many extra reads. |
| Search and indexes | Part search checks the first word in Firestore, then filters additional words after a limited set of results has been downloaded. | Matching products can be missed; new filter and sort combinations may need new indexes. |
| Popular products | Every sale of the same part updates one stock record. Transactions keep stock correct. | A sudden surge for one product could cause retries and slower checkout. |

## 3. Practical improvements

1. **Show small pages of records.** Fetch about 25–50 orders or logs at a time, with a “Next” or “Load more” action that starts after the last record. Apply the same approach to growing notification, saved-build, contact, and prebuilt lists. Keep live updates for the first page where they are useful.
2. **Fetch only the products needed.** Load the selected part category on staff and AI screens. Filter active products and common search choices in Firestore. Keep using the existing cache for the public catalog.
3. **Avoid reading everything for routine reports.** Limit sales queries by date and status. Use Firestore count queries for simple totals. Add stored daily totals only if measurements show that repeated queries are too costly. Generate large exports only when requested or as background work.
4. **Cut repeated product lookups.** Store the small set of details needed for prebuilt cards with each prebuilt. Keep order item copies as they are. Remove old path and name-based lookups after the inventory migration has been verified.
5. **Add indexes with the queries that need them.** When adding order status/date filters or product sorting, test the query, add the required index to `firestore.indexes.json`, and wait for that index to be ready before releasing the screen.
6. **Set a retention policy.** Decide how long to keep each kind of log, notification, AI cache, and retry record. Add automatic expiry only for records that are safe to delete. Preserve orders, payment history, and any audit records the business must retain.
7. **Measure cache performance.** Keep the existing public catalog cache and refresh it after successful inventory writes. Include a catalog version in AI cache keys when results depend on current products. Consider a shared cache only if measurements show repeated reads across server instances.

## 4. Supporting future growth

The current Firestore structure can continue to serve more users, products, inventory changes, and orders if large lists are paged and queries have the right indexes. Keep stock changes in server transactions. Track database reads and writes, storage costs, cache hits, checkout speed, and transaction retries. If a popular product starts causing frequent checkout retries, then consider a queue or a separate reservation process.

Set usage budgets and alerts, schedule database backups, and test that a backup can be restored. Use exported data or BigQuery for long-term sales analysis only when Firestore reports become too slow or expensive. Firestore should remain the source of truth for live orders and inventory.

## 5. What to do first

1. **First:** Page the staff order and audit screens; limit routine sales queries by date or status.
2. **Next:** Load products by category on staff and AI screens, then page prebuilt lists.
3. **Next:** Agree on retention periods and enable automatic expiry for disposable records.
4. **Later:** Reduce repeated prebuilt part lookups and retire verified legacy paths.
5. **Ongoing:** Monitor usage and costs before adding more complex infrastructure.
