# AI build critique

```mermaid
flowchart TD
  Start([Customer opens Critique tab or Analyze Build]) --> Build[Load selected builder state and workload/resolution]
  Build --> Complete{Enough build context?}
  Complete -- No --> Missing[/Missing-part or incomplete-build feedback/] --> Build
  Complete -- Yes --> Kill{AI disabled?}
  Kill -- Yes --> Disabled[/Disabled toast/]
  Kill -- No --> Call[Call getAiBuildCritique server action]
  Call --> Maintenance{Maintenance setting?}
  Maintenance -- Yes --> Error[/Action error; Try Again shown/]
  Maintenance -- No --> Cache{Fresh critique cache and not forced?}
  Cache -- Yes --> Result[/Show cached pros, cons and suggestions/]
  Cache -- No --> Gather[Fetch local knowledge, inventory and model]
  Gather --> Generate[Genkit structured critique]
  Generate --> Valid{Output present and schema valid?}
  Valid -- No --> Error
  Valid -- Yes --> CacheWrite[Schedule or perform Firestore cache write] --> Result
  Result --> Choice{Refresh, apply suggestion, or cancel?}
  Choice -- Refresh --> Call
  Choice -- Apply --> Event[Dispatch part suggestion to builder] --> Build
  Choice -- Cancel --> Cancel([Stop local pending result])
  Error --> Choice
```

The advisor page controls critique in `src/app/ai-build-advisor/hooks/use-critique-logic.ts`; `src/components/ai-build-critique.tsx` renders the analysis and retry controls. The server flow is `src/ai/flows/ai-build-critique.ts`, wrapped by `getAiBuildCritique` in `src/app/actions.ts`. Its Firestore cache collection is `ai_critique_cache_v1`. A cancelled client request does not establish remote cancellation.
