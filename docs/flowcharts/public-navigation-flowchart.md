# Public pages and navigation

The shared header renders role-dependent desktop links, a mobile drawer, a profile menu, notifications for signed-in users, a theme toggle, and sign-out confirmation (`src/components/header.tsx`, `src/components/app-layout.tsx`). Informational copy is not evidence of fulfillment or support integrations.

```mermaid
flowchart TD
  Start([Public entry]) --> Landing[Landing page and prebuilt showcase]
  Landing --> Auth{Already verified?}
  Auth -- Customer --> Builder([Builder])
  Auth -- Staff --> Admin([Admin])
  Auth -- Guest --> Nav{Select link or menu}
  Nav -- About --> About[Read Firestore siteContent or fallback copy; image preview]
  Nav -- Team --> Team[Static team section]
  Nav -- FAQ --> FAQ[Search static questions; expand answer]
  Nav -- Contact --> Contact[/Enter contact form fields/]
  Contact --> Valid{Form valid?}
  Valid -- No --> ContactError[/Field error/]
  Valid -- Yes --> Simulate[Local timer and success state]
  Nav -- Sign in or register --> SignIn([Authentication flow])
  Nav -- Builder or advisor CTA --> SignIn
  Nav -- Prebuilt card --> Prebuilt([Prebuilt route or sign-in path])
  Nav -- Mobile menu --> Drawer[Open navigation drawer]
  Drawer --> Nav
  Nav -- Theme --> Theme[Toggle client theme] --> Nav
```

`src/app/contact/page.tsx` does not send the contact form to a backend. The About image opens a preview modal and closes without a database mutation (`src/app/about/page.tsx`). Existing routing and direct-link restrictions are expanded in [authentication](authentication-flowchart.md) and [prebuilts](prebuilts-flowchart.md).
