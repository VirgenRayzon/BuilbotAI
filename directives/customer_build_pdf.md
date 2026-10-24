# Customer build PDF export

## Goal

Let a signed-in customer download the current PC build once all eight core categories have a selection. Include every selected core part and accessory, its catalog cover image and specifications, individual price, and the total in Philippine pesos.

## Implementation rules

1. Show the action only in the customer `Your Build` menu. Keep it disabled until Motherboard, CPU, GPU, RAM, Storage, PSU, Cooler, and Case are selected.
2. Verify customer role and required categories again in the download route. Read names, prices, specifications, and cover images from the live catalog so the PDF does not trust local browser state.
3. Load product images only from this project's Firebase Storage buckets. Allow the bundled stock cooler image from the local placeholder library.
4. Limit the PDF strictly to 1 page on standard North American Letter paper size (612 x 792 pt). Dynamically size component rows and extract curated technical specifications so the complete build fits into exactly 1 sheet of paper without global scale shrinking.

## Verification and troubleshooting

1. Run `npm run typecheck`, `npm run lint`, and `npm run build`.
2. In a customer session, confirm the action is disabled at 0/8 and downloads a PDF at 8/8. Render the first and last pages to inspect images, text, and page breaks.
3. Check that the manager builder does not show the action and the API rejects staff tokens.
4. Do not run `next build` while `next dev` is serving the same `.next` directory. The production build can replace development manifests and make the live server fail until it is restarted.
