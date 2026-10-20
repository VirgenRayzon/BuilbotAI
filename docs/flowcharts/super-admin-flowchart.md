# Super Admin workflow

Super Admin inherits manager modules and receives additional tabs and profile safeguards when `profile.isSuperAdmin` is true (`src/app/admin/page.tsx`, `src/app/profile/page.tsx`).

```mermaid
flowchart TD
  Start([Verified Super Admin session]) --> Menu{Choose module}
  Menu -- Staff modules --> Shared[Stock, prebuilts, reservations, archive, audit, prebuilt builder]
  Shared --> Destructive{Delete selected item or reservation?}
  Destructive -- No --> Shared
  Destructive -- Yes --> Confirm[Confirmation dialog] --> Decision{Confirm?}
  Decision -- Cancel --> Shared
  Decision -- Confirm --> Delete{Write succeeds?}
  Delete -- Yes --> Shared
  Delete -- No --> Error[/Error toast/] --> Shared
  Menu -- Sales --> Sales[Overview, popularity, filters, Excel export]
  Sales --> SalesChoice{Reset metrics or ingest sample data?}
  SalesChoice -- Yes --> SalesConfirm[Explicit confirmation] --> SalesWrite{Confirm and write succeeds?}
  SalesWrite -- Yes --> Sales
  SalesWrite -- No --> Sales
  Menu -- Management --> Management[Manage manager key, requests and accounts]
  Management --> KeyChoice{Save key, approve/reject request, reset manager?}
  KeyChoice --> KeyWrite[Firestore and Auth operations] --> Management
  Menu -- AI --> AiSettings[Choose model/routing or prompt editor]
  AiSettings --> AiAction{Test, save, reset, or delete local project?}
  AiAction --> AiResult[Validation, action response and toast] --> AiSettings
  Menu -- Site Content --> Content[Edit About content and save] --> Menu
  Menu -- Profile safeguards --> Safeguards[Maintenance, storage or AI switch]
  Safeguards --> BrowserConfirm{Confirm browser prompt?}
  BrowserConfirm -- Cancel --> Safeguards
  BrowserConfirm -- Confirm --> SettingsWrite[Update siteSettings] --> Safeguards
  Menu -- Sign out --> Exit([Signed out])
```

See [admin operations](admin-operations-flowchart.md), [AI settings](ai-system/ai-settings-flowchart.md), [pop-up decisions](popup-decision-flowcharts.md). The local fine-tuned project list is stored in browser state; saving AI settings writes selected routing and model configuration through a server action (`src/components/ai-model-settings.tsx`, `src/app/actions.ts`).
