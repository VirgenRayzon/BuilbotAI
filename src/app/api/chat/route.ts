import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, tool, convertToModelMessages, stepCountIs } from 'ai';
import { retrieveLocalKnowledge } from "@/lib/knowledge-retriever";
import { retrieveCsvSpecs } from "@/lib/spec-retriever";
import { getStructuredInventory } from "@/lib/inventory-fetcher";
import { z } from 'zod';

export const maxDuration = 120;

export async function POST(req: Request) {
    const startTime = Date.now();
    try {
        const { messages, userProfile } = await req.json();

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

        // Prepare static system instructions
        const systemInstruction = `You are a helpful, expert PC building assistant named "Buildbot AI".
You are chatting with a user who is currently building a PC.

### INSTRUCTIONS & ROLE PROMPTING

**[Role & Mission]**
Your name is BuildbotAI. You are a world-class expert and highly experienced online PC Builder consultant. 
Our platform provides a comprehensive PC building experience, curating high-quality components like CPUs, GPUs, motherboards, RAM, storage, and cooling solutions. We value our customers, and our goal is to solve their pain points—such as hardware incompatibility, performance bottlenecks, and budget constraints. Your role is to provide top-tier customer service, understand the user's specific computing needs, and recommend optimal, compatible products that meet those requirements. Both the administration team and our customers greatly value your technical assistance and recommendations.

**[Token & Formatting Constraints - CRITICAL]**
- **Extreme Brevity:** Keep ALL answers short and punchy. Maximum 2-3 short sentences per response. Never use filler phrases like "Here are some top picks" or "These options offer great performance". Get straight to the point.
- **Hard Cap:** You MUST recommend a maximum of 4 items at a time. Do not overwhelm the user.
- **Full Builds:** When the user asks for a complete PC build (especially based on a budget), you MUST decline the request. Politely state that you cannot build a full PC from scratch in the chat, and highly recommend that they use the dedicated "Build Advisor" tool on the platform instead.
- **Speech Bubbles:** Keep responses to 1-2 short sentences maximum per thought.

**[Technical & Tool Directives - STRICT]**
- **Lazy Grounding:**
  - If the user asks about compatibility, PC bottlenecks, tier lists, or guidelines, you MUST call \`queryCompatibilityGuides\` to retrieve relevant rules.
  - If the user asks for detailed specifications of a component (e.g., ports, sockets, frequencies, socket compatibility, sizes), you MUST call \`queryPartSpecifications\` to check specs.
  - You MUST NOT guess technical specifications or compatibility rules.
- **Inventory Check:** If the user asks for a recommendation or you want to suggest a part, you MUST use the \`searchInventory\` tool to fetch real parts from the store first. Do not make up parts. Ensure they are in stock.
- **Currency:** The \`searchInventory\` tool returns the current Price of the items in Philippine Pesos (₱/PHP). Use this price to filter and provide accurate recommendations when the user mentions a specific budget (e.g., "around 20k" means ₱20,000).
- **Tool Execution:** When using a tool, you MUST finish your current sentence COMPLETELY in a text part before the tool invocation. Do not stop mid-sentence.
- **Output Formatting for Recommendations - STRICT:**
  - DO NOT output custom markdown recommendation links (e.g., \`[Part Name](add-part:...)\`) or custom HTML.
  - The UI will automatically render an interactive card carousel from the \`searchInventory\` tool results with images, prices, and quick add buttons.
  - **DO NOT list individual part names, prices, or specs in your text response.** The carousel handles all visual presentation. Just write a brief 1-sentence summary like "Here are some options within your budget" or "I found a few GPUs that match." That's it.
  - **NEVER write bullet points or numbered lists of recommended parts.** The cards are the recommendation.
- **General Rules:**
  - If you do not know the answer to a query, say: "I don't have an answer, please ask the store clerk for assistance."
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

        // Slice to get last 10 messages for context
        const recentMessages = messages.slice(-10);

        // Inject userProfile context immediately prior to the final user prompt
        // NOTE: Google provider only allows system messages at the start, so we inject as a 'user' message with a context tag.
        if (userProfile) {
            const displayName = userProfile.displayName || "Architect";
            const experienceLevel = userProfile.experienceLevel || "Intermediate";
            const preferences = userProfile.preferences || "None provided";
            const profilePrompt = `[SYSTEM CONTEXT — DO NOT REPLY TO THIS MESSAGE DIRECTLY]
USER PROFILE DETAILS (FYI):
- User Name: ${displayName}
- Hardware Experience Level: ${experienceLevel}
- Specific Preferences/Wishes: ${preferences}
Use this context to customize your tone and hardware tier selections if applicable.`;
            
            recentMessages.splice(recentMessages.length - 1, 0, {
                id: `profile-${Date.now()}`,
                role: 'user',
                parts: [{ type: 'text', text: profilePrompt }]
            } as any);
        }

        const result = await streamText({
            model: googleProvider('gemini-2.5-flash'),
            maxOutputTokens: 350,
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
                        const cleanTerm = (searchTerm === "undefined" || searchTerm === "") ? undefined : searchTerm;
                        console.log(`[Tool: searchInventory] Searching for ${category} with term: ${cleanTerm ? `"${cleanTerm}"` : "none"}`);
                        const inventory = await getStructuredInventory(category, cleanTerm);

                        if (!inventory || inventory.length === 0) {
                            return { error: `No parts found in category ${category} matching term '${cleanTerm}'. Try searching again with an EMPTY searchTerm to see all available parts.` };
                        }
                        return inventory;
                    },
                }),
                queryCompatibilityGuides: tool({
                    description: "Search the local markdown guides for PC component compatibility rules, tier lists, bottlenecks, and recommendations.",
                    inputSchema: z.object({
                        query: z.string().describe("Specific search keywords or terms (e.g. 'ram speed', 'psu tier', 'bottleneck cpu', 'motherboard size').")
                    }),
                    execute: async ({ query }) => {
                        console.log(`[Tool: queryCompatibilityGuides] Query: "${query}"`);
                        const guides = await retrieveLocalKnowledge(query);
                        return { guides };
                    }
                }),
                queryPartSpecifications: tool({
                    description: "Search the local specifications database (CSVs) for detailed hardware specifications (frequencies, ports, sockets, dimensions, power limits).",
                    inputSchema: z.object({
                        query: z.string().describe("Part name or brand keywords to lookup (e.g., 'Ryzen 5 7600X', 'RTX 4070', 'Corsair RM850x').")
                    }),
                    execute: async ({ query }) => {
                        console.log(`[Tool: queryPartSpecifications] Query: "${query}"`);
                        const specs = await retrieveCsvSpecs(query);
                        return { specs };
                    }
                })
            },
            stopWhen: stepCountIs(5), // Allow for tool calling loops automatically
            abortSignal: AbortSignal.timeout(120000), // 120 second timeout
        });

        return result.toUIMessageStreamResponse({
            headers: {
                'x-server-start': startTime.toString(),
            },
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
