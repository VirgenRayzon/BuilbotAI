# Saved Build Loading

## Goal

Keep saved customer configurations loadable from every surface that renders the shared `YourBuild` component, including `/builder` and the Build Advisor review tab.

## State contract

- `YourBuild` announces a selected configuration with the `load-favorite-build` browser event.
- Every owning build-state hook must subscribe to that event and replace its local state; rendering the shared menu alone is not sufficient.
- Resolve saved part IDs against the current inventory before updating state. Fall back to an exact case-insensitive product-name match for legacy records.
- Do not restore archived or out-of-stock products. Report unavailable saved parts and leave their category empty.
- Preserve repeated RAM and Storage entries, synchronize integrated graphics, and persist the resolved build to `pc_builder_state`.

## Verification

From `/ai-build-advisor#critique`, open **Your Build** options and load a saved configuration whose total differs from the current build. Confirm the component names, part count, wattage, and total update immediately. When a saved product is unavailable, confirm its category stays empty and the warning names the missing product.
