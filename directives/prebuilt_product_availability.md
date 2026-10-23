# Prebuilt Product Availability

## Rule

On a prebuilt product page, show every configured component, including unresolved or out-of-stock items. Required categories with no selected item also need a visible placeholder. List all unavailable items below the build actions so the customer or staff member knows what to replace.

## Component cards

Place unavailable cards first in the component carousel. Give them a yellow border, a dark amber surface in dark mode, and a clear **Out of stock** or **Missing part** badge. Available cards keep their normal appearance. Resolve every RAM and storage entry separately and treat quantities beyond current stock as unavailable.

## Product layout

On desktop, stretch the left system image carousel to the full height of the right product-details column. Preserve the square gallery layout on mobile, where the columns stack vertically.

## Verification

- Open a prebuilt with an out-of-stock item and confirm its name appears in the warning and its highlighted card appears first.
- Confirm an empty required category and an unresolved inventory item appear as missing cards.
- Confirm repeated RAM or storage entries beyond available stock are reported.
- Customize an incomplete prebuilt and confirm the builder count matches the number of available components reported as loaded.
- Run `npm run typecheck`, `npm run lint`, and the relevant availability tests.

## Lesson learned

The customer builder restores a persisted draft and consumes a one-time prebuilt transfer during mount. Both operations must be idempotent because React Strict Mode replays mount effects in development; otherwise the replay can replace the imported prebuilt with an older empty draft after the transfer payload has already been removed.
