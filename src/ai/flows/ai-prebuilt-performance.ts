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
        // Stage 1: Analyze and Search
        const analysisPrompt = `${prompt}\n\nProvide your analysis in clear text focusing exclusively on the pros/strengths. Use Google Search if you need specific component capabilities to boast about.`;

        const analysisResponse = await ai.generate({
            model: 'googleai/gemini-3-flash-preview',
            prompt: analysisPrompt,
            config: {
                temperature: 0.3, // Slightly creative for marketing
                googleSearchRetrieval: {}
            },
        });

        const analysisText = analysisResponse.text;

        // Stage 2: Format to JSON
        const formatPrompt = `Convert the following PC build strengths into a structured JSON object.
        
Analysis:
${analysisText}

Required Output Schema:
- pros: string[] (Array of the strengths/pros)

Output ONLY the JSON.`;

        const formatResponse = await ai.generate({
            model: 'googleai/gemini-3-flash-preview',
            prompt: formatPrompt,
            output: {
                schema: aiPrebuiltPerformanceOutputSchema,
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
        console.error("AI Prebuilt Performance Analysis failed:", error);
        throw error;
    }
}
