# AI prebuilt naming and description assistance

## Simple explanation

This flowchart shows how AI helps staff describe a ready-made PC. Staff first select the parts that belong to the system. The AI uses those parts to suggest a name, a short description, and a level. Empty fields can be filled with the suggestions without locking the form. Staff can change the text before the system is saved.

```mermaid
flowchart TD
  Start([Staff opens prebuilt editor or builder]) --> Surface{Which surface?}
  Surface -- Admin editor --> Edit[/Select components and enter product fields/]
  Edit --> Assist{AI Assist?}
  Assist -- No --> Manual[Continue manual editing]
  Assist -- Yes --> Check{AI enabled and components selected?}
  Surface -- Staff builder --> Build[/Select build components; enter prebuilt name/]
  Build --> Generate{Generate Prebuilt?}
  Generate -- Cancel --> Build
  Generate -- Yes --> Check
  Check -- No --> Error[/Toast; retain current input/] --> Surface
  Check -- Yes --> Call[Call getAiPrebuiltSuggestions]
  Call --> Pending{Staff builder cancels local wait?}
  Pending -- Yes --> Cancel([Abort client-side continuation; show cancellation toast])
  Pending -- No --> Flow[Genkit prebuilt advisor flow]
  Flow --> Model[Resolve prebuiltAdvisor model; generate structured identity and description]
  Model --> Valid{Nonempty result?}
  Valid -- No --> Error
  Valid -- Yes --> Return{Calling surface?}
  Return -- Admin editor --> Apply[Fill eligible empty fields; retain entered values]
  Apply --> Choice{Save, edit, or close?}
  Choice -- Edit --> Manual
  Choice -- Close --> End([Editor closed])
  Choice -- Save --> Write{Form and Firestore write succeed?}
  Return -- Staff builder --> Assemble[Use entered name, generated description and tier, selected parts and price]
  Assemble --> Write
  Write -- No --> SaveError[/Validation or toast; retain build/editor/] --> Surface
  Write -- Yes --> Done([Prebuilt saved])
  Manual --> Finish([END])
  Cancel --> Finish
  End --> Finish
  Done --> Finish
```

The admin prebuilt editor calls `getAiPrebuiltSuggestions` and only fills fields that were empty (`src/components/add-prebuilt-dialog.tsx`). The staff prebuilt builder invokes the same action via `src/hooks/use-build-actions.ts`, after a name modal in `src/components/build/build-action-footer.tsx`. The Genkit flow in `src/ai/flows/ai-prebuilt-advisor.ts` requires selected components. A second prebuilt form component, `src/components/prebuilt-builder-add-dialog.tsx`, has AI assist code but no page import was found.
