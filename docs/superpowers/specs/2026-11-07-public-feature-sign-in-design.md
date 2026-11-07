# Public Feature Sign-In Design

## Intent

Keep `/builder`, `/pre-builts`, and `/parts` publicly browsable while requiring a customer sign-in for account-dependent actions. Guests who attempt a guarded action must understand why they were redirected, and a successful customer sign-in must always open `/builder`.

## Goals

- Guard add-to-cart, buy-now/instant-checkout, prebuilt customization, build compatibility checks, and AI build analysis on public pages.
- Redirect guests to `/signin?reason=feature_required` without preserving the originating page.
- Show `You need to sign in to use this feature.` on the sign-in card using the same Mantine `Alert` treatment as the existing session-expired notice.
- Route successful email and Google customer sign-ins to `/builder` for this reason.
- Leave authenticated behavior and public browsing unchanged.

## Non-goals and Anti-goals

- Do not automatically resume the attempted action after sign-in.
- Do not protect the public pages themselves.
- Do not change staff authentication or session-timeout behavior.
- Do not duplicate inconsistent redirect URLs across individual handlers.

## Constraints

- Reuse the current Next.js router, user-profile state, Mantine light/dark styling, and existing sign-in page.
- Maintain 44px minimum interactive targets and the existing compact sign-in card.
- Use professional customer-facing copy and strict TypeScript types.

## Approaches

1. **Shared feature-auth guard (selected):** centralize the sign-in URL, guest check, and redirect behavior, then consume it at each public action boundary. This gives every action the same behavior and makes later guarded actions easy to add.
2. **Per-button checks:** add redirects inside every click handler. This is locally simple but duplicates policy and is easy to miss.
3. **E-commerce-context-only guard:** protect cart and checkout mutations centrally. This cannot cleanly cover customization, compatibility, or AI analysis.

## Selected Behavior

When a guest activates any listed feature, the app navigates to `/signin?reason=feature_required`. The sign-in form displays an informational warning styled like the session-expired alert with the exact body copy `You need to sign in to use this feature.` Both email and Google sign-in resolve this reason to `/builder`. Logged-in customers continue through the original handler without an extra redirect.

