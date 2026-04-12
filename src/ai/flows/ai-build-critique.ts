'use server';

import { ai } from "@/ai/genkit";
import { z } from "genkit";

import { calculateBottleneck } from "@/lib/bottleneck";
import { checkFullBuildCompatibility } from "@/lib/compatibility";
import { retrieveLocalKnowledge } from "@/lib/knowledge-retriever";
import { getInventoryFromFirestore } from "@/lib/inventory-fetcher";

const ComponentDataSchema = z.object({
    model: z.string(),
    price: z.number(),
    brand: z.string().optional(),
    category: z.string().optional(),
    wattage: z.number().optional(),
    performanceScore: z.number().optional(),
    performanceTier: z.number().optional(),
    socket: z.string().optional(),
    ramType: z.string().optional(),
    dimensions: z.object({
        width: z.number(),
        height: z.number(),
        depth: z.number(),
    }).optional(),
    specifications: z.record(z.string(), z.any()).optional(),
});

const AiBuildCritiqueInputSchema = z.record(
    z.string(),
    z.union([ComponentDataSchema, z.array(ComponentDataSchema), z.null()])
);

export type AiBuildCritiqueInput = z.infer<typeof AiBuildCritiqueInputSchema>;

const SuggestionSchema = z.object({
    originalComponent: z.string(),
    suggestedComponent: z.string(),
    suggestedPartId: z.string().optional().describe("The exact ID from the [ID: ...] section in the menu"),
    reason: z.string(),
});

/**
 * Unified Output Schema for the AI Critique.
 */
const aiBuildCritiqueOutputSchema = z.object({
    pros: z.array(z.string()),
    cons: z.array(z.string()),
    bottleneck: z.object({
        analysis: z.string(),
    }),
    fpsEstimates: z.array(z.object({
        game: z.string(),
        fps: z.string(),
        settings: z.string()
    })),
    suggestions: z.array(SuggestionSchema)
});

export const aiBuildCritique = ai.defineFlow(
    {
        name: "aiBuildCritique",
        inputSchema: AiBuildCritiqueInputSchema,
        outputSchema: aiBuildCritiqueOutputSchema,
    },
    async (input) => {
        const result = await aiBuildCritiqueAction(input);
        return result;
    }
);

export async function aiBuildCritiqueAction(input: AiBuildCritiqueInput) {
    if (!process.env.GOOGLE_API_KEY) {
        throw new Error("Missing GOOGLE_API_KEY for Build Critique.");
    }

    // 1. Perform deterministic analysis
    const bottleneck = calculateBottleneck(input as any);
    const compatibilityIssues = checkFullBuildCompatibility(input as any);

    const buildContext = Object.entries(input)
        .map(([category, partData]) => {
            if (!partData) return `${category}: None selected`;
            if (Array.isArray(partData)) {
                return `${category}: ${partData.map((p: any) => `${p.brand || ''} ${p.model} ($${p.price})`).join(', ')}`;
            }
            const singlePart = partData as any;
            return `${category}: ${singlePart.brand || ''} ${singlePart.model} ($${singlePart.price})`;
        })
        .join('\n');

    // 2. Retrieve local knowledge based on the components
    const componentNames = Object.values(input)
        .flat()
        .filter(p => p !== null)
        .map((p: any) => p.model)
        .join(' ');

    const knowledgeResults = await retrieveLocalKnowledge(`bottleneck compatibility ${componentNames}`);
    const knowledgeContext = knowledgeResults.join('\n\n');

    // 3. Fetch store inventory exclusively from Live Firestore
    const buildCategories = Object.keys(input);
    const inventoryResults = await Promise.all(
        buildCategories.map(cat => getInventoryFromFirestore(cat, 20))
    );
    const storeInventory = inventoryResults.flat().join('\n');

    const analysisContext = `
DETERMINISTIC ANALYSIS RESULTS:
- Bottleneck Status: ${bottleneck.status}
- Bottleneck Message: ${bottleneck.message}
- Compatibility Issues: ${compatibilityIssues.length > 0 ? compatibilityIssues.map(i => `[${i.severity.toUpperCase()}] ${i.message}`).join('; ') : 'None detected'}

${knowledgeContext ? `EXPERT LOCAL KNOWLEDGE BASE:\n${knowledgeContext}` : ''}

STORE_INVENTORY_MENU (MANDATORY SOURCE FOR SUGGESTIONS):
The following parts are EXACTLY what is available in our store. 
Use the text inside the quotes for 'Name' as your suggestedComponent and the text after 'ID:' as your suggestedPartId.
${storeInventory || "No local inventory data found."}
`;

    const prompt = `
You are an encouraging and expert PC building mentor. Analyze the PC build provided and give a detailed, balanced critique. 
Since some users are beginners, your tone should be supportive and optimistic.

PROS (EXPRESSED WITH EXPERTISE):
- Highlight the synergy and longevity of the build.

CONS & CONSIDERATIONS (CONSTRUCTIVE & SOFTENED):
- Frame issues as "Optimization Opportunities."

Current Build:
${buildContext}

${analysisContext}

1. Pros and Cons: Provide a detailed list.
2. Bottleneck Analysis: Explain the bottleneck balance.
3. FPS Estimates: Provide estimates for 3 modern games (1440p or 4K preferred).
4. Suggestions: Recommend alternatives that provide better value or perfect the build.
   MANDATORY RULE FOR SUGGESTIONS: 
   - You MUST ONLY suggest parts that are listed in the STORE_INVENTORY_MENU provided above. 
   - OPTIMIZATION RULE: If a component is already top-of-the-line (e.g., flagship CPUs/GPUs) or perfectly balanced for the build's budget/purpose, DO NOT provide a suggestion for that category. 
   - EMPTY SUGGESTIONS: If the entire build is already well-optimized or enthusiasts-grade with no meaningful upgrades available in the menu, return an EMPTY suggestions array []. Do not suggest lateral moves (e.g., suggesting a different brand of the same spec) unless there is a clear price or compatibility advantage.
   
   For the 'suggestedComponent' field, you MUST use the EXACT string provided in the 'Name' field. 
   For the 'suggestedPartId' field, you MUST provide the exact string found after 'ID: '.

If the build is completely empty, kindly invite the user to start picking out parts.`;

    try {
        // Stage 1: Analyze and Search (Text Output) - Tools are allowed here
        const analysisPrompt = `${prompt}\n\nProvide your analysis in clear text including the pros/cons, bottleneck explanation, FPS estimates, and suggestions. Use Google Search if you need benchmarks or specific info.`;

        const analysisResponse = await ai.generate({
            prompt: analysisPrompt,
            config: {
                temperature: 0.2, // Slightly higher for analysis
                googleSearchRetrieval: {}
            },
        });

        const analysisText = analysisResponse.text;

        // Stage 2: Format to JSON (Structured Output) - Tools are NOT allowed here
        const formatPrompt = `Convert the following PC build analysis into a structured JSON object.
        
Analysis:
${analysisText}

Required Output Schema:
- pros: string[]
- cons: string[]
- bottleneck: { analysis: string } (IMPORTANT: Preserve and format using full Markdown. Use **bolding**, \`code\`, and - bullet points for readability.)
- fpsEstimates: { game: string, fps: string (numeric only, e.g. "95-110"), settings: string (e.g. "1440p Ultra") }[]
- suggestions: { originalComponent: string, suggestedComponent: string, suggestedPartId: string, reason: string }[]

Output ONLY the JSON.`;

        const formatResponse = await ai.generate({
            prompt: formatPrompt,
            output: {
                schema: aiBuildCritiqueOutputSchema,
            },
            config: {
                temperature: 0, // Deterministic for formatting
            }
        });

        if (!formatResponse.output) {
            throw new Error("AI returned a null output during formatting.");
        }

        return formatResponse.output;

    } catch (error: any) {
        console.error("AI Build Critique failed:", error);
        throw error;
    }
}
