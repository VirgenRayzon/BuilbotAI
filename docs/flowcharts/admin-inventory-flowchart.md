# Admin inventory and archive

## Simple explanation

This flowchart shows how staff manage parts and ready-made PCs. Staff can search, filter, add, edit, and change stock. Items can be moved to the archive instead of being removed at once. A confirmation box helps stop an action from happening by mistake. Managers can restore items, while permanent delete actions are kept for the Super Admin.

```mermaid
flowchart TD
  Start([Manager or Super Admin opens stock or prebuilts]) --> Load[Read canonical inventory items and prebuiltSystems]
  Load --> Browse[Search, category/tier/brand/availability filters, sort, view and pagination]
  Browse --> Kind{Part or prebuilt action?}
  Kind -- Part add or edit --> PartForm[/Identity, category, price, stock, specs, images/]
  PartForm --> Autofill{Use AI autofill?}
  Autofill -- Yes --> AiPart([AI part extraction]) --> PartForm
  Autofill -- No --> PartSave{Form valid and write succeeds?}
  PartForm --> PartSave
  PartSave -- No --> PartError[/Errors; keep editor open/] --> PartForm
  PartSave -- Yes --> Browse
  Kind -- Stock adjustment --> StockDialog[/Choose add or reduce; enter quantity/] --> Quantity{Valid nonzero adjustment?}
  Quantity -- No --> StockDialog
  Quantity -- Yes --> StockWrite[Update stock and audit] --> Browse
  Kind -- Prebuilt add or edit --> PrebuiltForm[/Identity, tier, components, price, images/]
  PrebuiltForm --> PrebuiltAi{Use AI assist?}
  PrebuiltAi -- Yes --> AiPrebuilt([AI prebuilt suggestions]) --> PrebuiltForm
  PrebuiltAi -- No --> PrebuiltSave{Valid and write succeeds?}
  PrebuiltForm --> PrebuiltSave
  PrebuiltSave -- No --> PrebuiltError[/Errors; keep editor open/] --> PrebuiltForm
  PrebuiltSave -- Yes --> Browse
  Kind -- Archive or restore; Super Admin delete --> Confirm{Confirm dialog?}
  Confirm -- Cancel --> Browse
  Confirm -- Confirm --> Write{Single or bulk write succeeds?}
  Write -- No --> WriteError[/Error toast/] --> Browse
  Write -- Yes --> Browse
  Start --> Archive[Archive tab: archived parts and prebuilts]
  Archive --> Kind
  Browse -- Leave inventory --> Finish([END])
```

Sources: `src/app/admin/page.tsx`, `src/app/admin/components/stock-tab.tsx`, `prebuilt-tab.tsx`, `archive-tab.tsx`, `src/components/inventory-table.tsx`, `inventory-part-card.tsx`, `inventory-prebuilt-card.tsx`, `prebuilts-table.tsx`, `add-part-editor.tsx`, `add-prebuilt-dialog.tsx`, `add-stock-dialog.tsx`, `src/app/admin/hooks/use-inventory.ts`, `use-bulk-actions.ts`. The separate staff prebuilt builder selects catalog components, checks compatibility, and invokes AI description generation before saving (`src/app/admin/prebuilt-builder/page.tsx`).
