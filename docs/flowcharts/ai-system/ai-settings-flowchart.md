# Super Admin AI settings and prompts

```mermaid
flowchart TD
  Start([Super Admin opens AI tab]) --> Mode{Model routing or prompts?}
  Mode -- Model routing --> Models[Select Gemini model or local Vertex project]
  Models --> Route[Choose all-feature or per-feature routing]
  Route --> Action{Test, register, remove or apply?}
  Action -- Test --> Test[Server connection test] --> TestResult[/Status and remediation feedback/] --> Models
  Action -- Register --> Validate{Project name and endpoint valid?}
  Validate -- No --> Inline[/Validation toast/] --> Models
  Validate -- Yes --> Local[Add project to browser project list] --> Models
  Action -- Remove --> Delete{Confirm local project deletion?}
  Delete -- Cancel --> Models
  Delete -- Confirm --> Remove[Remove browser project entry] --> Models
  Action -- Apply --> Save{Server settings validation and Firestore write?}
  Save -- No --> SaveError[/Error toast/] --> Models
  Save -- Yes --> Success[/Saved toast; invalidate model cache/] --> Models
  Mode -- Prompts --> Prompt[Select feature prompt; edit draft]
  Prompt --> PromptChoice{Copy, discard, save, or reset?}
  PromptChoice -- Copy --> Clipboard[Copy current draft] --> Prompt
  PromptChoice -- Discard --> Discard[Restore stored draft] --> Prompt
  PromptChoice -- Save current/all --> PromptSave{Action succeeds?}
  PromptSave -- No --> PromptError[/Error toast/] --> Prompt
  PromptSave -- Yes --> Prompt
  PromptChoice -- Reset current/all --> Confirm{Confirm modal?}
  Confirm -- Cancel --> Prompt
  Confirm -- Confirm --> Reset[Reset selected stored prompt or all] --> Prompt
```

The available routing keys are chatbot, build advisor and prebuilt advisor (`src/lib/ai-model-resolver.ts`). Settings UI is `src/components/ai-model-settings.tsx`; prompt UI is `src/components/ai-system-prompts-settings.tsx` and `src/hooks/use-system-prompts.ts`. Server actions in `src/app/actions.ts` test models, save settings, and update/reset prompts. The project selector's browser list and the selected server routing are distinct states; the UI must apply settings to change server behavior.
