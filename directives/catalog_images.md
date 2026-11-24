# Catalog Image Rendering

## Rule

Every catalog surface must pass the shared `shouldCorruptImages` site setting to `getOptimizedStorageUrl`. Never hardcode chaos mode on or off in an individual grid, list, table, cart, or prebuilt card.

Use the stored image URL when chaos mode is disabled and a local placeholder when no image exists. Grid and list views for the same catalog must resolve the same source URL.

## Verification

- Open the customer Builder in grid view and confirm the first page thumbnails load.
- Switch to list view and confirm the same products display valid thumbnails.
- Confirm the admin inventory and prebuilt catalog still render normally.
- Enable the administrative image chaos setting only during its dedicated test and confirm all participating surfaces follow it.
- Run typecheck, lint, and the production build.

## Lesson learned

The customer Builder list view passed a literal `true` to `getOptimizedStorageUrl`, corrupting every thumbnail even when the site chaos setting was disabled. Image fault injection must always come from the shared settings context.
