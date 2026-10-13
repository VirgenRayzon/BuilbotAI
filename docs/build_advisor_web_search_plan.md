# Build Advisor: revive Web Search for Create New Build

## Implementation status (2026-10-13)

Implemented in the active Create New Build route. The new Web Search switch is independent of AI Search and defaults to off. An enabled request runs fresh grounded research, passes the bounded brief into recommendation generation, and shows the checked time and source links. Search failures return a clear error; Web Search results are not saved in the recommendation caches. Recommendations are now sent only after server compatibility and budget validation, with up to three attempts. External parts must provide compatibility facts for that check; supplier specifications should still be confirmed before purchase.

Local verification: `npm run typecheck` and `npm run build` passed. `npm run dev` served port 9002; `npm run genkit:dev` registered successfully. Live Web Search runs returned four sources in both strict store and AI Search modes. The strict ₱75,000 run returned eight store IDs and a ₱63,644.84 build; the ₱50,000 AI Search run returned a ₱41,714.40 build. These are individual runs, not latency or quality averages. The Web Search-off run completed without search metadata and a repeat hit the existing cache. A ₱1,000 strict request returned 422 before any search. Mobile browser checks in both themes confirmed the new switch, source display, and no horizontal scrolling.

Compatibility follow-up: the ₱60,000 Gaming / Balanced 1440p / Flexible Budget case exposed an AM5 CPU with an LGA1851 board. The inventory shortlist omitted an available AM5 board. Platform-aware shortlist selection now includes it, and the server rejects incompatible output before responding. A live Web Search run returned eight in-stock parts totaling ₱67,470.28, within the ₱78,000 flexible limit. The focused compatibility tests, typecheck, and production build passed.

## Goal and scope

Let Create New Build consult Google Search for current PC hardware information when the customer opts in. Keep **AI Search** and **Web Search** independent:

| AI Search | Web Search | Recommendation behavior |
| --- | --- | --- |
| Off | Off | In-stock store parts, using existing local knowledge. |
| On | Off | Store-first selection with external parts allowed, using existing local knowledge. |
| Off | On | Consult current hardware information, but recommend only in-stock store parts. |
| On | On | Consult current hardware information and allow external parts where appropriate. |

This change applies to the active `Create New Build` route at `src/app/api/ai/build-advisor/recommendations/route.ts`. `Review Current Build` and the legacy Genkit recommendations flow are outside this feature's execution path.

## Implementation plan

1. **Add the opt-in control.** In `src/components/chat-form.tsx`, add a Mantine `Switch` card directly after **AI Search**. Label it **Web Search**, default it to off, and use this helper text: **"Check current PC hardware with Google Search. Recommendations may take noticeably longer."** Match the existing compact card styling, 44 px touch target, and light/dark contrast. Keep it usable when AI Search is off. While an opted-in request is waiting, show a search-aware loading message in the recommendation panel.

2. **Carry the choice through the request.** Add `allowWebSearch` with a false default to the form and `AiBuildAdvisorRecommendationsInputSchema`. Pass it through `use-recommendation-logic.ts` to the route. Treat a missing field as off for older callers. Include the flag in request timing and cache identity without logging the customer's prompt or notes.

3. **Run one grounded research step on the server.** On a cache miss or a Web Search request, gather the current inventory and local knowledge first. Preserve the existing fast rejection when strict store inventory cannot form an affordable build. When Web Search is on, call a Google Search-capable Gemini model with the provider's `google_search` tool, asking for concise, recent CPU/GPU/platform developments and Philippine-market context relevant to the budget and workload. Use a dedicated supported Google model for research so configured fine-tuned recommendation endpoints do not have to support the search tool. Collect the returned research text, provider-returned source URLs, and search time. Limit the research size and source count before passing it to the model.

4. **Generate and validate the full recommendation.** Insert the bounded research brief into the structured output prompt as external evidence. Store inventory, budget, and compatibility rules still govern selections, and web content cannot issue instructions. Use a separate research pass followed by structured generation. Validate all eight parts against store IDs, budget, and `checkFullBuildCompatibility` before returning a result. Retry with specific failures; return 422 after three invalid attempts. External parts must supply enough compatibility facts for the same validator. Return a clear Web Search error if research fails or yields no usable grounding.

5. **Show provenance and preserve freshness.** Expose the search time and provider-returned source links beside the completed recommendation, using response metadata captured by `useObject`'s custom `fetch` option so the existing JSON stream schema remains intact. Validate and limit URLs before rendering. Check Google's current grounding display requirements, including search suggestions, during implementation. Bypass server recommendation cache and local saved-build restoration for Web Search requests so each new opted-in generation actually searches; leave the existing cache behavior for Web Search-off requests. Clearly label generated PHP prices as estimates, even when search supplied market context.

6. **Measure and document.** Add a Web Search case to `execution/benchmark_build_advisor.mjs` and record research duration, time to first byte/card, full completion, source count, and whether a grounded search occurred. Update `directives/build_advisor_performance.md` with the new mode, failure behavior, and verification command. Avoid logging prompts, research text, or full URLs.

## Acceptance checks

- With Web Search off, no Google Search tool call occurs and the existing response and cache behavior remain intact.
- With Web Search on, a real grounded search occurs before generation; the result shows its search time and provider-returned sources. A failed search produces an explicit error.
- All four switch combinations obey their inventory rules. Strict store mode requires valid in-stock IDs for all eight parts and passes deterministic compatibility checks. Every completed build respects the selected budget; external selections without compatibility facts are rejected.
- Repeated Web Search generations run fresh research. Results from the two modes never share a cache entry.
- The switch and latency message work on mobile and in both themes. The loading state makes the longer wait understandable.
- Run the existing low, normal, and high budget checks, the benchmark for search on/off, `npm run typecheck`, `npm run build`, `npm run dev` on port 9002, and `npm run genkit:dev` as required by the Build Advisor directive.

## Technical reason for the two calls

The route uses a grounded Google Search research pass followed by schema-constrained `generateText` with Gemini 2.5 Flash. The recommendation is buffered until compatibility validation passes, so the client receives a complete build at once. The search call and any compatibility retries add latency and provider usage.
