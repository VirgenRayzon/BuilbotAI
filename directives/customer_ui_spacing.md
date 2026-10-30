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
18. Admin prebuilt cards distinguish unresolved or deleted component IDs from zero inventory. Show **Part Missing** with a red card treatment when any required component cannot be resolved. For components that still exist with zero stock, use the customer prebuilt card's yellow **Missing Parts** badge, yellow border, and dark card treatment.
19. When a pre-built is sent to the PC Builder, carry its unavailable category/part names with the handoff. Show one amber warning toast after the builder loads all available components, naming what the customer must add. Complete systems use the normal success toast. Do not show a success toast before navigation and then lose the incomplete-state explanation.
20. If a production build reports a missing generated metadata route such as `apple-icon.png/route`, remove only the repository's generated `.next` cache and retry. A subsequent `next/font` DNS failure is an environment/network issue; rerun with network access before treating it as a source regression.
21. Canonical `PRD-...` and legacy document-ID prebuilt URLs must render the same established prebuilt detail experience for customers and staff. Resolve the public ID to the internal document only on the server; do not introduce a second customer-only product template. Component carousel cards provide an explicit **View part** link when a public part ID exists.
22. Standalone public part pages follow the prebuilt detail composition: full-width responsive page gutters, a bordered gallery at left, unboxed identity content at right, and a compact action surface anchored below the description. Keep technical specifications in a separate responsive section beneath the hero.
23. Public product image arrays keep the authoritative `imageUrl` first, followed by deduplicated gallery images. Catalog cards with no available stock use the builder's shared `opacity-60 grayscale` treatment in grid and list views while keeping product details accessible.
24. The public Parts toolbar exposes the same **Hide incompatible parts** toggle as the Builder. Evaluate products with the shared compatibility engine against the persisted `pc_builder_state`, keep the toggle off by default, and reset pagination when it changes.
25. Light mode is the default across customer and staff routes. Its shared page, card, popover, muted, border, and cyan colors come from the semantic tokens in `src/app/globals.css`, the matching Mantine theme, and the Tailwind color map. Tailwind `white` intentionally resolves to the warm card surface; use `bg-pure-white` only for product image wells that need a neutral photography backdrop.
26. When intentionally resetting every account to a new default theme, version the theme storage key once and keep the same key in the root layout and theme provider defaults. Subsequent light or dark choices must persist normally.
27. Use `shadow-lg` as the shared elevation for cards, panels, menus, popovers, selects, tooltips, dialogs, and sheets. Apply elevation to the containing surface rather than to text, icons, badges, or layout-only wrappers.
28. The public Parts toolbar keeps search and view controls visible and places category, brand, compatibility, and sort options in one **Filters & sort** panel. Use a desktop popover and mobile drawer with a visible action footer. Keep one desktop popover toggle handler on its target wrapper; adding another to the inner button can make the panel immediately close. Hide the entire desktop popover trigger at mobile widths so only one filter button appears.
29. Public Parts list cards stack their price/QR row above full-width actions on phones. Keep every inner flex container at `min-w-0`, use 44px QR and action targets, and switch back to the compact horizontal composition at `sm` so long names, prices, and optional cart actions cannot create horizontal overflow.
30. Public Parts filter density follows the input method. Keep mobile filter, sort, and removable-filter controls at least 44px tall, but compress desktop checkbox/radio rows and removable chips to roughly 28px. Stock visibility belongs beside compatibility in the unified panel and participates in reset, result counts, and active-filter feedback.
31. Build Advisor handoffs use the same single-toast feedback as pre-built handoffs. After the Builder resolves the recommendation against current inventory, show one amber warning naming every missing, archived, or out-of-stock component; complete recommendations use one success toast.

## Verification

1. Run `npm run typecheck`.
2. Run `git diff --check`.
3. Visit changed routes on `http://localhost:9002` and verify that text, controls, borders, and focus states remain readable in both themes.
