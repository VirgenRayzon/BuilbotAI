# AI data processing and retrieval

## Simple explanation

This flowchart shows how the AI finds and prepares useful information. It can read the current build, product records, or hardware guide data. The data is cleaned and shaped before it is added to the AI request. The AI uses that information to make a more useful answer. The result is then checked before the app displays or saves it.

```mermaid
flowchart TD
  Start([User input]) --> Feature{AI feature}
  Feature -- Chat --> ChatInput[Recent messages plus sanitized build and profile]
  Feature -- Recommendations --> AdvisorInput[Goal, PHP budget, options and notes]
  Feature -- Critique --> BuildInput[Selected components and workload preferences]
  Feature -- Extraction --> PartInput[Requested product name]
  Feature -- Prebuilt --> PrebuiltInput[Selected component names and descriptions]
  ChatInput --> ChatTools{Tool request?}
  ChatTools -- Inventory --> Catalog[(Canonical Firestore inventory)]
  ChatTools -- Guide --> Knowledge[Local Markdown keyword retrieval]
  ChatTools -- Specifications --> Vector[Embed query and search Firestore vector records]
  Vector --> Match{Exact part evidence?}
  Match -- No --> Web[Google Search verification]
  Match -- Yes --> Context[Relevant facts]
  Web --> Context
  Catalog --> Context
  Knowledge --> Context
  AdvisorInput --> Catalog
  AdvisorInput --> Knowledge
  AdvisorInput --> WebOptional{Web Search enabled?}
  WebOptional -- Yes --> Web
  WebOptional -- No --> Context
  BuildInput --> Catalog
  BuildInput --> Knowledge
  PartInput --> Vector
  PrebuiltInput --> Context
  Context --> Prompt[Compose feature prompt and schema]
  Prompt --> Model[Configured Gemini or Vertex model]
  Model --> Validate{Structured output passes checks?}
  Validate -- No --> Error[/Retry or error according to feature/]
  Validate -- Yes --> Result[/Return text, structured object or streamed UI message/]
  Error --> Finish([END])
  Result --> Finish
```

`src/lib/knowledge-retriever.ts` indexes checked-in `src/knowledge/*.md` in memory and ranks paragraphs by keywords. `src/lib/vector-retriever.ts` computes a 768-dimensional Gemini embedding and queries Firestore vector records. The chat specification tool first tries that vector source, then a grounded Google Search response, and rejects a mismatched product (`src/lib/chat-part-specifications.ts`). The advisor's optional web research is a separate Google Search call (`src/lib/advisor-web-research.ts`). Recommendation and critique results can be cached in Firestore; chat messages are stored only in the browser by the current client hook.
