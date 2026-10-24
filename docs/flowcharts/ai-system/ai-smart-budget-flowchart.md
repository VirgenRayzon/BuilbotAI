# Smart Budget source path (unmounted)

`src/components/smart-budget.tsx` and `src/ai/flows/ai-smart-budget.ts` implement this path, and `getAiSmartBudget` is exported from `src/app/actions.ts`. No import of `SmartBudget` by a page or mounted component was found, so this is a code-present workflow rather than a verified user navigation path.

```mermaid
flowchart TD
  Start([If SmartBudget is mounted]) --> Input[/Budget and preferences/]
  Input --> Valid{AI enabled and numeric budget valid?}
  Valid -- No --> Toast[/Disabled or invalid-budget toast/]
  Valid -- Yes --> Call[Call getAiSmartBudget]
  Call --> Flow[Genkit structured build suggestion]
  Flow --> Result{Response or error?}
  Result -- Error --> Error[/Error toast; remain in component/]
  Result -- Response --> Review[/Display suggested inventory parts/]
  Review --> Choice{Apply or close?}
  Choice -- Apply --> Event[Apply matching parts to supplied build callback]
  Choice -- Close --> End([Close component])
```

No current route exposes this component. Its server action can be called by code, but the repository does not establish a user-facing Smart Budget screen.
