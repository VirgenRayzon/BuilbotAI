# Landing static images on App Hosting

The landing page's hero and three feature visuals live in `src/assets/landing/` and are imported by their components. Next.js emits these files under `/_next/static/media/` during `npm run build`.

The Firebase App Hosting deployment returned the application's 404 page for root-level `public/` image URLs such as `/feature-1.webp`, even though those files loaded in `next dev` and were tracked in Git. For landing visuals, use static imports and `next/image` rather than root-relative `public/` paths. After a change, run `npm run typecheck`, lint the touched components, and `npm run build`; confirm the expected files appear in `.next/static/media/`. After rollout, open the landing page and verify each image has a nonzero natural width in the browser.

The repository's `npm run lint` currently fails before linting files because Next.js 15's `next lint` is paired with `eslint-config-next` 16's flat configuration. A direct ESLint invocation with `--config node_modules/eslint-config-next/dist/core-web-vitals.js` can validate touched components until the project lint tooling is migrated and existing repository wide violations are addressed.
