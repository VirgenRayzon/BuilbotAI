# AI feature and interaction inventory

This crosswalk separates mounted user actions from code paths with no current UI import. All claims come from checked-in source inspection on 18 October 2026. The [AI master](ai-master-flowchart.md) links the diagrams.

| Feature | User entry and choices | Processing and output | Diagram |
| --- | --- | --- | --- |
| Floating chatbot | Builder and staff prebuilt builder bubble; message, preset, retry, clear, copy, add part, telemetry | `src/components/chat/hooks/use-floating-chat.ts` → `POST /api/chat` → AI SDK stream and four tools → UI messages and browser history | [Chatbot](ai-chatbot-flowchart.md) |
| Build recommendations | `/ai-build-advisor` Recommendations tab; intended use, goal, budget, flexible budget, AI Search, Web Search; cancel, regenerate, save | `src/components/chat-form.tsx` → `src/app/ai-build-advisor/hooks/use-recommendation-logic.ts` → recommendation POST route → validated eight-part output | [Recommendations](ai-recommendations-flowchart.md) |
| Build critique | `/ai-build-advisor` Critique tab; analyze, cancel, retry, apply suggestion | `src/app/ai-build-advisor/hooks/use-critique-logic.ts` → `getAiBuildCritique` → Genkit flow and cache → critique panel | [Critique](ai-build-critique-flowchart.md) |
| Part detail extraction | Admin part editor AI Autofill; product name, cancel, manual edit, save | `src/hooks/use-part-form.ts` → `getAiPartDetails` → vector retrieval / research / structured extraction → populated form | [Part extraction](ai-part-extraction-flowchart.md) |
| Prebuilt assist | Admin prebuilt editor AI Assist, and staff prebuilt builder Generate; select parts, cancel, edit, save | `src/components/add-prebuilt-dialog.tsx`, `src/hooks/use-build-actions.ts` → `getAiPrebuiltSuggestions` → Genkit flow → populated identity/description | [Prebuilt assist](ai-prebuilt-assist-flowchart.md) |
| Prebuilt performance | Staff prebuilt detail Highlights; generate, re-evaluate, retry; customer read only | `src/app/pre-builts/[id]/hooks/use-prebuilt-details.ts` → `getAiPrebuiltPerformance` → research and structured strengths → Firestore `aiReport` | [Prebuilt performance](ai-prebuilt-performance-flowchart.md) |
| AI model settings | Super Admin AI tab; select model/project, route features, test, register/delete browser project, apply | `src/components/ai-model-settings.tsx` → settings/test server actions → `siteSettings/main` and model resolver | [Settings](ai-settings-flowchart.md) |
| System prompts | Super Admin AI prompts view; select prompt, copy, discard, save current/all, reset current/all | `src/components/ai-system-prompts-settings.tsx`, `src/hooks/use-system-prompts.ts` → prompt server actions → `siteSettings/main` | [Settings](ai-settings-flowchart.md) |
| Smart Budget | Component offers budget/preferences, generate and apply, but no page import found | `src/components/smart-budget.tsx` → `getAiSmartBudget` → Genkit flow | [Unmounted Smart Budget](ai-smart-budget-flowchart.md) |

## Supporting AI decisions and data

| Concern | Evidence | Diagram |
| --- | --- | --- |
| Model routing, default and tuned fallback | `src/lib/ai-model-resolver.ts`, `src/ai/genkit.ts` | [Architecture](ai-architecture-flowchart.md), [errors](ai-error-handling-flowchart.md) |
| Chat tools and conversation context | `src/app/api/chat/route.ts`, `src/components/chat/hooks/use-floating-chat.ts` | [Chatbot](ai-chatbot-flowchart.md), [data](ai-data-processing-flowchart.md) |
| Local knowledge paragraphs | `src/lib/knowledge-retriever.ts`, `src/knowledge/` | [Data](ai-data-processing-flowchart.md) |
| Hardware embeddings and vector records | `src/lib/vector-retriever.ts` | [Data](ai-data-processing-flowchart.md) |
| Exact part web verification | `src/lib/chat-part-specifications.ts` | [Chatbot](ai-chatbot-flowchart.md), [data](ai-data-processing-flowchart.md) |
| Optional advisor web research | `src/lib/advisor-web-research.ts` | [Recommendations](ai-recommendations-flowchart.md) |
| Recommendation validation and retry | `src/lib/validate-advisor-build.ts`, recommendation POST route | [Recommendations](ai-recommendations-flowchart.md), [errors](ai-error-handling-flowchart.md) |
| Critique and recommendation caches | `src/ai/flows/ai-build-critique.ts`, recommendation POST route | [Data](ai-data-processing-flowchart.md) |
| Client progress/ready feedback | `src/components/ai-progress-modal.tsx`, `advisor-job-toast.tsx`, advisor hooks | [Decisions](ai-decision-flowchart.md) |

## Code-present and verification limits

`src/ai/flows/ai-build-advisor-recommendations.ts` and `getAiRecommendations` in `src/app/actions.ts` form a second Genkit recommendation path; the current Recommendations tab calls the HTTP route instead. `SmartBudget` and `PrebuiltBuilderAddDialog` have no discovered page import. They are not presented as currently reachable screens. There is no separate deterministic chat intent classifier, server-side chat history store, or verified live provider configuration in the inspected source. Client cancellation does not establish whether a remote model stopped computing.
