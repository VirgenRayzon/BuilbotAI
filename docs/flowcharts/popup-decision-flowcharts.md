# Pop-up and decision flows

The [inventory](interaction-inventory.md#overlay-inventory) lists each source instance. These diagrams group overlays that share the same decision pattern; the table following them records their distinct choices. Closing an overlay through its close control, Escape key, or backdrop follows its `onClose` or `onOpenChange` handler where configured. Native component behavior beyond those handlers was not runtime tested.

## Authentication and session overlays

### Simple explanation

This flowchart covers popups used during sign-in, sign-up, and session checks. A user may need to accept the terms, enter a staff key, or confirm sign-out. The idle warning lets a signed-in person stay signed in or leave now. Closing a popup keeps the current page when no action was confirmed. Errors stay visible so the user knows what must be fixed.

```mermaid
flowchart TD
  Start([Authentication page or idle warning]) --> Trigger{Overlay opened}
  Trigger -- Terms --> Terms[/Read terms/]
  Terms --> TermsChoice{Check acknowledgment or close?}
  TermsChoice -- Check --> Checkbox{Accept & Continue?}
  Checkbox -- Yes --> Accepted[Set terms accepted; close]
  Checkbox -- Review Later --> Signup
  TermsChoice -- Close --> Signup[Return to sign-up, terms still required]
  Trigger -- Staff Google key --> Key[/Enter role key/]
  Key --> KeyChoice{Verify or cancel?}
  KeyChoice -- Cancel or close --> TempLogout[Sign out temporary Google session; close]
  KeyChoice -- Verify --> Server{Key accepted by server?}
  Server -- No --> KeyError[/Show error; keep modal open/] --> Key
  Server -- Yes --> Admin([Mark staff session; navigate to admin])
  Trigger -- Access key request --> Request[/Enter request details/]
  Request --> RequestChoice{Submit or cancel?}
  RequestChoice -- Cancel --> Close([Close without write])
  RequestChoice -- Submit --> RequestWrite{Validation and Firestore write?}
  RequestWrite -- No --> RequestError[/Show error; remain open/] --> Request
  RequestWrite -- Yes --> RequestDone([Show success])
  Trigger -- Idle timeout --> Idle{Stay logged in or logout?}
  Idle -- Stay or close --> Reset[Reset idle timer; close]
  Idle -- Logout or timer expires --> Logout([Sign out])
  Trigger -- Header or profile sign out --> Signout{Confirm sign out?}
  Signout -- Cancel or close --> Close
  Signout -- Confirm --> Logout
  Accepted --> Finish([END])
  Signup --> Finish
  TempLogout --> Finish
  Admin --> Finish
  Close --> Finish
  RequestDone --> Finish
  Reset --> Finish
  Logout --> Finish
```

Sources: `src/components/auth/terms-of-agreement-modal.tsx`, `session-timeout.tsx`, `src/app/system-access/page.tsx`, `signup/page.tsx`, `components/request-key-modal.tsx`, `src/components/header.tsx`, `src/app/profile/components/profile-hero.tsx`, `profile-sidebar.tsx`.

## Build, catalog and product overlays

### Simple explanation

This flowchart covers popups used while browsing products or making a build. Users can view product details, save a build, clear parts, or confirm a reservation. Mobile users can open the build list in a drawer. Product images may open in a larger view. A confirmed action continues the task, while Cancel closes the popup without making the change.

```mermaid
flowchart TD
  Start([Builder or product card]) --> Choose{Open overlay}
  Choose -- Part details --> Details[Read specs, gallery and description]
  Details --> DetailAction{Add/remove, image preview or close?}
  DetailAction -- Add/remove --> Toggle[Run compatibility and stock check; toast outcome] --> Details
  DetailAction -- Image --> Image[Full-size preview: previous, next, close] --> Details
  DetailAction -- Close --> Return([Return to catalog])
  Choose -- Save favorite --> Save[/Enter name/]
  Save --> SaveChoice{Save or cancel?}
  SaveChoice -- Cancel --> Return
  SaveChoice -- Save --> SaveWrite{Valid and Firestore write?}
  SaveWrite -- No --> SaveError[/Validation or toast; stay open/] --> Save
  SaveWrite -- Yes --> Return
  Choose -- Clear build --> Clear{Confirm or cancel?}
  Clear -- Cancel --> Return
  Clear -- Confirm --> Empty[Clear browser build state] --> Return
  Choose -- Reserve build or card prebuilt --> Reserve[Review parts, price and stock]
  Reserve --> ReserveChoice{Confirm or cancel?}
  ReserveChoice -- Cancel --> Return
  ReserveChoice -- Confirm --> Transaction{Server transaction succeeds?}
  Transaction -- No --> ReserveError[/Error toast; remain in context/] --> Reserve
  Transaction -- Yes --> Success([Success toast; clear build or navigate profile])
  Choose -- Manager prebuilt name --> Name[/Enter prebuilt name/]
  Name --> NameChoice{Generate or cancel?}
  NameChoice -- Cancel --> Return
  NameChoice -- Generate --> Generate[Start AI prebuilt generation] --> Return
  Return --> Finish([END])
  Success --> Finish
```

The prebuilt detail page's Reserve action is direct and has no confirmation overlay; the listing and landing card use one (`src/app/pre-builts/[id]/components/prebuilt-action-card.tsx`, `src/components/prebuilt-system-card.tsx`). The builder's manager name and customer reservation modals share `src/components/build/build-action-footer.tsx`.

## Admin mutation overlays

### Simple explanation

This flowchart covers staff popups that can change saved store data. Staff can add or edit parts and prebuilts, change stock, or work with selected records. Archive, restore, reset, and delete actions show a warning before they run. The popup names the action so staff can check it before pressing Confirm. Closing or cancelling the popup leaves the saved data unchanged.

```mermaid
flowchart TD
  Start([Admin action]) --> Kind{Editor or confirmation?}
  Kind -- Part or prebuilt editor --> Form[/Edit fields, images and component selections/]
  Form --> Assist{Use AI autofill or assist?}
  Assist -- Yes --> Ai[Progress, cancel, result or error; apply filled fields] --> Form
  Assist -- No --> Save{Save or cancel?}
  Form --> Save
  Save -- Cancel or close --> Return([Return to admin list])
  Save -- Submit --> Valid{Schema and write succeed?}
  Valid -- No --> FormError[/Validation or toast; keep form/] --> Form
  Valid -- Yes --> Return
  Kind -- Add or reduce stock --> Stock[/Choose mode and quantity/]
  Stock --> StockChoice{Valid nonzero change and confirm?}
  StockChoice -- No or cancel --> Return
  StockChoice -- Yes --> StockWrite[Apply stock mutation; toast] --> Return
  Kind -- Archive, restore or delete --> Confirm{Confirm or cancel?}
  Confirm -- Cancel or close --> Return
  Confirm -- Confirm --> Permission{Role permits operation?}
  Permission -- No --> Denied[/Permission toast/] --> Return
  Permission -- Yes --> Write{Single or bulk write succeeds?}
  Write -- No --> WriteError[/Error toast/] --> Return
  Write -- Yes --> Return
  Kind -- Sales reset or sample data --> SalesConfirm{Confirm or cancel?}
  SalesConfirm -- Cancel --> Return
  SalesConfirm -- Confirm --> SalesWrite[Run operation; toast] --> Return
  Kind -- AI project delete or prompt reset --> AiConfirm{Confirm or cancel?}
  AiConfirm -- Cancel --> Return
  AiConfirm -- Confirm --> AiWrite[Delete browser project or reset stored prompt] --> Return
  Return --> Finish([END])
```

Admin confirmation sources: `src/app/admin/page.tsx`, `src/app/admin/components/admin-tab-header.tsx`, `reservations-tab.tsx`, `src/components/inventory-part-card.tsx`, `inventory-table.tsx`, `inventory-prebuilt-card.tsx`, `prebuilts-table.tsx`, `ai-model-settings.tsx`, `ai-system-prompts-settings.tsx`.

## Profile, notifications and secondary overlays

### Simple explanation

This flowchart covers popups opened from Profile, alerts, and other small tools. Customers can view order details, remove a saved build, or choose what to do with a reservation. Staff can open alert details and move to the related audit page. Image previews and detail boxes can be closed without changing data. Any action that removes saved data asks for confirmation first.

```mermaid
flowchart TD
  Start([Profile, notification, or content action]) --> Kind{Overlay}
  Kind -- Favorite delete --> Favorite{Cancel or delete?}
  Favorite -- Delete --> Delete[Delete favorite document] --> Return([Close or return])
  Favorite -- Cancel --> Return
  Kind -- Cancellation request --> Cancel{Keep reservation or contact staff?}
  Cancel -- Keep --> Return
  Cancel -- Contact --> Contact([Close and navigate to contact])
  Kind -- Notification list --> Notice[Filter, mark read, delete where offered]
  Notice --> Open{Open entry?}
  Open -- Customer order --> Order[Fetch order detail; close or open reservations] --> Return
  Open -- Staff event --> Staff[Detail modal; close or open audit] --> Return
  Kind -- About or product image --> Gallery[Preview; previous, next or close] --> Return
  Kind -- Audit filter or explanation --> Info[Popover content or filter selection] --> Return
  Kind -- Super Admin safeguard --> Browser{Native confirm accepted?}
  Browser -- No --> Return
  Browser -- Yes --> Write[Update site setting and show toast] --> Return
  Return --> Finish([END])
  Contact --> Finish
```

### Choice and outcome notes

| Overlay family | Additional implemented choices and outcomes |
| --- | --- |
| Header/mobile drawers and menus | Navigate to role-appropriate links; close drawer on navigation; profile menu opens profile sections, settings or sign-out modal (`header.tsx`, `header-mega-menu.tsx`). |
| Builder mobile sheet and action menu | Open/close build review; Save, PDF, Clear, or load a favorite. Save/Clear open nested modals (`your-build.tsx`). |
| Part and prebuilt selection popovers | Search/select a part, clear query, remove a slot, or close; changes remain in the parent editor (`add-prebuilt-dialog.tsx`, `prebuilt-builder/part-selector.tsx`). |
| Filter/sort menus | Toggle categories/brands/tiers, select availability or sort, reset filters where offered; update local list state without a write (`inventory-toolbar.tsx`, admin stock/prebuilt tabs). |
| AI explanation and telemetry popovers | Expand rationale or diagnostic detail, then close; no persistence (`component-card.tsx`, chat telemetry, audit log components). |
| Prebuilt image and part previews | Select image, previous/next image, or close; no write (`prebuilt-image-view.tsx`, `part-details-content.tsx`). |
| Reservation administration | Archive, restore, or permanent delete uses a shared pending-action modal; Cancel clears it, Confirm invokes the matching operation (`reservations-tab.tsx`). |
| Sales confirmations | Confirm sample-data ingest or reset; Cancel closes with no operation (`admin-tab-header.tsx`). |
| AI prompts | Reset current prompt or all prompts after confirmation; Cancel closes (`ai-system-prompts-settings.tsx`). |
| AI model project removal | Cancel retains browser project list; Delete removes selected local project from that list (`ai-model-settings.tsx`). |
| Notification popovers | Customer: mark one/all read, delete, inspect order, open reservations. Staff: mark one/all read, inspect event, open audit (`user-notifications.tsx`, `notification-center.tsx`). |

Feedback toasts acknowledge success, validation, permission denial or errors; the advisor ready toast also has an action to view a finished result (`src/components/advisor-job-toast.tsx`). The AI progress modal's Cancel and completion actions are covered in [AI decisions](ai-system/ai-decision-flowchart.md).
