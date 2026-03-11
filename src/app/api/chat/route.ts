import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/ai/genkit";
import { retrieveLocalKnowledge } from "@/lib/knowledge-retriever";

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

        // Retrieve background knowledge using the last message content and parts in the build context
        const queryTerms = `${lastMessage.text} ${formattedContext.replace(/\n|CURRENT BUILD CONTEXT:|:|None selected/g, ' ')}`;
        const localKnowledge = await retrieveLocalKnowledge(queryTerms);
        
        const knowledgeText = localKnowledge.length > 0
            ? `\n\nEXPERT KNOWLEDGE BASE:\n${localKnowledge.join('\n\n')}`
            : '';

        // Construct System Prompt
        const systemInstruction = `You are a helpful, expert PC building assistant named "Buildbot AI".
You are chatting with a user who is currently building a PC.
${formattedContext}
${knowledgeText}

INSTRUCTIONS:
- Review the EXPERT KNOWLEDGE BASE for any specific info on parts or topics the user asks about (bottlenecks, tier lists, etc.).
- Do not list off parts unless the user specifically asks for recommendations.
- Keep your answers concise, informative, and formatted clearly with Markdown (e.g., bolding part names).
- CRITICAL: If you suggest a specific part for the user to add to their build, you MUST output an interactive markdown link with \`add-part:\` as the URL protocol. For example, to recommend the Corsair 4000D Airflow, write exactly this:
  \`[Corsair 4000D Airflow](add-part:Corsair 4000D Airflow)\`
- Do not use \`add-part:\` links for general topics or non-specific items, ONLY for exact part model names.
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
