# Admin Verification Loader Design

## Intent

Temporarily prevent the “Verifying your account...” interface from appearing on `/admin` and nested admin routes while authentication and the staff profile resolve.

## Behavior

- Admin routes render no verification loader during unresolved authentication.
- Existing permission checks, staff-session validation, and redirects remain active.
- Customer and public route behavior is unchanged.
- A brief blank state on admin routes is acceptable until authorization resolves.

## Approach

Use the existing `isAdminRoute` classification in the global layout and the current pathname in `RouteGuard` to suppress both sources of the loader. This centralizes the temporary behavior and covers current and future nested admin pages without editing each page.

