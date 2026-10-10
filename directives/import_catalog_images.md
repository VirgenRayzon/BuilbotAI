# Import catalog images from links

## Scope

Managers can paste direct image links into the part editor (one per line) or the prebuilt image picker. Links are queued in the form. Saving the item downloads each remote image and uploads it into Firebase Storage; Firestore stores only the resulting Storage URL.

## Existing path

- The client upload pipeline is in `src/firebase/database.ts`. Local files arrive as compressed `data:image` values and upload through the authenticated Firebase Storage client SDK.
- Remote links pass through `fetchImageBase64` in `src/app/image-actions.ts` because browser CORS prevents fetching many image hosts. The signed-in manager's ID token is verified on the server. The image bytes return to the client, which uploads them with the same Storage rules as local files.
- Existing URLs in this app's Storage bucket are reused when editing, avoiding duplicate uploads. The first part image is the cover unless the manager chooses another.

## Validation and failures

- Accept public HTTP or HTTPS URLs only. Check every redirect destination and reject private or local network addresses.
- Accept JPG, PNG, WebP, GIF, or AVIF content up to 5 MB. Fetches time out after 15 seconds.
- If download or Storage upload fails, throw an error so the form stays open and shows the reason. Never save the original external URL as a fallback.
- Storage writes require a manager or super admin under `storage.rules`. Keep the server fetch action gated by the same role claims.

## Verification

Run `npm run typecheck`. In the admin UI at `http://localhost:9002/admin`, add a part with one or more public image links, save it, and confirm its Firestore `imageUrl` and `images` fields contain URLs from this Firebase bucket. Try an invalid URL and confirm the item does not save. Repeat for a prebuilt system.
