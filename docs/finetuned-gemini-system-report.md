# BuildbotAI Fine-Tuned Gemini Usage and Training Report

**Report date:** November 7, 2026  
**Scope:** Evidence available in the BuildbotAI repository. This report does not inspect the live Google Cloud project, Vertex AI console, Firestore settings, or the private training dataset.

## Executive summary

BuildbotAI is capable of using an already fine-tuned Gemini model deployed behind a Google Vertex AI endpoint. The repository identifies a tuned Model Registry resource and its deployed endpoint, and the runtime can route selected features to that endpoint. The default routing sends the chatbot to the fine-tuned endpoint while the Build Advisor and Prebuilt Advisor use the default Gemini provider, unless Firestore settings override those choices.

The application itself does **not** perform model training. No code in the repository creates a Vertex tuning job, uploads a supervised training dataset, configures epochs or learning rates, or updates model weights. The only tuning-job interaction found is a read-only lookup used to translate a tuned model resource into its inference endpoint. Consequently, the repository proves that a tuned model can be consumed, but it does not reveal what examples were used to train it, the base Gemini model, its tuning method, hyperparameters, evaluation results, or when the tuning job ran.

Much of what may look like "training" at runtime is actually retrieval-augmented generation (RAG), prompt configuration, tool use, and deterministic validation. These mechanisms provide current product facts and enforce PC compatibility without changing Gemini's learned parameters.

## 1. What fine-tuned model is configured

The centralized resolver declares these Google Cloud resources:

- Tuned model resource: `projects/781722135778/locations/us-central1/models/2614243376421142528`
- Deployed inference endpoint: `projects/781722135778/locations/us-central1/endpoints/2302171190132736000`
- Default non-tuned fallback model: `gemini-3.8-flash`

The endpoint is the resource used for generation. If an administrator supplies a Model Registry resource instead, `resolveVertexTunedEndpoint` lists existing Vertex AI tuning jobs and finds the matching `tunedModel.endpoint`. This is endpoint discovery, not training.

The precise base Gemini version used to produce the tuned model cannot be determined from this repository. The `gemini-3.8-flash` identifier describes the current fallback path, not necessarily the tuned model's base model.

## 2. How BuildbotAI uses the tuned endpoint

### Feature-level routing

The application recognizes three routing keys:

| Feature | Code default | Runtime behavior |
|---|---|---|
| Chatbot | Fine-tuned | Streams chat responses and can call inventory, compatibility, bottleneck, knowledge, and part-specification tools. |
| Build Advisor | Default Gemini | Produces structured PC build recommendations and validates them before returning them. |
| Prebuilt Advisor | Default Gemini | Supports prebuilt descriptions and performance/advisor flows. |

The actual active routing can be changed in `siteSettings/main` through `featureModelRouting`. A global `aiModelProvider` is retained as a compatibility fallback when per-feature routing is absent. The selected tuned endpoint is stored as `fineTunedModelId`.

### Authentication and invocation

For tuned inference, the server obtains a Google Cloud OAuth access token from a Firebase/Google service account or Application Default Credentials. It then calls the regional Vertex AI API and targets the configured endpoint. The client never receives the service-account credential.

Both the Vercel AI SDK paths and Genkit paths use the same centralized routing concept:

- Chat and current Build Advisor HTTP routes obtain a model through `getLanguageModelForChat`.
- Genkit flows obtain a provider-qualified model name through `getGenkitModelName` and generally call `safeGenkitGenerate`.

### Reliability fallback

If the endpoint cannot be resolved, authenticated, or invoked, the resolver marks it degraded for 60 seconds and retries or redirects work to the default `gemini-3.8-flash` model. Chat can also restart a failed tuned stream using the default model. This means the user may receive a valid Gemini response even while the tuned endpoint is unavailable.

## 3. What “training” the repository actually performs

### Model weight training: none in this codebase

The repository contains no implementation for:

- creating or starting Vertex AI tuning jobs;
- preparing or uploading supervised examples;
- choosing a base model for tuning;
- setting epochs, adapters, learning-rate multipliers, batch size, or other hyperparameters;
- evaluating or promoting tuned-model versions; or
- continuously learning from user conversations, orders, ratings, or corrections.

The `execution/` directory contains audits, migrations, benchmarks, ingestion, and verification utilities, but no model-training or fine-tuning program. Runtime conversations are therefore inference inputs, not training examples, based on the inspected source.

### External training: confirmed only at the resource level

The presence of a tuned Model Registry ID, an endpoint ID, and tuning-job lookup logic indicates that a tuning job existed or was expected to exist in Vertex AI. However, training provenance is outside the repository. To state what the model was trained on, an authorized reviewer must inspect the associated Vertex AI tuning job and its source dataset in Google Cloud.

The following details are currently unknown:

- base Gemini model and version;
- dataset URI and dataset owner;
- number and format of examples;
- whether examples cover Philippine pricing, compatibility, sales tone, or support conversations;
- training/tuning method and hyperparameters;
- train/validation split and evaluation metrics;
- tuning date, model version history, and approval record;
- treatment of personal or customer data.

## 4. Runtime specialization that is not fine-tuning

BuildbotAI adds domain behavior around the model in several ways:

1. **System prompts.** Prompts for chatbot, Build Advisor, Prebuilt Advisor, and part extraction are loaded from Firestore with checked-in defaults. Administrators can edit these instructions without changing model weights.
2. **Hardware vector retrieval.** Queries are embedded into 768 dimensions with `gemini-embedding-001`, then compared with Firestore hardware records by cosine similarity. Retrieved specifications are inserted into the model's context. Creating an embedding or querying a vector index is not model training.
3. **Local knowledge retrieval.** Checked-in Markdown guides are searched and relevant passages are supplied to the model.
4. **Live inventory grounding.** The chatbot and advisor receive current catalog records, IDs, prices, and availability rather than relying only on model memory.
5. **Optional Google Search grounding.** Exact part specifications or advisor research can fall back to grounded web search when local evidence is insufficient.
6. **Deterministic compatibility checks.** Application code validates sockets, RAM generations, form factors, clearances, wattage, integrated graphics, budgets, and inventory IDs. Invalid generated builds are rejected and the advisor can retry with explicit error feedback.
7. **Structured schemas.** Zod and AI SDK structured output constrain generated objects to the fields expected by the application.

These techniques can make the system behave like a specialized PC-building assistant, even when the request is served by the untuned fallback model.

## 5. Data flow and learning boundary

```text
User request
  -> feature routing from Firestore
  -> tuned Vertex endpoint OR default Gemini
  + system prompt
  + retrieved hardware/inventory/knowledge/search context
  + deterministic tools and validators
  -> checked or streamed response
```

No arrow in the inspected application sends the resulting conversation back into a tuning dataset or updates the deployed model. Any future continuous-learning process would need an explicit, separately governed pipeline for consent, redaction, labeling, dataset versioning, tuning, evaluation, and deployment.

## 6. Risks and verification gaps

- **Training transparency:** The application labels the endpoint as fine-tuned, but the repository cannot establish its dataset, base model, or quality.
- **Runtime configuration:** Source code shows defaults and supported paths; only live Firestore and Vertex inspection can prove which route is currently active.
- **Fallback masking:** Automatic fallback improves availability but can make it difficult to tell whether a response came from the tuned endpoint unless logs/telemetry are reviewed.
- **Model evaluation:** Benchmarks exist for some AI features, but no tuned-versus-default evaluation report or promotion threshold was found.
- **Data governance:** Because the tuning dataset is not versioned or documented here, privacy, licensing, accuracy, and retention cannot be audited from the repository.
- **Documentation drift:** Existing architecture documentation mentions `gemini-2.5-flash` in prose, while the current resolver and Genkit configuration use `gemini-3.8-flash` as the default. The source code is authoritative for this report.

## 7. Recommended evidence to collect from Vertex AI

To complete a formal model card or compliance report, export the following from the Google Cloud project:

1. The tuning job details linked to model `2614243376421142528`.
2. Base model name/version and tuning method.
3. Training and validation dataset URIs, schemas, sizes, ownership, and redaction policy.
4. Hyperparameters and job start/completion timestamps.
5. Evaluation metrics, test set, failure categories, and comparison with the default Gemini model.
6. Endpoint deployment version, traffic split, access policy, logging, and monitoring configuration.
7. A statement confirming whether customer conversations or personal data were used.

Until those records are reviewed, the accurate statement is: **BuildbotAI consumes a configured Vertex AI tuned endpoint, but this repository neither performs nor documents the model's training.**

## Source evidence

- `src/lib/ai-model-resolver.ts` — resource IDs, feature routing, OAuth, provider construction, degradation circuit breaker, and default fallback.
- `src/lib/vertex-tuned-endpoint.ts` — read-only tuning-job lookup and endpoint resolution.
- `src/app/api/chat/route.ts` — chatbot routing, prompts, tools, grounding, and tuned-stream fallback.
- `src/app/api/ai/build-advisor/recommendations/route.ts` — Build Advisor routing, structured generation, compatibility validation, and retries.
- `src/ai/genkit.ts` — Google AI and Vertex AI Genkit providers and default model.
- `src/lib/vector-retriever.ts` — `gemini-embedding-001`, 768-dimensional embeddings, and Firestore cosine search.
- `src/lib/knowledge-retriever.ts` — local Markdown knowledge retrieval.
- `src/lib/system-prompts.ts` and `src/app/actions.ts` — Firestore-backed prompt and model settings management.
- `directives/ai_model_routing.md` — expected tuned-model endpoint handling and verification procedure.
- `execution/` — inspected for training-related programs; none were found.
