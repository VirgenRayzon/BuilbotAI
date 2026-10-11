# Customer UI Spacing

## Goal

Keep customer-facing cards and panels compact and consistent with the product catalog while preserving clear page hierarchy.

## Rules

1. Use a 12px content inset for ordinary card and panel surfaces. In Mantine, use `p={12}`; in utility classes, use `p-3`.
2. Use 12px gaps between related controls and card sections (`gap-3`, `space-y-3`, or Mantine `gap="sm"`).
3. Keep page gutters, marketing hero spacing, modal spacing, and vertically centered loading or empty states independent from the card inset rule.
4. Prefer light and dark theme-aware surfaces: white or slate in light mode and `#111722` or translucent white borders in dark mode.
5. When compacting a page, check About, FAQ, Contact, Profile, Builder, Build Advisor, Pre-builts, prebuilt details, Manager, and Super Admin views for equivalent surfaces so spacing does not drift between roles.
6. Toolbars that only group search, filter, sort, and view controls should use the page background directly. Do not wrap them in an additional bordered or tinted card unless the toolbar contains explanatory content that needs its own hierarchy.
7. Catalog and admin inventory card images use an edge-to-edge white media surface with `object-contain` and a small internal image inset. Do not crop or enlarge product images on hover.
8. Pagination uses a fixed eight items per page and shows only the page indicator and navigation controls. Keep four-column card grids to at most two rows per page.
9. Nested admin tab bars sit directly in the page flow. Do not add a bordered wrapper or a second boxed background behind the tab list.
10. Staff account lists normalize current `isManager` and legacy `isAdmin` role flags, and exclude super administrators from manager-only lists.
11. Admin audit logs use the same cyan accent, compact spacing, rounded surfaces, and light/dark color tokens as the inventory and reservation tabs.
12. Use the AI settings card surface as the shared bordered-panel reference: `bg-white/85` in light mode and solid `dark:bg-[#111722]` in dark mode.
13. Dialogs keep a 12px viewport inset and use 12px padding for headers, bodies, footers, progress banners, and bordered inner sections.
14. Popovers opened from inside a modal must render inside that modal's DOM instead of creating another modal portal. Clear any controlled popover state before closing the parent dialog, and keep the action footer above picker layers so Cancel remains reachable and focus or pointer locks are released.
15. Prebuilt detail galleries use the original stored image in a large white `object-contain` cover area, with previous/next controls and a compact thumbnail rail beneath it. Use resized image variants only for thumbnails, keep the gallery within the same rounded, bordered surface, and do not add hover zoom.
16. Admin prebuilt component selectors use the same shared compatibility engine as the customer builder. Disable incompatible choices with the specific reason in the picker, and run a full compatibility check again before saving to cover AI-filled and legacy values.
17. Treat editable specification values such as `Socket` and `Memory Type` as authoritative over legacy top-level shortcut fields. Synchronize those shortcuts whenever a part is updated so compatibility changes apply immediately and remain consistent for older consumers.
18. Admin prebuilt cards distinguish unresolved or deleted component IDs from zero inventory. Show **Part Missing** with a red card treatment when any required component cannot be resolved, and reserve **Out of Stock** for components that still exist with zero stock.

## Verification

1. Run `npm run typecheck`.
2. Run `git diff --check`.
3. Visit changed routes on `http://localhost:9002` and verify that text, controls, borders, and focus states remain readable in both themes.
