# BuildbotAI flowcharts

These diagrams describe the checked-in implementation reviewed again on 27 October 2026. They are based on source code; Firebase data, deployed rules, AI service access, and live production behavior were not tested in this review. Rectangles are actions, diamonds are choices, parallelograms are input or output, and rounded nodes are start or end points. **END** means the path shown in that chart has finished; it does not always mean the person has closed the app. A link from a master diagram points to its more detailed workflow. The [interaction inventory](interaction-inventory.md) maps routes and overlays to source.

Each Mermaid code block also has a standalone `.mmd` file beside its Markdown document. A document with multiple diagrams uses numbered suffixes (`-01`, `-02`, and so on). The Markdown files add source references and caveats; the `.mmd` files contain only the diagram source.

## Start here

| Diagram | Scope |
| --- | --- |
| [Simplified all-features map](simplified-all-features-flowchart.md) | One-page overview with separate User, Manager, Super Admin, and AI flows |
| [Master system](master-system-flowchart.md) | Entry, role routing, modules, session exit |
| [Authentication](authentication-flowchart.md) | Customer and staff sign-in, registration, guards, timeout |
| [User](user-flowchart.md) | Customer navigation and available actions |
| [Manager](manager-flowchart.md) | Staff dashboard and catalog operations |
| [Super Admin](super-admin-flowchart.md) | Additional management, sales, AI, and safeguard controls |

## Feature workflows

| Diagram | Scope |
| --- | --- |
| [Public pages and navigation](public-navigation-flowchart.md) | Landing, content pages, header, search and contact |
| [Builder](builder-flowchart.md) | Catalog filtering, selection, compatibility, saved state, exports |
| [Prebuilts](prebuilts-flowchart.md) | Catalog, detail, customization, reservation |
| [Reservations](reservations-flowchart.md) | Creation, stock transaction, status, cancellation |
| [Profile](profile-flowchart.md) | Profile, favorites, notifications, activity |
| [Admin inventory](admin-inventory-flowchart.md) | Parts, prebuilts, archive, bulk actions |
| [Admin operations](admin-operations-flowchart.md) | Reservations, sales, keys, content, audit, safeguards |
| [Pop-up decisions](popup-decision-flowcharts.md) | Overlay trigger and choice families |
| [Errors and edge cases](error-handling-flowcharts.md) | Implemented loading, validation, denial and failure paths |

## AI system

The separate [AI index](ai-system/ai-master-flowchart.md) connects the architecture, chatbot, advisor, critique, prebuilt analysis, extraction, settings, and error diagrams. [AI interaction inventory](ai-system/ai-interaction-inventory.md) lists the entry points and calls.

## Coverage and limits

The page review now covers 24 page routes and 17 HTTP route handlers. The interaction inventory may still list older overlay totals and should be recounted before those totals are used in a report. Repeated uses of the same popup share one decision flow when their choices are the same. Filters and page controls are grouped by the change they make. Source code, rather than older plans in `docs/`, governs each claim. See [unverified and unresolved items](interaction-inventory.md#unverified-and-unresolved).
