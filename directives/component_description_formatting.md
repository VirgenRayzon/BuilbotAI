# Component Description Formatting

## Goal

Keep component product highlights readable in the inventory editor by storing one Markdown bullet per line.

## Input

Component descriptions from existing Firestore records, manual edits, or AI Autofill.

## Execution

1. Run the description through `normalizeProductDescription` when the form opens.
2. Normalize AI Autofill output before placing it in the description field.
3. Normalize once more immediately before saving.
4. Split only labelled Markdown highlights such as `* **High Airflow**: ...` to avoid changing ordinary emphasis or prose.
5. Store bullets using the standard `- ` Markdown marker.

## Expected output

Each labelled product highlight occupies its own line in the editor and in the saved component record.

## Verification

- Open an older component whose labelled bullets are stored inline.
- Confirm each bullet appears on a separate line without running AI Autofill.
- Save and reopen the component to confirm the normalized layout persists.
