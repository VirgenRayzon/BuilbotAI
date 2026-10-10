# Chatbot build context

## Goal

Keep the builder's floating chat aligned with the live **Your Build** selection when answering build questions and recommending parts.

## Data path

1. `src/app/builder/page.tsx` passes the current builder state to `BuilderFloatingChat`.
2. `useFloatingChat` serializes only selected parts. Keep socket, RAM type, dimensions, performance tier and score, wattage, price, and specifications because the server-side checks use them.
3. The AI SDK `useChat` retains the transport created on the first render. Set the transport `body` to a function that reads a ref updated every render. A plain object captures the initial empty build and will not follow later selections or localStorage restoration.
4. `/api/chat` uses that snapshot for the model context and the deterministic `analyzeCurrentBuild` tool. A partial build must be described as partial even if no issue is detected among its selected parts.
5. `searchInventory` filters recommendations using the builder's `checkCompatibility` rules, stock and archived state, the requested PHP budget, and PSU headroom. Do not fall back to over-budget inventory when no match remains.
   Recommendation cards recheck those results against the live client build so an older card is removed if later selections make it unsuitable. The builder still performs the final add check.
6. Scroll the Radix message viewport directly. `scrollIntoView` on a message can scroll the outer panel and hide its header or input. Mantine `Paper` also needs an explicit flex display when used as the chat panel, because its root CSS defaults to block.
7. A browser `TypeError: Failed to fetch` from `DefaultChatTransport.sendMessages` can mean the Next.js server is not listening on port 9002. Check the port and start `npm run dev` before changing the AI route. Handle this expected connection error with a toast; logging the raw error with `console.error` triggers the Next.js development overlay.
8. A tuned Vertex stream can emit partial text or no text and then remain open until the 120-second route timeout. `streamText` creates its stream before generation, so catching only stream creation errors will not activate fallback. Hold only non-visible stream setup chunks until the first text delta or tool call. Forward visible chunks immediately so multi-part answers appear in sequence. Enforce a short deadline and retry through default Gemini if it stalls before visible output. Also inspect the finish reason and final text: a tuned stream may report `stop` even though its sentence ends on a dangling article or preposition. If the reply is incomplete after visible output, close any open text part and have default Gemini continue from that partial answer in the same chat turn. Suppress a second UI-message start so the continuation stays attached to the current assistant message. Mark the tuned model degraded for the cooldown. Do not replay a new answer over text the user has already seen.
9. For recommendations, category, budget, and use case or resolution are enough to search. The assistant should not keep asking optional questions after those are supplied, even if a Firestore-stored prompt still contains older discovery wording.
10. Order matching GPUs by stored performance score before the carousel takes its first four cards. Firestore's default result order can otherwise put entry-level GPUs ahead of stronger options within the user's budget.
11. In the narrow floating chat, show one recommendation per slide. Put navigation and the slide count above the card, keep the product name readable, and give the image, price, and Add to Build action stable space. Overlay arrows and two 200px cards obscure titles and actions.
12. Use up to three category-relevant facts from stored part specifications in the card (for example CPU socket, cores, and threads). Skip missing or placeholder values; never infer facts from the model name. Keep the image compact so sparse inventory records do not leave a large empty card.
13. The user bubble's left-side retry control uses `useChat.regenerate({ messageId })` for the most recent user message, replacing its assistant response. The AI SDK truncates the conversation after that message when regenerating, so retry an older user bubble by sending its text as a new message instead. Disable retries while a request is running or the AI kill switch is on.
14. The SDK can store a tuned reply and its fallback continuation as separate text parts, sometimes with only a `step-start` marker between them. If the first part ends mid-sentence, render both as one bubble with the missing space. Keep complete replies and tool/status boundaries separate so genuinely distinct messages still appear in sequence.
15. A single recommendation request can generate several model steps and repeated `searchInventory` calls. For such a turn, render one final explanation bubble and one deduplicated carousel per category, and suppress completed duplicate search statuses. If the model searched more than once, prefer its first complete post-search explanation when later paragraphs repeat it; retain all useful paragraphs after a single search. Prompt the model to search each category once and answer after the tools; cache identical inventory searches within the request so a repeat call does not fetch again. Keep the live compatibility and stock checks on every card.

## Verification

- Run `npm run typecheck`.
- Run `npm run dev` on port 9002 and `npm run genkit:dev` when checking the local AI flow.
- With the test user on `/builder`, add one part while the chat is closed, open it, then add another while it is open. The header's **Your Build** count should update immediately.
- Ask **Check my current build for compatibility**. Confirm the chat names the newly selected parts and recognizes missing core categories. If the AI response fails, inspect the `/api/chat` log and the tool result before changing prompt text.
- Ask for a PSU under a specific budget after choosing a CPU and GPU. Check the cards are available, within budget, and have sufficient wattage. Add one card and verify the selected part and chat badge update.
