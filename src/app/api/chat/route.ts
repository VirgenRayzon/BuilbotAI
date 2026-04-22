import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, tool, convertToModelMessages, stepCountIs } from 'ai';
import { retrieveLocalKnowledge } from "@/lib/knowledge-retriever";
import { getInventoryFromFirestore } from "@/lib/inventory-fetcher";
import { z } from 'zod';

export const maxDuration = 60;

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

INSTRUCTIONS:
- Review the EXPERT KNOWLEDGE BASE for any specific info on parts or topics the user asks about (bottlenecks, tier lists, etc.).
- If the user asks for a recommendation or you want to suggest a part, you MUST use the \`searchInventory\` tool to fetch real parts from the store first. Do not make up parts.
- The \`searchInventory\` tool returns the current Price of the items in Philippine Pesos (₱/PHP). Use this price to filter and provide accurate recommendations when the user mentions a specific budget (e.g., "around 20k" means ₱20,000).
- Keep your answers concise, informative, and formatted clearly with Markdown (e.g., bolding part names).
- If you suggest a specific part for the user to add to their build, you MUST use the exact Image URL provided by the \`searchInventory\` tool. DO NOT use placeholders.
- OUTPUT FORMAT: \`[Part Name](add-part:Category|ID|Price|ImageURL)\`
- Example: If the tool says \`Image: "https://firebasestorage.com/.../o/parts%2Fgpu%2F..."\`, your link MUST be \`[Part Name](add-part:Category|ID|Price|https://firebasestorage.com/.../o/parts%2Fgpu%2F...)\`.
- CRITICAL: Never decode or 'fix' the image URL. Slashes MUST remain as \`%2F\` in the URL.
- SPEECH BUBBLES: To keep things readable, break your thoughts into logical steps. If you search for something, explain your search in one step, and provide the results in the next. The UI will automatically render these as separate bubbles.
`;

        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error("AI API Key is missing. Please check your .env file.");
            return new Response(JSON.stringify({ error: "AI service is currently unavailable" }), { status: 500 });
        }

        const googleProvider = createGoogleGenerativeAI({
            apiKey: apiKey,
        });

        const recentMessages = messages.slice(-10);

        const result = await streamText({
            model: googleProvider('gemini-2.5-flash'),
            maxOutputTokens: 1000,
            messages: await convertToModelMessages(recentMessages),
            system: systemInstruction,
            tools: {
                searchInventory: tool({
                    description: "Search the live store database for PC parts by category to find exact matching parts to recommend to the user. Use searchTerm to filter for specific models.",
                    inputSchema: z.object({
                        category: z.enum(['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler', 'monitor', 'keyboard', 'mouse', 'headset']),
                        searchTerm: z.string().optional().describe("The specific model name or keywords to filter by"),
                    }),
                    execute: async ({ category, searchTerm }) => {
                        console.log(`[Tool: searchInventory] Searching for ${category} with term: "${searchTerm}"`);
                        const inventory = await getInventoryFromFirestore(category, searchTerm);
                        return inventory;
                    },
                }),
            },
            stopWhen: stepCountIs(5), // Allow for tool calling loops automatically
        });

        return result.toUIMessageStreamResponse();

    } catch (error) {
        console.error("Error in chat route:", error);
        return new Response(JSON.stringify({ error: "Failed to process chat request" }), { status: 500 });
    }
}

