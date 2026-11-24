# Public pages and navigation

## Simple explanation

This flowchart shows how a guest moves through the public side of the app. The header links to Home, Parts, Pre-builts, About, Team, FAQ, and Contact where the page allows it. Guests can browse products and open full product details without using the staff dashboard. The Contact form sends an inquiry, while signed-in users can later follow replies in Profile. Sign-in links move customers or staff into the correct account flow.

The shared header renders role-dependent desktop links, a mobile drawer, a profile menu, notifications for signed-in users, a theme toggle, and sign-out confirmation (`src/components/header.tsx`, `src/components/app-layout.tsx`). Informational copy is not evidence of fulfillment or support integrations.

```mermaid
flowchart TD
  Start([Public entry]) --> Landing[Landing page and prebuilt showcase]
  Landing --> Auth{Already verified?}
  Auth -- Customer --> Builder([Builder])
  Auth -- Staff --> Admin([Admin])
  Auth -- Guest --> Nav{Select link or menu}
  Nav -- About --> About[Read store history, services and support details]
  Nav -- Team --> Team[Static team section]
  Nav -- FAQ --> FAQ[Search static questions; expand answer]
  Nav -- Catalog --> Parts[Search and filter public parts; open product]
  Nav -- Pre-builts --> Prebuilt[Browse ready-made PCs; open product]
  Nav -- Contact --> Contact[/Enter contact form fields/]
  Contact --> Valid{Form valid?}
  Valid -- No --> ContactError[/Field error/]
  Valid -- Yes --> Submit[Send inquiry to contact API]
  Submit --> Sent{Saved?}
  Sent -- No --> ContactError
  Sent -- Yes --> ContactDone[Show reference; signed-in user can open Contact Inbox]
  Nav -- Cart, Store Mode --> Cart[Review cart items]
  Cart --> Checkout[Open sample checkout and receipt flow]
  Nav -- Sign in or register --> SignIn([Authentication flow])
  Nav -- Builder or advisor CTA --> SignIn
  Nav -- Prebuilt card --> Prebuilt
  Nav -- Mobile menu --> Drawer[Open navigation drawer]
  Drawer --> Nav
  Nav -- Theme --> Theme[Toggle client theme] --> Nav
  Builder --> Finish([END])
  Admin --> Finish
  ContactDone --> Finish
  Checkout --> Finish
  SignIn --> Finish
  Nav -- Leave site --> Finish
```

`src/app/contact/page.tsx` sends the form to `/api/contact`; signed-in users can follow replies in the Contact Inbox, while guests cannot follow replies inside the app. The checkout route is clearly marked as a UI simulation and does not make a real payment (`src/app/checkout/page.tsx`). Existing routing and direct-link restrictions are expanded in [authentication](authentication-flowchart.md) and [prebuilts](prebuilts-flowchart.md).
