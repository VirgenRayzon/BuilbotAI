'use server';

import { z } from "genkit";


import { calculateBottleneck } from "@/lib/bottleneck";
import { checkCompatibility } from "@/lib/compatibility";

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

import { ai } from "@/ai/genkit";

const AiBuildCritiqueOutputSchema = z.object({
    prosCons: z.object({
        pros: z.array(z.string()),
        cons: z.array(z.string()),
    }),
    bottleneckAnalysis: z.string(),
    fpsEstimates: z.array(z.object({
        game: z.string(),
        resolution: z.string(),
        estimatedFps: z.string(),
    })),
    suggestions: z.array(z.object({
        originalComponent: z.string(),
        suggestedComponent: z.string(),
        reason: z.string(),
    })),
});

export type AiBuildCritiqueOutput = z.infer<typeof AiBuildCritiqueOutputSchema>;

export async function aiBuildCritiqueAction(input: AiBuildCritiqueInput): Promise<AiBuildCritiqueOutput> {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("Missing GEMINI_API_KEY for Build Critique.");
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

    const analysisContext = `
DETERMINISTIC ANALYSIS RESULTS:
- Bottleneck: ${bottleneck.message} (Raw Score: ${bottleneck.score}, Type: ${bottleneck.type})
- Compatibility Issues: ${compatibilityIssues.length > 0 ? compatibilityIssues.map(i => `[${i.severity.toUpperCase()}] ${i.message}`).join('; ') : 'None detected'}
`;

    const prompt = `
You are an expert PC building consultant. Analyze the following PC build and provide a detailed critique.
Use the provided DETERMINISTIC ANALYSIS RESULTS as the ground truth for technical compatibility and hardware balancing.

Current Build:
${buildContext}

${analysisContext}

Please provide your analysis strictly outputting valid JSON matching the requested format.

1. Pros and Cons: List the strong points and weak points of the build. Incorporate any deterministic compatibility issues here.
2. Bottleneck Analysis: Expand on the provided bottleneck result. Explain what it means for the user's experience and how they might fix it.
3. FPS Estimates: Provide estimated frames per second for 3 popular, modern, demanding games based on the build's performance tier.
4. Suggestions: Suggest alternative parts that would improve the build's value, performance, or fix any severe bottlenecks/compatibility issues.

If the build is completely empty, state that the user needs to select parts first.`;

    try {
        const { output } = await ai.generate({
            prompt,
            output: {
                schema: AiBuildCritiqueOutputSchema,
            },
            config: {
                temperature: 0.2,
            }
        });

        if (!output) {
            throw new Error("AI returned empty output.");
        }

        return output;

    } catch (error: any) {
        console.error("AI Build Critique failed:", error);
        throw error;
    }
}

