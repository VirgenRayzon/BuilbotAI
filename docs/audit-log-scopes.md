# Audit log scopes

Audit entries use a `scope` to identify the affected area. Staff entries are stored in `auditLogs`; customer entries are stored in `user_auditLogs`. The shared scope values and UI labels live in `src/lib/audit-scopes.ts`.

| Collection | Scope | Recorded activity |
| --- | --- | --- |
| `auditLogs` | `Part` | Part creation, edits, stock changes, archive, restore, deletion |
| `auditLogs` | `Prebuilt` | Prebuilt creation, edits, archive, restore, deletion |
| `auditLogs` | `Order` | Payment, status, reservation, refund, automatic cancellation |
| `auditLogs` | `User` | Manager access changes and staff idle timeout |
| `auditLogs` | `System` | AI model and prompt settings, sales reset, reservation cleanup |
| `user_auditLogs` | `Order` | Order creation, payment and status updates, cancellation |
| `user_auditLogs` | `Favorite` | Favorite build creation, rename, deletion |
| `user_auditLogs` | `Profile` | Profile and account detail updates |
| `user_auditLogs` | `System` | Reserved in the schema; no current writer found |

An entry records `actionName`, `scope`, `resourceName`, optional `resourceId` and `details`, and `createdAt`. Staff entries also include actor identity; customer entries include `userId`. The two audit views filter by these scopes. Older migrated staff entries may use `resourceType` instead of `scope`; the staff hook falls back to that field.

Firestore rules permit managers to read staff logs and customers to read their own logs. Client generated audit entries can still be incomplete or misleading because a client controls fields such as `actionName` and `details`; actions requiring authoritative evidence should write the entry on the server in the same transaction as the action.
