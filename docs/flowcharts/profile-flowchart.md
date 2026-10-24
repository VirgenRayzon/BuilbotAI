# Profile, favorites and notifications

```mermaid
flowchart TD
  Start([Registered user opens profile]) --> Role{Profile role}
  Role -- Customer --> Customer[Profile, settings, reservations, favorites, activity]
  Role -- Manager --> Manager[Profile, settings, account]
  Role -- Super Admin --> Super[Profile, settings, account, safeguards]
  Customer --> Tab{Select tab}
  Manager --> Tab
  Super --> Tab
  Tab -- Profile or settings --> Edit[/Edit name, bio, image or address fields/]
  Edit --> Save{Validation and Firestore update succeed?}
  Save -- No --> EditError[/Field or save error/] --> Edit
  Save -- Yes --> Tab
  Tab -- Favorites, customer --> Favorite[Load, rename or delete favorite]
  Favorite --> FavChoice{Delete?}
  FavChoice -- Yes --> FavConfirm{Confirm dialog?}
  FavConfirm -- Cancel --> Favorite
  FavConfirm -- Confirm --> FavWrite[Delete users UID favorite] --> Favorite
  FavChoice -- Load --> Builder([Navigate to builder with saved build])
  Tab -- Reservations, customer --> Orders[Read own orders and status]
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
```

Sources: `src/app/profile/page.tsx`, `src/app/profile/hooks/`, `src/app/profile/components/`, `src/components/user-notifications.tsx`, `src/components/notification-center.tsx`, `src/components/order-details-modal.tsx`. A customer-only direct URL tab is sanitized for staff; legacy admin tab names redirect to `/admin`.
