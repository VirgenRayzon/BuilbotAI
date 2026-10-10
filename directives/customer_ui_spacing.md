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

## Verification

1. Run `npm run typecheck`.
2. Run `git diff --check`.
3. Visit changed routes on `http://localhost:9002` and verify that text, controls, borders, and focus states remain readable in both themes.
