# AI model routing and tuned Vertex projects

## Goal

Keep the selected fine-tuned project, the saved inference endpoint, and the model used by chat aligned.

## Resource handling

- A Vertex tuning job exposes both a Model Registry resource (`projects/.../models/...@version`) and an inference endpoint (`projects/.../endpoints/...`). `generateContent` for a tuned Gemini model requires the endpoint.
- When an admin supplies a model resource, use the authenticated Vertex tuning jobs API to find the matching job and its `tunedModel.endpoint`. Never rewrite a tuned model ID as `publishers/google/models/...`.
- Test the resolved endpoint before applying settings. Save the endpoint as `fineTunedModelId` and on the active project. The server-side save result must be checked before showing success.
- Use one server Firestore write. The client snapshot supplies reactivity; a second client write can replace the resolved endpoint with the original model resource.

## Verification

1. Select the new project and run **Test Vertex AI Endpoint**. A successful response must come from the resolved endpoint.
2. Apply AI settings, reload `/admin?tab=ai` on port 9002, and confirm that the project remains active and its stored resource is an endpoint.
3. Run `npm run typecheck` and `npm run lint`.
