# Admin Inventory Dialog Saving State

## Scope

- Add New Component
- Edit Component
- Add New Prebuilt System
- Edit Prebuilt System

## Required Behavior

1. Set a submitting state immediately before persistence begins and clear it in `finally`.
2. Ignore repeated submit attempts while persistence is active.
3. Keep the dialog open while saving by rejecting close state changes and preventing Escape and outside pointer dismissal.
4. Disable Cancel and AI actions while saving.
5. Disable the primary action and show a rotating loader.
6. Use **Saving, please wait** for new records and **Updating, please wait** for existing records.
7. Close the dialog only after persistence succeeds. On failure, retain the form and show the error toast.
8. When AI Autofill cannot verify the exact requested model, keep the part name free of warning prefixes, show a prominent destructive warning, and disable the primary save action. Editing the model name clears the stale warning so the manager can retry verification.

## Verification

- Run `npm run typecheck`.
- Confirm the primary action exposes its busy label and spinner during an asynchronous save.
- Confirm outside click, Escape, Cancel, AI actions, and repeated submit cannot close or alter the dialog during that save.
- Enter a deliberately invalid component model and run AI Autofill. Confirm the warning is visible, the searched name remains clean, and Save Component is disabled.
