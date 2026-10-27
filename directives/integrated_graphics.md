# Included Integrated Graphics

## Rule

A CPU whose explicit `Integrated Graphics` specification is affirmative (or names its graphics) supplies a virtual GPU in the builder's GPU slot. For older CPUs without that field, use only recognized model families; an explicit negative specification wins. The virtual GPU has ID `included-integrated-gpu`, price ₱0, no separate stock, and a link to its CPU. It counts as one of eight required categories. A dedicated GPU replaces it. Removing the virtual GPU also removes its CPU; removing or changing the CPU updates the virtual GPU while preserving any dedicated card.

Apply this to the customer Builder, manager Prebuilt Builder, and Add/Edit Prebuilt forms. Add Part saves the CPU graphics specification rather than creating a GPU inventory document. Prebuilt resolvers, PDF export, reservations, cancellation, and AI analysis must derive the virtual GPU from the CPU and never treat it as a stocked graphics card.

## Verification

- Select an integrated-graphics CPU and confirm CPU plus GPU reads 2 / 8 and total price includes ₱0 for the GPU.
- Replace with a dedicated GPU, switch CPUs, remove the included GPU, refresh, and reload a favorite or prebuilt on both builder routes.
- Save a prebuilt and confirm the GPU is displayed and reservable without GPU stock movement. Download a customer build PDF.
- Confirm analyzer labels conservative integrated graphics estimates and the AI advisor can return the virtual GPU only with a qualifying CPU.
- Run `npm run typecheck`, `npm run lint`, `npm run build`, and relevant focused tests.

## Lesson learned

The previous GPU slot counted selected parts correctly, but inventory-based resolution, checkout, PDF export, and advisor validation rejected synthetic GPU IDs. A virtual part must be recognized and verified at every read and write boundary; changing only builder state is insufficient.
