# Admin operations

## Simple explanation

This flowchart shows the work areas inside the staff dashboard. Staff can check reservations, change order status, and read audit logs. The Super Admin can also open sales, staff management, and AI settings. Important changes ask for confirmation before they are saved. If a user opens a section they cannot use, the page shows an access warning.

```mermaid
flowchart TD
  Start([Admin dashboard]) --> Tab{Selected tab}
  Tab -- Reservations --> Orders[Search, status filter, sort, page and inspect]
  Orders --> Change{Update status?}
  Change -- Yes --> Token[Verify token, claims, profile; transact order and notifications] --> Orders
  Change -- Archive, restore or delete --> Confirm{Confirm modal?}
  Confirm -- Cancel --> Orders
  Confirm -- Confirm --> OrderWrite[Firestore order mutation and toast] --> Orders
  Tab -- Audit --> Audit[Filter staff audit logs]
  Tab -- Sales, Super Admin --> Sales[Charts, popularity filter, Excel export]
  Sales --> SalesAction{Reset or sample data?}
  SalesAction -- Yes --> SalesConfirm{Confirm modal?}
  SalesConfirm -- Cancel --> Sales
  SalesConfirm -- Confirm --> SalesWrite[Reset metrics or create sample sales; toast] --> Sales
  Tab -- Management, Super Admin --> Keys[Manager key, requests and account controls]
  Keys --> KeyAction{Save, approve, reject or reset?}
  KeyAction --> KeyWrite[Update authKeys, keyRequests or users] --> Keys
  Tab -- AI, Super Admin --> AI([Model routing and prompt workflows])
  Tab -- Profile safeguards, Super Admin --> Switch{Browser confirm?}
  Switch -- Cancel --> Tab
  Switch -- Confirm --> SiteSettings[Write siteSettings main; toast] --> Tab
  Tab -- Other role attempts privileged tab --> Denied[/Access Restricted toast/] --> Tab
  Tab -- Leave dashboard --> Finish([END])
```

Sources: `src/app/admin/page.tsx`, `src/app/admin/hooks/use-admin-core.ts`, `use-orders.ts`, `use-sales-actions.ts`, `src/app/admin/components/reservations-tab.tsx`, `sales-tab.tsx`, `admin-sidebar.tsx`, `admin-topbar.tsx`, `admin-tab-header.tsx`, `src/components/super-admin-settings.tsx`, and `src/app/profile/hooks/use-emergency-controls.ts`. Firestore rule enforcement and Admin SDK checks differ by operation; see [errors](error-handling-flowcharts.md) and [interaction inventory](interaction-inventory.md).
