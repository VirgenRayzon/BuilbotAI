import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/ai/genkit";
import { z } from "genkit";
import { retrieveLocalKnowledge } from "@/lib/knowledge-retriever";
import { getInventoryFromFirestore } from "@/lib/inventory-fetcher";

export const maxDuration = 60; // Set max duration for Vercel/Next.js to allow longer generation

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { messages, buildContext } = body;

        // Ensure we have a valid last message
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: "No messages provided" }, { status: 400 });
        }

        const lastMessage = messages[messages.length - 1];
        
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

        // Retrieve background knowledge using the last message content and only the specifically listed parts (optimizing context)
        const queryTerms = `${lastMessage.text}`; 
        const localKnowledge = await retrieveLocalKnowledge(queryTerms);
        
        const knowledgeText = localKnowledge.length > 0
            ? `\n\nEXPERT KNOWLEDGE BASE:\n${localKnowledge.join('\n\n')}`
            : '';

        // Define Tool
        const searchInventoryTool = ai.defineTool(
            {
                name: "searchInventory",
                description: "Search the live store database for PC parts by category to find exact matching parts to recommend to the user.",
                inputSchema: z.object({
                    category: z.enum(['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler', 'monitor', 'keyboard', 'mouse', 'headset']),
                }),
                outputSchema: z.array(z.string()),
            },
            async (input) => {
                const inventory = await getInventoryFromFirestore(input.category);
                return inventory;
            }
        );

        // Construct System Prompt
        const systemInstruction = `You are a helpful, expert PC building assistant named "Buildbot AI".
You are chatting with a user who is currently building a PC.
${formattedContext}
${knowledgeText}

INSTRUCTIONS:
- Review the EXPERT KNOWLEDGE BASE for any specific info on parts or topics the user asks about (bottlenecks, tier lists, etc.).
- If the user asks for a recommendation or you want to suggest a part, you MUST use the \`searchInventory\` tool to fetch real parts from the store first. Do not make up parts.
- The \`searchInventory\` tool returns the current Price of the items in Philippine Pesos (₱/PHP). Use this price to filter and provide accurate recommendations when the user mentions a specific budget (e.g., "around 20k" means ₱20,000).
- Keep your answers concise, informative, and formatted clearly with Markdown (e.g., bolding part names).
- CRITICAL: If you suggest a specific part for the user to add to their build, you MUST output an interactive markdown link with \`add-part:\` followed by the Category, ID, Price, and Image URL, separated by pipes \`|\` (NO spaces anywhere in the URL).
  For example, if the tool gives you \`[ID: xyz123] [GPU] Name: "Sapphire Pulse RX 7700 XT" - Price: ₱45,000 - Image: "https://example.com/img.png"\`, write exactly this:
  \`[Sapphire Pulse RX 7700 XT](add-part:GPU|xyz123|₱45,000|https://example.com/img.png)\`
- Do not use \`add-part:\` links for general topics or non-specific items, ONLY use it for exact parts retrieved from the inventory tool.
`;

        // Format history for Genkit
        const history = messages.slice(0, -1).map((msg: any) => ({
            role: (msg.role === 'user' ? 'user' : 'model') as 'user' | 'model',
            content: [{ text: msg.text }]
        }));

        // Generate Stream
        const { stream } = await ai.generateStream({
            prompt: lastMessage.text,
            system: systemInstruction,
            messages: history,
            tools: [searchInventoryTool],
            config: {
                temperature: 0.7,
            }
        });

        // Convert Genkit stream to standard Web ReadableStream
        const encoder = new TextEncoder();
        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        if (chunk.text) {
                            controller.enqueue(encoder.encode(chunk.text));
                        }
                    }
                } catch (err) {
                    console.error("Streaming error:", err);
                    controller.error(err);
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(readableStream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache, no-transform",
            },
        });

    } catch (error) {
        console.error("Error in chat route:", error);
        return NextResponse.json({ error: "Failed to process chat request" }, { status: 500 });
    }
}
