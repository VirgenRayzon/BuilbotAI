# Admin Prebuilt Pricing

## Rule

The Add/Edit Prebuilt dialog price is derived from the selected inventory components and is not manually entered.

## Calculation

Sum the current inventory price for:

- CPU
- Motherboard
- GPU
- Cooler
- Power supply
- Case
- Every selected RAM entry
- Every selected NVMe or SATA storage entry

Round the total to two decimal places. Recalculate after form initialization and whenever a component selection changes. Keep the price input read only and submit the calculated value with the prebuilt.

## Verification

- Run `npm run typecheck`.
- Open an existing prebuilt and confirm its total appears immediately, even when the previously saved price was zero.
- Change a selected component and confirm the total updates without AI Assist or manual entry.
