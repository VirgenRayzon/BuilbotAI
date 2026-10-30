# Prebuilt catalog and detail workflow

## Simple explanation

This flowchart shows how users browse ready-made PCs. The list can be searched, filtered, sorted, and changed between card and table views. Opening a PC shows its images, parts, price, stock, and AI report. A customer can move its parts into the Builder or reserve it when all needed items are available. Staff can open the same product for review and return to inventory management.

```mermaid
flowchart TD
  Start([Open prebuilt catalog]) --> Guard{Customer route guard admits user?}
  Guard -- No --> Deny([Redirect or protected UI withheld])
  Guard -- Yes --> Query[Read prebuiltSystems collection]
  Query --> State{Loading, error, or results?}
  State -- Loading --> Wait[/Loading cards/] --> State
  State -- Empty or filtered out --> Empty[/Empty state; change search or filters/]
  State -- Results --> Browse[Search, tier filter, sort and card/table view]
  Browse --> Open[Open prebuilt detail by ID]
  Open --> Found{Document exists and may be shown?}
  Found -- No --> Missing[/Not-found or archived access response; back link/]
  Found -- Yes --> Resolve[Resolve component IDs and stock]
  Resolve --> View[Images, component details, AI report and action card]
  View --> Action{Choose action}
  Action -- Image --> Preview[Preview dialog; next, previous, close] --> View
  Action -- Component --> Part[Part details dialog; close or image preview] --> View
  Action -- Customize --> Payload[Store selected IDs and unavailable-part context] --> Builder([Navigate to builder])
  Action -- Reserve --> Eligible{Complete, in stock, customer signed in?}
  Eligible -- No --> Disabled[/Disabled control or sign-in feedback/] --> View
  Eligible -- Yes, card --> Confirm[Reservation dialog]
  Confirm -- Cancel --> View
  Confirm -- Confirm --> Reserve([Prebuilt reservation transaction])
  Eligible -- Yes, detail --> Reserve
  Reserve --> Outcome{Success?}
  Outcome -- Yes --> Profile([Navigate to profile])
  Outcome -- No --> Error[/Error toast; stay on product/] --> View
  Action -- Staff AI review --> Ai([Generate or re-evaluate report])
  Deny --> Finish([END])
  Empty --> Finish
  Missing --> Finish
  Builder --> Finish
  Profile --> Finish
  Ai --> Finish
  Browse -- Leave catalog --> Finish
```

The listing and landing card use a confirmation dialog (`src/components/prebuilt-system-card.tsx`); the detail page's action card calls `handleReserve` directly without that dialog (`src/app/pre-builts/[id]/components/prebuilt-action-card.tsx`, `hooks/use-prebuilt-details.ts`). Archived detail visibility and report generation depend on the staff profile. Prebuilt creation is in [admin inventory](admin-inventory-flowchart.md); report generation is in [AI prebuilt analysis](ai-system/ai-prebuilt-performance-flowchart.md).
