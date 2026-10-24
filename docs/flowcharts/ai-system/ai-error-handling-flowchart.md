# AI error handling

```mermaid
flowchart TD
  Start([AI request]) --> Failure{Failure type}
  Failure -- Invalid input or missing parts --> Input[/Form or toast error; no request or early return/]
  Failure -- AI disabled or maintenance --> Disabled[/Disabled UI or 503/error response/]
  Failure -- No model credentials --> Credentials[/Server error returned to UI/]
  Failure -- Tuned endpoint unavailable --> Fallback{Default Gemini retry available?}
  Fallback -- Yes --> Default[Mark tuned model degraded; invoke default]
  Fallback -- No --> Error[/Error to caller/]
  Failure -- Network or chat stream --> ChatError[/Chat error toast and retry/]
  Failure -- Advisor invalid output --> Validate{Attempt under three?}
  Validate -- Yes --> Retry[Append exact validation failures; regenerate] --> Result{Now valid?}
  Result -- Yes --> Success([Show build])
  Result -- No --> Validate
  Validate -- No --> AdvisorError[/422; no invalid build displayed or cached/]
  Failure -- Web research unavailable --> WebError[/502; retry or disable Web Search/]
  Failure -- Empty Genkit output --> Empty[/Action error, toast or error panel/]
  Failure -- Client cancel --> Cancel([Stop local pending display; ignore stale result])
  Default --> Result
  Error --> End([Remain on current feature])
  Input --> End
  Disabled --> End
  Credentials --> End
  ChatError --> End
  AdvisorError --> End
  WebError --> End
  Empty --> End
```

The server action wrappers use a three-minute timeout and convert several errors into response objects (`src/app/actions.ts`). The advisor validates output after generation and retries up to three times; its `ReadableStream` does not stream model tokens (`src/app/api/ai/build-advisor/recommendations/route.ts`). Chat has a specific tuned stream fallback and a client Retry action (`src/app/api/chat/route.ts`, `src/lib/chat-stream-fallback.ts`, `src/components/chat/hooks/use-floating-chat.ts`). The exact behavior of a remote model request after client cancellation cannot be verified from static code.
