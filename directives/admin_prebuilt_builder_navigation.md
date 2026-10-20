# Admin Prebuilt Builder Navigation

## Rule

On a prebuilt detail page, **Customize in Builder** sends managers and super admins to `/admin/prebuilt-builder`. Customer accounts continue to use `/builder`.

## Build transfer

Pass the selected prebuilt through a one-time local storage payload. The admin builder resolves its component IDs against current inventory and replaces its current build with the selected system. Leave missing, archived, and out-of-stock components empty so staff can choose replacements. For repeated RAM or storage items, load only as many units as inventory stock permits. Report every unavailable component. Include every RAM and storage entry in the transfer payload. Keep the admin and customer builder storage keys separate.

## Verification

- From `/pre-builts/{id}?from=admin`, click **Customize in Builder** while signed in as staff.
- Confirm the route is `/admin/prebuilt-builder`; available components appear in **Your Build**, while unavailable components remain empty and are named in a warning.
- Confirm the customer flow still opens `/builder`.
- Run `npm run typecheck` and `npm run lint`.

## Lesson learned

The customer builder route redirects staff accounts to the admin dashboard. Routing a staff detail-page action through `/builder` loses the intended destination and cannot load the build into the admin builder.
