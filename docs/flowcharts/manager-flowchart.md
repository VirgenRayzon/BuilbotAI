# Manager workflow

## Simple explanation

This flowchart shows what a Manager can do after staff sign-in. The side menu opens stock, prebuilts, the prebuilt builder, reservations, archives, and audit logs. Managers can add and edit records, change stock, update order status, and restore archived items. They can use AI help in part and prebuilt forms, but they cannot use the Super Admin sections. Delete buttons for parts, prebuilts, and reservations are also hidden from Managers.

Manager access requires Firebase Auth, a verified Firestore profile, and a tab session marker created by the System Access key flow. `src/app/admin/page.tsx` renders the manager tab set; `src/app/admin/prebuilt-builder/page.tsx` uses the same staff guard.

```mermaid
flowchart TD
  Start([Verified manager session]) --> Shell[Open side menu and top bar]
  Shell --> Menu{Choose staff destination}
  Menu -- Manage Stock --> Stock[Search, filter, sort; add or edit parts and stock]
  Stock --> StockAction{Action}
  StockAction -- Add or edit --> PartForm[Part editor with optional AI autofill]
  StockAction -- Archive or restore --> Confirm[Single or bulk confirmation]
  Menu -- Manage Prebuilts --> Prebuilt[Search and manage prebuilt systems]
  Prebuilt --> PrebuiltAction{Action}
  PrebuiltAction -- Add or edit --> PrebuiltForm[Select parts, price, images; optional AI assist]
  PrebuiltAction -- Archive or restore --> Confirm
  Menu -- Prebuilt Builder --> StaffBuilder[Compose compatible system from catalog]
  StaffBuilder --> Name[Name and generate prebuilt description] --> Prebuilt
  Menu -- Reservations --> Orders[Filter, inspect and update status]
  Orders --> OrderAction{Action}
  OrderAction -- Status --> Status[Token and role check; transaction; notifications]
  OrderAction -- Archive or restore --> Confirm
  Menu -- Archive --> Archive[Browse archived catalog and reservations]
  Archive --> Confirm
  Menu -- Audit Logs --> Audit[Filter staff logs]
  Menu -- Profile --> Profile[Profile, account, settings and Contact Inbox]
  Menu -- Storefront preview --> Preview[Open public Parts or Pre-builts view]
  Menu -- Notifications --> Notice[Staff notification popover and detail]
  Menu -- Sign out --> Exit([Sign out])
  Confirm -- Cancel --> Menu
  Confirm -- Confirm --> Write{Firestore operation succeeds?}
  Write -- Yes --> Menu
  Write -- No --> Error[/Error toast; stay in module/] --> Menu
  Exit --> Finish([END])
```

Delete controls for parts, prebuilts, and reservations are not rendered for Managers. See [admin inventory](admin-inventory-flowchart.md), [admin operations](admin-operations-flowchart.md), [AI prebuilt assist](ai-system/ai-prebuilt-assist-flowchart.md), and [pop-up decisions](popup-decision-flowcharts.md). Manager-only restrictions are implemented in the UI hooks as well as Firestore rules; the action-specific boundary depends on the invoked operation.
