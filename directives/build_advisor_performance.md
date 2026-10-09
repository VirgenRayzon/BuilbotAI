# Build Advisor performance and quality checks

## Goal

Keep both Build Advisor paths responsive while preserving budget, stock, and compatibility rules. The active Create New Build path is `src/app/api/ai/build-advisor/recommendations/route.ts`; Review Current Build uses `src/app/actions.ts` and `src/ai/flows/ai-build-critique.ts`.

## Intended-use priorities

Create New Build asks for a workload-specific priority after Intended Use. The choices and their model-facing guidance live in `src/lib/build-advisor-goals.ts`. The form sends the chosen guidance as `performanceLevel`; it is also part of the server cache key and local knowledge query. Reset the priority when Intended Use changes, and reject a priority that does not belong to the selected use. Keep each goal concrete enough to influence CPU, GPU, RAM, and storage tradeoffs without adding another model request.

## Local verification

1. Start `npm run dev` on port 9002. Start `npm run genkit:dev` to verify Genkit flow registration.
2. Run `node execution/benchmark_build_advisor.mjs Gaming 30000 "1080p gaming"` for a strict inventory miss, then repeat for a cache hit. Run `node execution/benchmark_build_advisor.mjs Gaming 50000 "1080p gaming" search` for AI Search mode. The benchmark prints timing and aggregate validation only.
3. Run `npx --no-install tsx execution/benchmark_build_critique.ts` for a fixed review case. `tsx` uses CommonJS in this project, so benchmark scripts must use an async `main()` rather than top-level `await`.
4. Run `npm run typecheck` and `npm run build`. Verify the UI with the provided test account on `http://localhost:9002/ai-build-advisor` in both themes.

## Checks before accepting a speed change

- Measure cold time to first byte or useful result and full completion separately. Read `[Build Advisor Timing]` log records for settings, cache, context/model, and model completion. Do not log prompts, user notes, or generated text.
- For strict inventory mode, verify eight non-empty store IDs, current stock, actual total within the selected budget mode, and no critical compatibility issues. A budget below the minimum inventory total should return a clear error without a model call.
- Confirm cache hits use the same response format as fresh streams. Only validated complete results may be cached. Stock-dependent caches have short TTLs; an explicit `advisorInventoryRevision` in `siteSettings/main` changes the recommendation cache key when maintained by inventory mutations.
- Next's `after` requires a request scope. The HTTP route and server action schedule writes there; direct CLI critique calls await cache writes instead.
- The review Stop button currently cancels local waiting only. In a local Next.js test, aborting a browser fetch did not abort Genkit through `Request.signal` or a streamed response's `cancel()` callback; the model still completed. Do not claim server cancellation without a separately verified shared cancellation mechanism.
- If changing model thinking settings, schemas, or candidate ranking, rerun low, normal, and high budget cases and compare quality as well as timing. A faster invalid build is a regression.
