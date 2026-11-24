# Public Feature Authentication

## Goal

Keep public shopping and builder pages browsable while requiring a verified customer session before an action mutates a cart or build, starts AI analysis, checks a saved build, customizes a prebuilt, or enters checkout.

## Shared Policy

- Import `PUBLIC_FEATURE_SIGN_IN_URL` and `PUBLIC_FEATURE_SIGN_IN_REASON` from `src/lib/public-feature-auth.ts` instead of constructing feature sign-in URLs inline.
- Client actions use `usePublicFeatureAuth()` from `src/hooks/use-public-feature-auth.ts` and wrap authenticated work with `requireAuth(() => { ... })`.
- While Firebase/profile state is loading, `requireAuth` performs no action. Loading must never be treated as a confirmed guest session.
- Confirmed guests navigate to `/signin?reason=feature_required`.
- The sign-in page displays `You need to sign in to use this feature.` using the same compact Mantine alert treatment as session-expiration feedback.
- Successful email and Google sign-ins for `feature_required` always navigate to `/builder`. Do not attach or honor `returnTo` for this reason, and do not automatically resume the attempted action.

## Guarded Boundaries

- Builder AI analysis, add-rig-to-cart, buy-now/instant-checkout, saving, build download, and Buildbot chat entry.
- Parts catalog quick-add, product add-to-cart, buy-now, reservation, and “Check with my build.”
- Prebuilt catalog add-to-cart/reservation and customization.
- Prebuilt product add-to-cart, buy-now, reservation, and customization.
- Cart drawer “Proceed to Checkout,” including carts restored from local storage.

Public page navigation and product viewing remain available without authentication. Authenticated handlers retain their existing stock, completeness, compatibility, and role checks after the shared authentication boundary.

## Verification

- Pure policy: `npx tsx --test src/lib/public-feature-auth.test.ts`
- Browser behavior: `npx playwright test tests/public-feature-auth.spec.ts tests/auth-role-navigation.spec.ts`
- Required repository checks: `npm run typecheck`, `npm run lint`, and `npm run build`
