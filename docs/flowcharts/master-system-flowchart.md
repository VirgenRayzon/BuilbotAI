# Master system flowchart

## Simple explanation

This flowchart gives a full view of how people move through the app. Guests can open public store pages or choose a sign-in path. Customers are sent to shopping, building, AI, and profile features. Managers and Super Admins enter the staff dashboard after the staff check passes. Signing out or reaching the idle limit returns the person to the public side of the app.

This is the navigation map. The linked role and feature diagrams expand each module. The root layout mounts Firebase, profile, site settings, theme, loading, and shared shell providers (`src/app/layout.tsx`, `src/components/app-layout.tsx`).

```mermaid
flowchart TD
  Start([Open application]) --> Load[Root layout and providers]
  Load --> Profile{Auth and profile resolved?}
  Profile -- Loading --> Wait[/Loading UI/] --> Profile
  Profile -- Error or missing --> Hold[/Protected content withheld/] --> Auth
  Profile -- Guest --> Public[Public landing and content pages]
  Public --> Auth{Authentication choice}
  Auth -- Customer --> CustomerAuth[Customer sign-in or sign-up]
  Auth -- Staff --> StaffAuth[System Access sign-in or manager sign-up]
  Profile -- Customer --> User[Customer routes]
  Profile -- Manager --> StaffSession{Verified staff tab session?}
  Profile -- Super Admin --> StaffSession
  CustomerAuth --> Profile
  StaffAuth --> Profile
  StaffSession -- No --> StaffExit[Sign out or redirect to System Access] --> StaffAuth
  StaffSession -- Yes, Manager --> Manager[Admin dashboard and prebuilt builder]
  StaffSession -- Yes, Super Admin --> Super[Admin dashboard plus privileged tabs]
  User --> Builder[Builder and build actions]
  User --> Advisor[AI Build Advisor]
  User --> Store[Parts, cart and sample checkout]
  User --> Prebuilts[Prebuilt catalog and detail]
  User --> UserProfile[Profile, contact inbox, saved builds and orders]
  Manager --> Inventory[Stock and prebuilt management]
  Manager --> Orders[Reservations, archive, audit]
  Super --> Inventory
  Super --> Orders
  Super --> Privileged[Sales, management, AI and safeguards]
  Builder --> Logout{Sign out or idle expiration?}
  Advisor --> Logout
  Store --> Logout
  Prebuilts --> Logout
  UserProfile --> Logout
  Inventory --> Logout
  Orders --> Logout
  Privileged --> Logout
  Logout -- No --> Profile
  Logout -- Yes --> SignedOut([Signed out]) --> Public
  SignedOut --> Finish([END])
```

Details: [authentication](authentication-flowchart.md), [user](user-flowchart.md), [manager](manager-flowchart.md), [Super Admin](super-admin-flowchart.md), [AI system](ai-system/ai-master-flowchart.md). The header provides desktop and mobile navigation, profile menu, notification entry points, theme toggle, and sign-out confirmation (`src/components/header.tsx`). The landing page redirects an already verified user to `/builder` or staff to `/admin` (`src/components/landing/landing-page.tsx`).
