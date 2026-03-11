'use server';

import { ai } from "@/ai/genkit";
import { z } from "genkit";


import { calculateBottleneck } from "@/lib/bottleneck";
import { checkCompatibility } from "@/lib/compatibility";
import { retrieveLocalKnowledge } from "@/lib/knowledge-retriever";

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

const aiBuildCritiqueOutputSchema = z.object({
    prosCons: z.object({
        pros: z.array(z.string()),
        cons: z.array(z.string()),
    }),
    bottleneckAnalysis: z.string(),
    fpsEstimates: z.array(z.object({
        game: z.string(),
        resolutions: z.array(z.object({
            resolution: z.string(),
            estimatedFps: z.string(),
            details: z.string().optional(),
        })).optional(),
    })),
    suggestions: z.array(z.object({
        originalComponent: z.string(),
        suggestedComponent: z.string(),
        reason: z.string(),
    })),
});

export async function aiBuildCritiqueAction(input: AiBuildCritiqueInput) {
    if (!process.env.GOOGLE_API_KEY) {
        throw new Error("Missing GOOGLE_API_KEY for Build Critique.");
    }

    // 1. Perform deterministic analysis
    const bottleneck = calculateBottleneck(input as any);
    const compatibilityIssues = checkCompatibility(input as any);

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

    const analysisContext = `
DETERMINISTIC ANALYSIS RESULTS:
- Bottleneck Status: ${bottleneck.status}
- Bottleneck Message: ${bottleneck.message}
- Compatibility Issues: ${compatibilityIssues.length > 0 ? compatibilityIssues.map(i => `[${i.severity.toUpperCase()}] ${i.message}`).join('; ') : 'None detected'}

${knowledgeContext ? `EXPERT LOCAL KNOWLEDGE BASE:\n${knowledgeContext}` : ''}
`;

    const prompt = `
You are an expert PC building consultant. Analyze the following PC build and provide a detailed critique.
Use the provided DETERMINISTIC ANALYSIS RESULTS and EXPERT LOCAL KNOWLEDGE BASE as the primary ground truth for technical compatibility, hardware balancing, and part tiering.

Current Build:
${buildContext}

${analysisContext}

1. Pros and Cons: List the strong points and weak points of the build. Incorporate any deterministic compatibility issues here.
2. Bottleneck Analysis: Expand on the provided bottleneck result. Explain what it means for the user's experience and how they might fix it. Use the provided Expert Local Knowledge Base on bottlenecks if available.
3. FPS Estimates: Provide estimated frames per second for 3 popular, modern, demanding games based on the build's performance tier. If you are unsure about exact FPS, use the "googleSearch" tool to find recent benchmarks for this CPU/GPU combination.
4. Suggestions: Suggest alternative parts that would improve the build's value, performance, or fix any severe bottlenecks/compatibility issues.

If you cannot find the answer in your general knowledge or the provided context, you MUST use the "googleSearch" tool to search the web for PC building advice, benchmark results, or component reviews to ensure your critique is accurate.

If the build is completely empty, state that the user needs to select parts first.`;

    try {
        // Stage 1: Analyze and Search (Text Output)
        const analysisPrompt = `${prompt}\n\nProvide your analysis in clear text including the pros/cons, bottleneck explanation, FPS estimates, and suggestions. Use Google Search if you need benchmarks or specific info.`;

        const analysisResponse = await ai.generate({
            prompt: analysisPrompt,
            config: {
                temperature: 0.2,
                googleSearchRetrieval: {}
            },
        });

        const analysisText = analysisResponse.text;

        // Stage 2: Format to JSON (Structured Output)
        const formatPrompt = `Convert the following PC build analysis into a structured JSON object.
        
Analysis:
${analysisText}

Required Output Schema:
- prosCons: { pros: string[], cons: string[] }
- bottleneckAnalysis: string (IMPORTANT: Preserve and format using full Markdown. Use **bolding**, \`code\`, and - bullet points for readability. Add newlines/paragraphs where appropriate.)
- fpsEstimates: { game: string, resolutions: { resolution: string, estimatedFps: string (IMPORTANT: STRICTLY ONLY numbers/range, e.g. "60-80" or "120+". NO sentences, NO "FPS" text, NO "around"), details: string (IMPORTANT: Put all context, DLSS info, and explanations here) }[] }[]
- suggestions: { originalComponent: string, suggestedComponent: string, reason: string }[]

Output ONLY the JSON.`;

        const formatResponse = await ai.generate({
            prompt: formatPrompt,
            output: {
                schema: aiBuildCritiqueOutputSchema,
            },
            config: {
                temperature: 0,
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
