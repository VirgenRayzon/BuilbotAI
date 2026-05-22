'use server';

import { ai } from "@/ai/genkit";
import { z } from "genkit";

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

const AiPrebuiltPerformanceInputSchema = z.record(
    z.string(),
    z.union([ComponentDataSchema, z.array(ComponentDataSchema), z.null()])
);

export type AiPrebuiltPerformanceInput = z.infer<typeof AiPrebuiltPerformanceInputSchema>;

/**
 * Unified Output Schema for the Prebuilt Performance Analysis.
 * As requested, this strictly only returns Pros/Strengths.
 */
const aiPrebuiltPerformanceOutputSchema = z.object({
    pros: z.array(z.string()),
});

export const aiPrebuiltPerformance = ai.defineFlow(
    {
        name: "aiPrebuiltPerformance",
        inputSchema: AiPrebuiltPerformanceInputSchema,
        outputSchema: aiPrebuiltPerformanceOutputSchema,
    },
    async (input) => {
        const result = await aiPrebuiltPerformanceAction(input);
        return result;
    }
);

export async function aiPrebuiltPerformanceAction(input: AiPrebuiltPerformanceInput) {
    if (!process.env.GOOGLE_API_KEY) {
        throw new Error("Missing GOOGLE_API_KEY for Performance Analysis.");
    }

    const buildContext = Object.entries(input)
        .map(([category, partData]) => {
            if (!partData) return `${category}: None selected`;
            if (Array.isArray(partData)) {
                return `${category}: ${partData.map((p: any) => `${p.brand || ''} ${p.model}`).join(', ')}`;
            }
            const singlePart = partData as any;
            return `${category}: ${singlePart.brand || ''} ${singlePart.model}`;
        })
        .join('\n');

    const prompt = `
You are an enthusiastic and expert PC building marketer and mentor. Analyze the prebuilt PC provided and give an inspiring list of its absolute best strengths.
Since this is for a prebuilt sales page, the tone should be highly supportive, exciting, and authoritative about its capabilities.

STRENGTHS (EXPRESSED WITH EXPERTISE):
- Highlight the synergy, raw power, and specific use cases this build excels at.
- Be specific about what makes these particular components great together.
- DO NOT list any cons, bottlenecks, or limitations. Only focus on the absolute pros.

Current Build:
${buildContext}

1. Strengths: Provide a detailed list of at least 3-5 distinct strengths.
`;

    try {
        // Step 1: Plain-text research call WITH googleSearchRetrieval (no structured output)
        console.log("[AI Prebuilt Performance] Step 1: Running web search pre-research for component capabilities...");
        const researchResponse = await ai.generate({
            model: 'googleai/gemini-2.5-flash',
            prompt: `You are a PC hardware expert and technology journalist. Research the following prebuilt PC build and provide an enthusiastic analysis of its strengths and capabilities:

Current Build:
${buildContext}

Search for:
1. The specific capabilities and market position of each component.
2. What makes this combination of components particularly powerful or well-suited.
3. Benchmark highlights and real-world performance data.
4. Any notable features or technologies these components support.

Provide detailed, enthusiastic findings focusing ONLY on the strengths and positive aspects.`,
            config: {
                temperature: 0.3,
                googleSearchRetrieval: {},
            },
        });
        const webResearchContext = researchResponse.text;
        console.log("[AI Prebuilt Performance] Step 1 complete. Research context obtained.");

        // Step 2: Structured output prompt WITHOUT googleSearchRetrieval
        console.log("[AI Prebuilt Performance] Step 2: Generating structured strengths...");
        const consolidatedPrompt = `${prompt}

WEB RESEARCH CONTEXT (Use this data to provide accurate, specific strengths):
${webResearchContext}

RESEARCH & ANALYSIS INSTRUCTIONS:
- Use the web research context above to verify specific component capabilities and market positions.
- Analyze the prebuilt for its absolute best strengths.
- Format your final findings strictly into the requested JSON schema.

REQUIRED OUTPUT SCHEMA:
- pros: string[] (Array of the strengths/pros)

Output strictly the JSON object.`;

        const response = await ai.generate({
            model: 'googleai/gemini-2.5-flash',
            prompt: consolidatedPrompt,
            output: {
                schema: aiPrebuiltPerformanceOutputSchema,
            },
            config: {
                temperature: 0.3,
            },
        });

        if (!response.output) {
            throw new Error("AI returned empty output during prebuilt performance analysis.");
        }

        return response.output;

    } catch (error: any) {
        console.error("AI Prebuilt Performance Analysis failed:", error);
        throw error;
    }
}

