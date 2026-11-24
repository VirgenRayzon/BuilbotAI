# AI prebuilt performance report

## Simple explanation

This flowchart shows how an AI report is made for a ready-made PC. The system collects the PC’s parts and checks that enough information is present. The AI reviews likely uses, strong points, weak points, and expected results. Staff can make the report again when the build changes. A finished report can be saved with the ready-made PC and shown on its product page.

```mermaid
flowchart TD
  Start([Open prebuilt detail]) --> Role{Staff profile?}
  Role -- No --> Read[/View previously published AI report or empty state/]
  Role -- Yes --> Generate{Generate, re-evaluate, or retry?}
  Generate -- No --> Read
  Generate -- Yes --> Parts[Build input from resolved component names, brands and prices]
  Parts --> Call[Call getAiPrebuiltPerformance]
  Call --> Research[Genkit Google Search pre-research]
  Research --> Structured[Genkit structured strengths output]
  Structured --> Valid{Output present and call succeeds?}
  Valid -- No --> Error[/Analysis error and Try Again control/] --> Generate
  Valid -- Yes --> Save{Firestore prebuiltSystems aiReport update succeeds?}
  Save -- No --> Error
  Save -- Yes --> Result[/Render and publish strengths; success toast/]
  Result --> Generate
  Read --> Finish([END])
  Generate -- Leave page --> Finish
```

Only staff sees the generate and re-evaluate controls (`src/app/pre-builts/[id]/hooks/use-prebuilt-details.ts`, `components/prebuilt-ai-review.tsx`). The report is stored on the prebuilt document after successful generation. The server wrapper and flow are `getAiPrebuiltPerformance` in `src/app/actions.ts` and `src/ai/flows/ai-prebuilt-performance.ts`. The prompt requests strengths only; it does not perform a balanced critique. Customer reservation and customization are separate [prebuilt workflows](../prebuilts-flowchart.md).
