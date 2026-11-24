# Saved Build Loading

## Goal

Keep saved customer configurations loadable from every surface that renders the shared `YourBuild` component, including `/builder` and the Build Advisor review tab.

## State contract

- `YourBuild` announces a selected configuration with the `load-favorite-build` browser event.
- Every owning build-state hook must subscribe to that event and replace its local state; rendering the shared menu alone is not sufficient.
- Resolve saved part IDs against the current inventory before updating state. Fall back to an exact case-insensitive product-name match for legacy records.
- Do not restore archived or out-of-stock products. Report unavailable saved parts and leave their category empty.
- Preserve repeated RAM and Storage entries, synchronize integrated graphics, and persist the resolved build to `pc_builder_state`.

## Admin prebuilt editing

- **Customize in Builder** from a prebuilt detail page transfers its current component selections to `/admin/prebuilt-builder` and retains the source document ID in the admin edit session.
- Show `Editing {prebuilt name}` under missing-parts feedback and label the primary action **Update Prebuilt**. Require all eight core categories before updating.
- Update the source prebuilt document, preserving its product identity, name, description, and image gallery. Never create a second prebuilt from an edit session. Clear the edit session after a successful update or an explicit Clear Build action.

## Verification

From `/ai-build-advisor#critique`, open **Your Build** options and load a saved configuration whose total differs from the current build. Confirm the component names, part count, wattage, and total update immediately. When a saved product is unavailable, confirm its category stays empty and the warning names the missing product.
