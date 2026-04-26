import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, tool, convertToModelMessages, stepCountIs } from 'ai';
import { retrieveLocalKnowledge } from "@/lib/knowledge-retriever";
import { getInventoryFromFirestore } from "@/lib/inventory-fetcher";
import { z } from 'zod';

export const maxDuration = 120;

export async function POST(req: Request) {
    try {
        const { messages, buildContext } = await req.json();

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return new Response(JSON.stringify({ error: "No messages provided" }), { status: 400 });
        }

        const lastMessage = messages[messages.length - 1];

        // Extract text content from various possible formats (v6 parts vs legacy content/text)
        let messageText = "";
        if (lastMessage.parts && Array.isArray(lastMessage.parts)) {
            messageText = lastMessage.parts
                .filter((p: any) => p.type === 'text')
                .map((p: any) => p.text)
                .join(' ');
        } else {
            messageText = lastMessage.content || lastMessage.text || "";
        }

        // Handle trigger greeting for streaming start
        if (messageText === 'SYSTEM_TRIGGER_GREETING') {
            const greetingPrompt = "Initialize sequence... Hello Architect. Please introduce yourself as Buildbot AI and offer to help me build my PC. Keep it professional, welcoming, and high-tech.";
            lastMessage.content = greetingPrompt;
            if (lastMessage.parts) {
                lastMessage.parts = [{ type: 'text', text: greetingPrompt }];
            }
        }

        // Context formatting
        const formattedContext = buildContext
            ? `\nCURRENT BUILD CONTEXT:\n${Object.entries(buildContext)
                .map(([cat, parts]) => {
                    if (!parts) return `${cat}: None selected`;
                    if (Array.isArray(parts)) return `${cat}: ${parts.map((p: any) => `${p.brand || ''} ${p.model}`).join(', ')}`;
                    const singlePart = parts as any;
                    return `${cat}: ${singlePart.brand || ''} ${singlePart.model}`;
                })
                .join('\n')}`
            : '';

        // Retrieve background knowledge
        const queryTerms = messageText || "PC components";
        const localKnowledge = await retrieveLocalKnowledge(queryTerms);

        const knowledgeText = localKnowledge.length > 0
            ? `\n\nEXPERT KNOWLEDGE BASE:\n${localKnowledge.join('\n\n')}`
            : '';

        const systemInstruction = `You are a helpful, expert PC building assistant named "Buildbot AI".
You are chatting with a user who is currently building a PC.
${formattedContext}
${knowledgeText}

### INSTRUCTIONS & ROLE PROMPTING

**[Role & Mission]**
Your name is BuildbotAI. You are a world-class expert and highly experienced online PC Builder consultant. 
Our platform provides a comprehensive PC building experience, curating high-quality components like CPUs, GPUs, motherboards, RAM, storage, and cooling solutions. We value our customers, and our goal is to solve their pain points—such as hardware incompatibility, performance bottlenecks, and budget constraints. Your role is to provide top-tier customer service, understand the user's specific computing needs, and recommend optimal, compatible products that meet those requirements. Both the administration team and our customers greatly value your technical assistance and recommendations.

**[Token & Formatting Constraints - CRITICAL]**
- **Save Tokens:** Keep all answers ultra-concise, stripped-down, and informative. Use Markdown clearly (e.g., bolding part names).
- **Hard Cap:** You MUST recommend a maximum of 4 items at a time. Do not overwhelm the user.
- **Full Builds:** When the user asks for a complete PC build (especially based on a budget), you MUST decline the request. Politely state that you cannot build a full PC from scratch in the chat, and highly recommend that they use the dedicated "Build Advisor" tool on the platform instead.
- **Brief Explanations:** If recommending single parts, briefly state why it fits (maximum one sentence) to save tokens.
- **Speech Bubbles:** To keep things readable and UI minimalist, break your thoughts into logical steps. Provide recommendations in a new logical step after receiving tool results.

**[Technical & Tool Directives - STRICT]**
- **Knowledge Base:** Review the EXPERT KNOWLEDGE BASE for any specific info on parts or topics the user asks about (bottlenecks, tier lists, etc.).
- **Inventory Check:** If the user asks for a recommendation or you want to suggest a part, you MUST use the \`searchInventory\` tool to fetch real parts from the store first. Do not make up parts. Ensure they are in stock.
- **Currency:** The \`searchInventory\` tool returns the current Price of the items in Philippine Pesos (₱/PHP). Use this price to filter and provide accurate recommendations when the user mentions a specific budget (e.g., "around 20k" means ₱20,000).
- **Tool Execution:** When using a tool, you MUST finish your current sentence or introductory thought COMPLETELY in a text part before the tool invocation. Do not stop mid-sentence.
- **Output Formatting:** If you suggest a specific part for the user to add to their build, you MUST use the exact Image URL provided by the \`searchInventory\` tool. DO NOT use placeholders.
  - OUTPUT FORMAT: \`[Part Name](add-part:Category|ID|Price|ImageURL)\`
  - Example: If the tool says \`Image: "https://firebasestorage.com/.../o/parts%2Fgpu%2F..."\`, your link MUST be \`[Part Name](add-part:Category|ID|Price|https://firebasestorage.com/.../o/parts%2Fgpu%2F...)\`.
  - **CRITICAL URL RULE:** Never decode or 'fix' the image URL. Slashes MUST remain exactly as \`%2F\` in the URL.

**[Consultation Steps]**
Before answering any query, take a deep breath and think through it step-by-step.
1. Greet the customer warmly (friendly tone).
2. Identify needs: ask what kind of PC parts they are looking for (gaming, office, productivity, etc.).
3. Gather details: ask about their specific use case and budget.
4. Suggest products based on the customer's needs and available products in the store via your tools.
5. If you cannot find the right product, encourage them to search the site themselves.
6. If you do not know the answer to a query, say: "I don't have an answer, please ask the store clerk for assistance."
7. Let them know they can reach out for further assistance after their purchase.
`;

        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            console.error("AI API Key is missing. Checked: GOOGLE_GENERATIVE_AI_API_KEY, GEMINI_API_KEY, GOOGLE_API_KEY. None found.");
            return new Response(JSON.stringify({ error: "AI service is currently unavailable" }), { status: 500 });
        }

        const keySource = process.env.GOOGLE_GENERATIVE_AI_API_KEY ? 'GOOGLE_GENERATIVE_AI_API_KEY'
            : process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : 'GOOGLE_API_KEY';
        console.log(`[Chat API] Using API key from: ${keySource}`);

        const googleProvider = createGoogleGenerativeAI({
            apiKey: apiKey,
        });

        const recentMessages = messages.slice(-10);

        const result = await streamText({
            model: googleProvider('gemini-3-flash-preview'),
            maxOutputTokens: 4096,
            messages: await convertToModelMessages(recentMessages),
            system: systemInstruction,
            tools: {
                searchInventory: tool({
                    description: "Search the live store database for PC parts by category. IMPORTANT: To ensure you find results, leave 'searchTerm' empty to fetch all available parts in a category, then pick the best ones yourself. Do NOT pass overly specific terms (like '650W Bronze' or 'ATX Case') as the search is strict. NEVER pass the string 'undefined'.",
                    inputSchema: z.object({
                        category: z.enum(['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler', 'monitor', 'keyboard', 'mouse', 'headset']),
                        searchTerm: z.string().optional().describe("Keep this EMPTY to get all items in the category."),
                    }),
                    execute: async ({ category, searchTerm }) => {
                        // Clean up literal "undefined" strings that the AI sometimes sends
                        const cleanTerm = (searchTerm === "undefined" || searchTerm === "") ? undefined : searchTerm;
                        console.log(`[Tool: searchInventory] Searching for ${category} with term: ${cleanTerm ? `"${cleanTerm}"` : "none"}`);
                        const inventory = await getInventoryFromFirestore(category, cleanTerm);

                        if (!inventory || inventory.length === 0) {
                            return { error: `No parts found in category ${category} matching term '${cleanTerm}'. Try searching again with an EMPTY searchTerm to see all available parts.` };
                        }
                        return inventory;
                    },
                }),
            },
            stopWhen: stepCountIs(5), // Allow for tool calling loops automatically
            abortSignal: AbortSignal.timeout(60000), // 60 second timeout
        });

        return result.toUIMessageStreamResponse({
            onError: (error: unknown) => {
                if (error == null) return 'unknown error';
                if (typeof error === 'string') return error;
                if (error instanceof Error) return error.message;
                return JSON.stringify(error);
            }
        });

    } catch (error) {
        console.error("Error in chat route:", error);
        return new Response(JSON.stringify({ error: "Failed to process chat request" }), { status: 500 });
    }
}

