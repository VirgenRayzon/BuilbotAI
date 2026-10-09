# Build Advisor performance plan

## Implementation status (2026-10-09)

- Added server stage timing, a streaming benchmark, and a fixed critique benchmark. Create New Build also logs client time to its first partial object and first component card.
- Ran knowledge, inventory, and model setup concurrently. Advisor inventory prompts omit image URLs and now use a budget-bound, in-stock shortlist. For the configured Gemini 2.5 Flash path, recommendation generation uses a zero thinking budget.
- Moved cache writes after the response with Next's `after` in the active route and server action. Cache keys now cover full prompt/input details and model settings; stock-dependent entries have shorter TTLs. Admins can later provide `advisorInventoryRevision` for explicit invalidation.
- Review Current Build shows compatibility, balance, and an approximate FPS baseline while its full AI review is running. The full six-game estimates and written critique still come from Genkit.
- Strict Create New Build results require eight store IDs and are checked against actual store prices, stock, budget, and compatibility before server caching. The client rejects invalid completed results. Very low budgets with no feasible inventory receive a clear error.

Local sample observations: one cold strict recommendation took 7.2 seconds to finish, with its first response byte at 3.9 seconds; a cache hit took about 1.1 seconds. The review UI showed initial checks in 0.46 seconds and completed its cold AI review in 10.9 seconds. These are individual development runs, not p50/p95 or production comparisons. `npm run typecheck`, `npm run build`, and both development servers completed successfully.

Remaining work: collect production p50/p95 over representative traffic; evaluate cache revision updates on every inventory mutation; and consider request coalescing and true server-side cancellation for review. The current review cancel control still stops the local UI response only.

## Scope and current path

The page at `src/app/ai-build-advisor/page.tsx` has two independent paths.

- **Review Current Build:** `use-critique-logic.ts` calls the `getAiBuildCritique` server action, which runs `ai-build-critique.ts`. The flow checks maintenance mode and a seven-day Firestore cache, computes compatibility, bottleneck, and FPS baselines, retrieves knowledge and inventory, then waits for one structured Genkit response. It writes the cache before returning. The UI receives no analysis until that response is complete.
- **Create New Build:** `use-recommendation-logic.ts` calls `/api/ai/build-advisor/recommendations`. The route checks maintenance mode, loads the system prompt and seven-day cache, fetches knowledge and up to five inventory items in each of eight categories, resolves the model, then starts an AI SDK `streamObject` response. `BuildSummary` already renders partial components while streaming. The separate Genkit recommendations flow is a legacy path used by the server action, not this page's active creation path.

These are code-path findings, not measured latency results. No production or local model timings were available for this review.

## Likely latency sources

1. **Serial preflight reads before generation.** Both paths read `siteSettings/main` for maintenance and can read it again for prompt or model routing. Cache lookup and model resolution add more awaited work. On a cache miss, the model cannot start until this preflight finishes.
2. **Inventory and prompt volume.** Both paths fetch eight category lists. The inventory formatter includes image URLs even though the model does not need them to choose parts. Review also sends product descriptions and four knowledge sections; its schema asks the model for pros, cons, a bottleneck explanation, six game estimates, and suggestions.
3. **Review blocks on one large response.** Deterministic compatibility, bottleneck, and FPS values are computed before the model call, but users wait for the narrative and full structured JSON. The cache write is also awaited before the action returns.
4. **Cache hit and correctness limits.** The server caches final answers for seven days, but recommendation keys use only the first 32 characters of the prompt as a signature and do not track inventory changes. Review's client cache key excludes additional notes; its server key uses model names but not prices or specifications. Cache changes should fix these identities before increasing reuse.
5. **Cancellation in review is local.** The hook aborts a controller after starting a server action, but that signal is never passed to the action or model call. Cancelled requests can keep consuming model capacity.

## Implementation sequence

### 1. Measure and remove preflight delay

- Add per-request timing spans for maintenance/settings, prompt resolution, cache lookup, knowledge retrieval, inventory retrieval, model resolution, first response byte or first partial object, model completion, and cache write. Record model ID, cache hit, input/output tokens when available, and payload size. Do not log private notes or full prompts.
- Measure cold and warm runs for both tabs with the same representative inputs. Track p50 and p95 time to first useful result and full completion separately. Include cache-hit runs and a strict-inventory case.
- Reuse one settings snapshot for maintenance, prompt, and model routing where practical. Preserve an authoritative maintenance check before calling the model. Run independent cache and context work concurrently, and avoid resolving the model until a cache miss is known.
- Move final cache writes off the response's critical path where runtime guarantees allow it; verify the write still completes reliably.

### 2. Shrink model work without losing safeguards

- Remove image URLs and redundant fields from inventory text sent to the model. Rank a small compatible, budget-aware candidate set from structured inventory instead of taking arbitrary first five items per category. Keep a deterministic post-generation check for stock, compatibility, and budget.
- Cap and select review product highlights and knowledge sections by relevance. Keep full raw data for deterministic checks but send only needed facts to the model.
- Produce review FPS estimates from the existing deterministic estimator and choose the six games by workload in code. Ask the model for explanation and meaningful alternatives only. Show compatibility, bottleneck, and FPS facts immediately, then fill in narrative when ready.
- Benchmark a shorter output schema and available configured models using the same quality cases. Choose based on total latency, cost, and pass rates rather than model speed alone.

### 3. Make reuse and streaming reliable

- Use stable hashes of normalized inputs, active prompt revision, model, and inventory revision for cache keys. Include review notes and relevant part prices/specifications. Invalidate stock-dependent results when inventory changes; keep an explicit TTL for external-market estimates.
- Coalesce concurrent identical requests so one model call serves repeated clicks. Keep access boundaries and cancellation behavior explicit.
- Keep Create New Build's partial component rendering and improve the time to its first card. For Review Current Build, use a streaming endpoint or staged result so deterministic findings appear before AI prose. Wire cancellation through to the server/model where supported.
- Confirm that a cached recommendation uses the same stream format as a fresh one and that partial, failed, and cancelled runs do not overwrite a complete cached result.

## Acceptance checks

- Set a target from the baseline: initially aim to cut cache-miss p95 time to first useful result by at least 50% and full completion by at least 30%, without increasing invalid builds or critical compatibility misses.
- Test both tabs with low/normal/high budgets, sparse inventory, strict versus AI Search mode, different notes, light/dark UI, cache hit/miss, cancellation, and model fallback.
- Require generated builds to match stock rules, remain within the selected budget mode, and pass deterministic compatibility checks. Compare review findings and FPS estimates against the current behavior before replacing model-generated sections.

## Priority

Start with timing and the first settings/cache/preflight refactor. The largest likely user-visible improvement comes from exposing review's deterministic results early and reducing prompt/output size. Candidate selection and cache identity need careful validation because they affect recommendation quality and freshness.
