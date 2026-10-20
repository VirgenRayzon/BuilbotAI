# Floating chatbot workflow

The builder and staff prebuilt builder mount the floating chat (`src/components/builder-floating-chat.tsx`, `src/app/builder/builder-page.tsx`, `src/app/admin/prebuilt-builder/page.tsx`).

```mermaid
flowchart TD
  Start([Open chat bubble]) --> History{Saved browser history?}
  History -- Yes --> Restore[Restore messages and telemetry from local storage]
  History -- No --> Welcome[Show welcome and preset prompts]
  Restore --> Compose[/Type message or choose preset/]
  Welcome --> Compose
  Compose --> Client{Nonempty, not loading, AI enabled?}
  Client -- No --> Feedback[/Ignore empty or show disabled feedback/] --> Compose
  Client -- Yes --> Context[Snapshot profile and sanitized current build]
  Context --> Post[POST messages, profile and build to api/chat]
  Post --> Server{Message array present?}
  Server -- No --> Bad[/HTTP validation error/]
  Server -- Yes --> Prompt[Read configured system prompt and model routing]
  Prompt --> Recent[Convert recent messages; inject profile/build context]
  Recent --> Tools{Model calls tool?}
  Tools -- Build analysis --> Analyze[Compatibility, bottleneck and power assessment]
  Tools -- Inventory --> Inventory[Search in-stock compatible catalog]
  Tools -- Guides --> Guides[Retrieve local Markdown knowledge]
  Tools -- Named part specs --> Specs[Vector exact match, else verified Google Search]
  Tools -- No tool --> Stream[Stream assistant response]
  Analyze --> Stream
  Inventory --> Stream
  Guides --> Stream
  Specs --> Stream
  Stream --> Outcome{Stream succeeds?}
  Outcome -- Yes --> Render[Render text, product cards and tool status; save history]
  Outcome -- Fine-tuned failure --> Fallback[Mark endpoint degraded; retry default Gemini]
  Fallback --> Outcome
  Outcome -- Other error --> Error[/Network or service toast; retry available/]
  Render --> Follow{Next action}
  Follow -- Follow-up --> Compose
  Follow -- Copy --> Copy[Copy answer] --> Follow
  Follow -- Add part --> Add[Dispatch builder suggestion event] --> Follow
  Follow -- Clear --> Clear[Clear browser chat history] --> Welcome
  Error --> Retry{Retry or close?}
  Retry -- Retry --> Post
  Retry -- Close --> End([Chat closed])
```

The client invokes `useChat` and persists `pc_chat_history_v2` and telemetry in local storage. The server route offers `analyzeCurrentBuild`, `searchInventory`, `queryCompatibilityGuides`, and `queryPartSpecifications`; the model decides whether to call them. There is no separate deterministic intent classifier in the route. Sources: `src/components/chat/hooks/use-floating-chat.ts`, `src/components/chat/`, `src/app/api/chat/route.ts`, `src/lib/chat-part-specifications.ts`, `src/lib/chat-stream-fallback.ts`.
