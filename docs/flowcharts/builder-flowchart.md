# Custom builder workflow

The `/builder` server page prefetches the catalog and mounts the client builder; inventory can also load through client Firestore hooks. Selection is kept in browser storage (`src/app/builder/page.tsx`, `builder-page.tsx`, `hooks/use-inventory-query.ts`, `hooks/use-builder-logic.ts`).

```mermaid
flowchart TD
  Start([Customer opens builder]) --> Catalog{Catalog available?}
  Catalog -- Loading --> Wait[/Catalog loading UI/] --> Catalog
  Catalog -- Error or empty --> Empty[/Empty or error feedback; retry or alter filters/]
  Catalog -- Yes --> Browse[Search, category and brand filters, sort, grid/list, pagination]
  Browse --> Choice{Select part or inspect details?}
  Choice -- Inspect --> Detail[Product details dialog and image preview]
  Detail --> Browse
  Choice -- Add or remove --> Check{Compatible and in stock?}
  Check -- No --> Toast[/Compatibility or stock toast; selection unchanged/] --> Browse
  Check -- Yes --> Build[Update build state and local storage]
  Build --> Review[Build panel or mobile sheet]
  Review --> Complete{All eight core categories present?}
  Complete -- No --> Missing[/Show missing categories; continue selecting/] --> Browse
  Complete -- Yes --> Action{Choose action}
  Action -- Save --> SaveModal[/Name favorite/]
  SaveModal --> SaveValid{Name and Firestore write succeed?}
  SaveValid -- No --> SaveError[/Validation or error; remain/] --> SaveModal
  SaveValid -- Yes --> Saved([Favorite stored])
  Action -- Reserve --> ReserveModal[Review parts and total; Confirm or Cancel]
  ReserveModal -- Cancel --> Review
  ReserveModal -- Confirm --> Reservation([Reservation flow])
  Action -- Analyze --> Advisor([AI Build Advisor critique])
  Action -- Download PDF --> Pdf{ID token, profile and catalog recheck pass?}
  Pdf -- No --> PdfError[/Download error toast/]
  Pdf -- Yes --> File([PDF response])
  Review --> ClearModal{Clear build confirmation?}
  ClearModal -- Cancel --> Review
  ClearModal -- Confirm --> Clear[Remove selected parts and persist empty build] --> Browse
  Review --> Chat[Open floating chat; submit, retry, copy or add suggested part]
  Chat --> Browse
```

The compatibility filter and add/remove checks use `src/lib/compatibility.ts`; performance indicators use `src/lib/bottleneck.ts` and `src/lib/fps-estimator.ts`. Favorite loading or prebuilt customization passes part IDs to the builder and may warn about missing or unavailable catalog records (`src/components/your-build.tsx`, `src/app/builder/hooks/use-builder-logic.ts`). PDF generation verifies a Firebase ID token and reloads canonical items and image bytes (`src/app/api/builder/download/route.ts`). The floating chatbot is documented [separately](ai-system/ai-chatbot-flowchart.md).
