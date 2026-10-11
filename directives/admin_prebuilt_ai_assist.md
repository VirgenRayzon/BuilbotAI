# Admin Prebuilt AI Assist

## Goal

Generate a concise prebuilt product description from the saved descriptions of every selected inventory component without redundant market research.

## Inputs

- Selected inventory component names
- Exact sum of the selected inventory item prices when available
- Saved product highlights for every selected inventory item
- Optional requested tier
- The configured `prebuiltAdvisor` model

## Eligibility

Keep **AI Assist** disabled until the build contains a CPU, motherboard, GPU, cooler, power supply, case, at least one RAM module, and at least one storage drive. The storage requirement accepts either NVMe or SATA. Repeat this validation inside the action handler so stale UI state cannot start an incomplete request.

## Execution

1. Resolve the active model.
2. Make one structured Genkit generation call whose only required output is `description`.
3. Disable Gemini thinking and allow enough output capacity to avoid partial structured responses.
4. Use bounded product descriptions from the local inventory as the sole factual source. Allow up to 900 characters for CPU, GPU, and motherboard descriptions and 280 characters for other categories.
5. Replace the current prebuilt description when AI Assist succeeds, including while editing an existing prebuilt.
6. Keep component compatibility enforcement deterministic in the form.
7. In the manager Prebuilt Builder, require a user-provided prebuilt name before starting AI generation. Preserve that exact trimmed name, generate the description from all selected parts' saved descriptions, and use the calculated component total as the catalog price.

## Performance Constraint

Do not add a separate Google Search pricing call before structured generation. It previously made AI Assist perform two model calls in sequence and produced a measured 45.6-second turnaround. The single-call path completed in 6.3 seconds during local verification.

## Verification

- Run `npm run typecheck`.
- Open `http://localhost:9002/admin?tab=prebuilts`.
- Select at least one component and run **AI Assist**.
- Confirm the request completes, the current description is replaced, and the turnaround indicator is shown.
- In `http://localhost:9002/admin/prebuilt-builder`, complete a build and click **Add New Prebuilt**. Confirm the name dialog blocks blank submissions and a valid name starts generation.
- Expand the saved prebuilt card and confirm every selected component resolves from the canonical `inventory/{category}/items/{id}` path. Retain a legacy collection fallback for older records.
