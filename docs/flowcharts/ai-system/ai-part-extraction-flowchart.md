# AI part detail extraction and autofill

## Simple explanation

This flowchart shows how staff can fill a part form with AI help. Staff enter basic product details and ask the AI to find the missing fields. The system first looks for useful hardware guide data and may use web research when needed. The suggested name, price, description, and details are placed into editable fields. Staff must review the values before saving the part.

```mermaid
flowchart TD
  Start([Manager opens part editor]) --> Input[/Enter exact product name/]
  Input --> Action{Autofill requested and AI enabled?}
  Action -- No --> Form[Continue manual editor]
  Action -- Yes --> Validate{Part name present?}
  Validate -- No --> Feedback[/Toast; remain in editor/] --> Input
  Validate -- Yes --> Call[Call getAiPartDetails]
  Call --> Vector[Embed query; search hardware vector collection]
  Vector --> Found{Grounded result?}
  Found -- Yes --> Context[Use vector context]
  Found -- No --> Research[Genkit Google Search pre-research]
  Context --> Format[Read partExtractor prompt; generate structured output]
  Research --> Format
  Format --> Verified{Exact model verified and output present?}
  Verified -- No --> Warning[/Verification message or error; keep editor/] --> Input
  Verified -- Yes --> Fill[Apply returned identity, price, specs and description to form]
  Fill --> Review{Save or cancel?}
  Review -- Cancel --> End([Close editor without save])
  Review -- Save --> FormWrite{Form validates and catalog write succeeds?}
  FormWrite -- No --> FormError[/Error; keep editor/] --> Fill
  FormWrite -- Yes --> Done([Part saved])
  Call --> Cancel([Cancel local generation])
  Form --> Finish([END])
  End --> Finish
  Done --> Finish
  Cancel --> Finish
```

Sources: `src/components/add-part-editor.tsx`, `src/hooks/use-part-form.ts`, `src/app/actions.ts` (`getAiPartDetails`), `src/ai/flows/extract-part-details.ts`, `src/lib/vector-retriever.ts`. The extraction prompts explicitly use USD × 56 for estimated PHP pricing, whereas `src/lib/utils.ts` defines USD × 60. This mismatch is checked-in behavior; generated prices still require manager review. The flow uses optional vector grounding, then a research step when no vector context is found. Google Search availability is not runtime verified.
