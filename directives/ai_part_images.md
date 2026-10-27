# AI Part Autofill Images

## Rule

AI Autofill fills verified component facts and leaves photos unchanged. Photos are optional, so the flow must never inject a remote placeholder URL that can expire or prevent an otherwise valid component from saving.

Every selected photo must expose an always-visible Remove action that remains above loading and failure overlays and works on touch screens. Removing the cover promotes the first remaining photo; removing the last photo clears both `images` and `imageUrl`.

## Verification

- Run AI Autofill on a new component with no photos and confirm no placeholder photo is added.
- Add an invalid remote image URL and confirm its failed preview still has a reachable Remove button.
- Remove a failed cover and confirm the next photo becomes the cover.
- Remove the final photo and confirm the component can be saved without an image.
- Run typecheck, lint, and the production build.

## Lesson learned

The AI flow inserted third-party placeholder URLs even though images are optional. When such a URL returned 404, the image failure layer covered the hover-only removal controls and the storage import stopped the save. Optional media must not be synthesized from unstable URLs, and destructive controls for failed previews must remain independently accessible.
