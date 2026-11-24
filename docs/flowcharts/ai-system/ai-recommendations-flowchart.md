# AI Build Advisor recommendations

## Simple explanation

This flowchart shows how the Build Advisor suggests a new PC. The user chooses what the PC is for and enters a budget. The user may also allow a wider budget, AI search, or web search. The server asks the AI for a full set of parts and checks the answer before returning it. The user can review the total, retry the request, or save a good result.

```mermaid
flowchart TD
  Start([Customer opens Recommendations tab]) --> Form[/Intended use, goal, PHP budget, flexible budget, AI Search, Web Search/]
  Form --> Valid{Zod form and budget parse valid?}
  Valid -- No --> FormError[/Field or budget error; stay on form/] --> Form
  Valid -- Yes --> Disabled{AI disabled?}
  Disabled -- Yes --> DisabledToast[/Disabled toast/] --> Form
  Disabled -- No --> Post[POST api/ai/build-advisor/recommendations]
  Post --> Maintenance{Maintenance flag?}
  Maintenance -- Yes --> ServiceError[/503 error/]
  Maintenance -- No --> Cache{Web Search off and fresh cache hit?}
  Cache -- Yes --> Output[Return cached validated build]
  Cache -- No --> Gather[Fetch local knowledge, inventory and model routing]
  Gather --> Strict{AI Search disabled and store cannot fill budget?}
  Strict -- Yes --> Unavailable[/422; suggest AI Search or higher budget/]
  Strict -- No --> Web{Web Search enabled?}
  Web -- Yes --> Research{Grounded research succeeds?}
  Research -- No --> WebError[/502; retry or turn Web Search off/]
  Research -- Yes --> Generate[Generate structured eight-part build]
  Web -- No --> Generate
  Generate --> Check{Budget, IDs and compatibility valid?}
  Check -- No, attempts remain --> Feedback[Append validation failures] --> Generate
  Check -- No, three attempts used --> Invalid[/422; no invalid build shown/]
  Check -- Yes --> Output
  Output --> Match[Client matches store parts and fills supporting descriptions]
  Match --> ClientValid{Client build usable?}
  ClientValid -- No --> ClientError[/Error toast; try again/]
  ClientValid -- Yes --> Result[/Show summary, parts, price and optional research sources/]
  Result --> Choice{Save, regenerate, cancel or leave?}
  Choice -- Save --> Favorite[Write users UID favorite]
  Choice -- Regenerate --> Post
  Choice -- Cancel --> Cancel([Stop local pending state])
  Choice -- Leave --> End([Other route])
  ServiceError --> Finish([END])
  Unavailable --> Finish
  WebError --> Finish
  Invalid --> Finish
  ClientError --> Finish
  Favorite --> Finish
  Cancel --> Finish
  End --> Finish
```

The form persists draft fields in browser local storage. Non-web responses may be cached both by the server and client; Web Search requests bypass that reuse. The server result is complete before its stream wrapper sends JSON. Sources: `src/components/chat-form.tsx`, `src/app/ai-build-advisor/hooks/use-recommendation-logic.ts`, `src/app/api/ai/build-advisor/recommendations/route.ts`, `src/lib/validate-advisor-build.ts`, `src/components/build-summary.tsx`, `src/lib/advisor-web-research.ts`.
