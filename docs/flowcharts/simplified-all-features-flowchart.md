# Simplified all-features map

This one-page map summarizes the implemented, reachable features by role and keeps AI processing separate. It is a navigation aid, not a replacement for the [detailed flowcharts](README.md) or [source interaction inventory](interaction-inventory.md). The diagrams show principal choices and destinations; the linked detail pages cover validations, dialogs, writes, and error cases. Source inspection was performed on 18 October 2026; live Firebase data and deployed AI services were not exercised.

## User (non-admin)

```mermaid
flowchart TD
  UStart([Customer sign-in or sign-up]) --> UHome{Choose feature}
  UHome -- Public pages --> UPublic[Home, About, Team, FAQ, Contact; theme and navigation]
  UHome -- Builder --> UBuilder[Browse and filter parts; inspect details; select compatible build]
  UBuilder --> UBuildChoice{Build action}
  UBuildChoice -- Save --> UFavorite[Name and save favorite]
  UBuildChoice -- Reserve --> UReserve[Confirm reservation; stock-backed order]
  UBuildChoice -- PDF --> UPdf[Download authenticated build PDF]
  UBuildChoice -- Analyze --> UCritique[AI critique of selected build]
  UBuilder --> UChat[Floating AI chatbot]
  UHome -- Build Advisor --> UAdvisor[Enter use and budget; generate AI recommendations or critique build]
  UHome -- Prebuilt systems --> UPrebuilt[Search, filter, inspect details and images]
  UPrebuilt --> UPrebuiltChoice{Customize or reserve?}
  UPrebuiltChoice -- Customize --> UBuilder
  UPrebuiltChoice -- Reserve --> UReserve
  UHome -- Profile --> UProfile[Edit profile/settings; favorites, reservations and activity]
  UHome -- Notifications --> UNotice[Filter, mark or delete; inspect linked order]
  UProfile --> UCancel[Cancellation choice: keep order or contact staff]
  UHome -- Sign out --> UExit([Confirm and sign out])
```

Customer access and navigation: `src/app/signin/page.tsx`, `src/app/signup/page.tsx`, `src/components/header.tsx`, `src/app/builder/`, `src/app/ai-build-advisor/`, `src/app/pre-builts/`, and `src/app/profile/`. See [User](user-flowchart.md), [builder](builder-flowchart.md), [prebuilts](prebuilts-flowchart.md), [reservations](reservations-flowchart.md), and [profile](profile-flowchart.md). The Contact form currently shows local success without a submission integration. The visible cancellation modal routes to Contact Staff; it does not directly cancel the order.

## Manager

```mermaid
flowchart TD
  MStart([Staff sign-in with role key]) --> MHome{Choose staff feature}
  MHome -- Stock --> MStock[Search/filter parts; add, edit, adjust stock, archive or restore]
  MStock --> MAutofill[Optional AI part autofill]
  MHome -- Prebuilts --> MPrebuilt[Search/filter systems; add, edit, archive or restore]
  MPrebuilt --> MAssist[Optional AI identity and description assist]
  MHome -- Prebuilt Builder --> MBuilder[Select compatible parts; name and generate a prebuilt]
  MBuilder --> MChat[Floating AI chatbot]
  MHome -- Reservations --> MOrders[Search/filter orders; inspect and change status]
  MHome -- Archive --> MArchive[Review and restore archived catalog or orders]
  MHome -- Audit --> MAudit[Filter staff audit records]
  MHome -- Product detail --> MReport[Generate or re-evaluate prebuilt AI report]
  MHome -- Profile/notifications --> MProfile[Edit account; inspect staff notices]
  MHome -- Public pages --> MPublic[Home, About, Team, FAQ and Contact]
  MHome -- Sign out --> MExit([Confirm and sign out])
```

Manager modules are rendered by `src/app/admin/page.tsx`, `src/app/admin/prebuilt-builder/page.tsx`, `src/app/profile/page.tsx`, and `src/app/pre-builts/[id]/page.tsx`. The manager's delete controls are not rendered. See [Manager](manager-flowchart.md), [admin inventory](admin-inventory-flowchart.md), and [admin operations](admin-operations-flowchart.md).

## Super Admin

```mermaid
flowchart TD
  SStart([Super Admin staff sign-in]) --> SHome{Choose feature}
  SHome -- Shared staff features --> SShared[All Manager stock, prebuilt, builder, order, archive, audit and profile flows]
  SShared --> SDelete[Additional confirmed delete for eligible parts, prebuilts and reservations]
  SHome -- Sales --> SSales[Review charts and popularity; filter; export Excel]
  SSales --> SSalesMutate[Confirm sample-data ingestion or sales reset]
  SHome -- Management --> SManagement[Manage manager key, key requests and accounts]
  SHome -- AI settings --> SAi[Choose/test model routing; edit, save or reset system prompts]
  SHome -- Site content --> SContent[Edit and save About-page content]
  SHome -- Safeguards --> SGuard[Confirm maintenance, storage or AI switches]
  SHome -- Sign out --> SExit([Confirm and sign out])
```

The additional tabs and controls depend on the Super Admin profile in `src/app/admin/page.tsx` and `src/app/profile/page.tsx`; the guarded actions are in `src/app/actions.ts` and related hooks. See [Super Admin](super-admin-flowchart.md), [admin operations](admin-operations-flowchart.md), and [AI settings](ai-system/ai-settings-flowchart.md).

## AI flows (separate from role navigation)

```mermaid
flowchart TD
  AStart([Reachable AI action]) --> AEntry{Entry point}
  AEntry -- User or staff builder --> AChat[Chatbot: messages and build context; streamed answer and optional tools]
  AEntry -- User Build Advisor --> ARecommend[Recommendations: goal/budget; validated eight-part build]
  AEntry -- User Build Advisor --> ACritique[Critique: selected build; analysis and suggestions]
  AEntry -- Manager part editor --> AExtract[Part autofill: vector grounding or web research; editable fields]
  AEntry -- Manager prebuilt editor/builder --> AAssist[Prebuilt assist: generated identity, description and tier]
  AEntry -- Staff prebuilt detail --> APerformance[Performance report: research, strengths and saved report]
  AEntry -- Super Admin AI tab --> ASettings[Model routing, connection test and system prompts]
  AChat --> AResult{Result available?}
  ARecommend --> AResult
  ACritique --> AResult
  AExtract --> AResult
  AAssist --> AResult
  APerformance --> AResult
  ASettings --> AResult
  AResult -- Yes --> AShow[/Render, apply or save feature result/]
  AResult -- No --> AFail[/Feature-specific error, retry or fallback/]
  ADormant([Smart Budget source exists]) --> AUnreachable[/No page import found; not a reachable user feature/]
```

The [AI master](ai-system/ai-master-flowchart.md) and [AI interaction inventory](ai-system/ai-interaction-inventory.md) trace these paths to `src/app/api/chat/route.ts`, `src/app/api/ai/build-advisor/recommendations/route.ts`, `src/app/actions.ts`, and `src/ai/flows/`. AI availability and remote cancellation remain unverified at runtime. Smart Budget is shown only to distinguish code-present functionality from a mounted feature.
