# Builder Compatibility Feedback

## Rule

Keep incompatible catalog parts visible so the customer or manager can understand the conflict. Show the incompatibility overlay with the deterministic reason, remove the Add action, and retain the add-handler validation as a second guard. The optional **Compatible only** filter may hide these cards when the user enables it.

Guests may use `/builder` to select parts and see deterministic compatibility feedback. AI analysis, Buildbot chat, live AI recommendations, saved account builds, and reservation remain customer actions. Guest clicks on those controls go to `/signin?returnTo=%2Fbuilder`; the locally selected build survives that navigation. Staff still return to `/admin` from the customer builder.

CPU and motherboard socket comparison must prefer explicit catalog specifications. For older incomplete records, infer only well-known CPU generations and motherboard chipset families. Handle chipset suffixes such as `B860M` and `B650M`.

## Verification

- Select an LGA1851 motherboard and open the CPU category.
- Confirm AM4, AM5, LGA1200, and LGA1700 CPUs remain visible with an **Incompatible** socket message and no Add button.
- Confirm an LGA1851 CPU remains addable.
- Repeat in reverse by selecting a CPU and opening the Motherboard category.
- Enable **Compatible only** and confirm incompatible cards are hidden.
- Run typecheck, lint, the compatibility tests, and the production build.

## Lesson learned

The inventory hook calculated compatibility, but the customer grid did not pass that result into `PartCard`, so its warning overlay and disabled action never rendered. Some catalog records also omit the socket field; chipset matching must recognize suffixed names such as `B860M` rather than only the bare chipset code.
