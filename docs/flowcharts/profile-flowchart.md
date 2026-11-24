# Profile, favorites and notifications

## Simple explanation

This flowchart shows what a signed-in person can do from the Profile page. Every role can edit basic account details and use the Contact Inbox. Customers can also view orders or reservations, saved builds, activity, and alerts. Super Admins get extra safety switches for store and AI features. The page hides tabs that do not belong to the signed-in role.

```mermaid
flowchart TD
  Start([Registered user opens profile]) --> Role{Profile role}
  Role -- Customer --> Customer[Profile, settings, contact inbox, orders or reservations, saved builds, activity]
  Role -- Manager --> Manager[Profile, settings, account, contact inbox]
  Role -- Super Admin --> Super[Profile, settings, account, contact inbox, safeguards]
  Customer --> Tab{Select tab}
  Manager --> Tab
  Super --> Tab
  Tab -- Profile or settings --> Edit[/Edit name, bio, image or address fields/]
  Edit --> Save{Validation and Firestore update succeed?}
  Save -- No --> EditError[/Field or save error/] --> Edit
  Save -- Yes --> Tab
  Tab -- Contact Inbox, all roles --> Inbox[Read inquiry; send reply; mark or remove when allowed]
  Tab -- Favorites, customer --> Favorite[Load, rename or delete favorite]
  Favorite --> FavChoice{Delete?}
  FavChoice -- Yes --> FavConfirm{Confirm dialog?}
  FavConfirm -- Cancel --> Favorite
  FavConfirm -- Confirm --> FavWrite[Delete users UID favorite] --> Favorite
  FavChoice -- Load --> Builder([Navigate to builder with saved build])
  Tab -- Orders or reservations, customer --> Orders[Read own records and status]
  Orders --> CancelModal{Open cancellation modal?}
  CancelModal -- Keep --> Orders
  CancelModal -- Contact staff --> Contact([Navigate to contact page])
  Tab -- Activity, customer --> Audit[Filter user audit logs]
  Tab -- Safeguards, Super Admin --> Controls[Browser confirmation and site setting write]
  Start --> Bell{Notification bell?}
  Bell -- Customer --> UserNotice[Filter, mark, delete; open order detail modal]
  Bell -- Staff --> StaffNotice[Filter and mark; detail modal or audit link]
  UserNotice --> Tab
  StaffNotice --> Tab
  Tab --> SignOut{Sign-out confirmation?}
  SignOut -- Cancel --> Tab
  SignOut -- Confirm --> Exit([Signed out])
  Builder --> Finish([END])
  Contact --> Finish
  Exit --> Finish
  Tab -- Leave profile --> Finish
```

Sources: `src/app/profile/page.tsx`, `src/app/profile/hooks/`, `src/app/profile/components/`, `src/components/user-notifications.tsx`, `src/components/notification-center.tsx`, `src/components/order-details-modal.tsx`. A customer-only direct URL tab is sanitized for staff; legacy admin tab names redirect to `/admin`.
