# AI choices and conditional paths

```mermaid
flowchart TD
  Start([AI feature action]) --> Role{Feature and role allowed in UI?}
  Role -- No --> Denied[/Hidden or disabled control; restricted feedback/]
  Role -- Yes --> Kill{AI kill switch or maintenance state?}
  Kill -- Active --> Paused[/Disabled or maintenance error/]
  Kill -- Off --> Input{Required input complete?}
  Input -- No --> Validate[/Form, missing-part or budget error/]
  Input -- Yes --> Mode{Feature choice}
  Mode -- Advisor AI Search off --> Store[Only store inventory and part IDs]
  Mode -- Advisor AI Search on --> Hybrid[Store-first plus external model suggestions]
  Mode -- Web Search on --> Research[Fresh grounded research; bypass recommendation cache]
  Mode -- Chat named part --> Vector[Vector exact match; web verification fallback]
  Mode -- Staff AI assist --> Fill[Generate and apply supported fields]
  Store --> Model{Configured model available?}
  Hybrid --> Model
  Research --> Model
  Vector --> Model
  Fill --> Model
  Model -- Tuned endpoint fails --> Default[Fallback to default Gemini]
  Model -- Yes --> Result{Response valid?}
  Default --> Result
  Result -- No --> Retry{Retry implemented for this feature?}
  Retry -- Yes --> Model
  Retry -- No --> Error[/Error state or toast/]
  Result -- Yes --> Output[/Render, cache or save result/]
  Output --> UserChoice{Save, apply, regenerate, or dismiss?}
  UserChoice -- Save or apply --> Mutation[Favorite, catalog field or prebuilt report write]
  UserChoice -- Regenerate --> Model
  UserChoice -- Dismiss --> End([Return to parent workflow])
```

This is a cross-feature decision map, not a claim that every feature has every branch. Recommendation generation has up to three server validation attempts; critique and extraction use Genkit model fallback; chat has tuned stream fallback. The advisor offers separate AI Search and Web Search toggles (`src/components/chat-form.tsx`). Customer AI and staff AI controls read a site kill switch, while some server flows also check maintenance (`src/context/site-settings-context.tsx`, feature hooks, `src/app/api/ai/build-advisor/recommendations/route.ts`, `src/ai/flows/ai-build-critique.ts`). Client cancellation may abandon the local result; it does not prove the server model request was terminated. Feature diagrams show the exact branches.
