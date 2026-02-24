'use server';

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const ComponentDataSchema = z.object({
    model: z.string(),
    price: z.number(),
    brand: z.string().optional(),
    category: z.string().optional(),
});

const AiBuildCritiqueInputSchema = z.record(
    z.string(),
    z.union([ComponentDataSchema, z.array(ComponentDataSchema), z.null()])
);

export type AiBuildCritiqueInput = z.infer<typeof AiBuildCritiqueInputSchema>;

const aiBuildCritique = ai.defineFlow(
    {
        name: "aiBuildCritique",
        inputSchema: AiBuildCritiqueInputSchema,
        outputSchema: z.object({
            prosCons: z.object({
                pros: z.array(z.string()),
                cons: z.array(z.string()),
            }),
            bottleneckAnalysis: z.string(),
            fpsEstimates: z.array(
                z.object({
                    game: z.string(),
                    resolution: z.string(),
                    estimatedFps: z.string(),
                })
            ),
            suggestions: z.array(
                z.object({
                    originalComponent: z.string(),
                    suggestedComponent: z.string(),
                    reason: z.string(),
                })
            ),
        }),
    },
    async (input) => {
        const buildContext = Object.entries(input)
            .map(([category, partData]) => {
                if (!partData) return `${category}: None selected`;
                if (Array.isArray(partData)) {
                    return `${category}: ${partData.map((p: z.infer<typeof ComponentDataSchema>) => `${p.brand || ''} ${p.model} ($${p.price})`).join(', ')}`;
                }
                const singlePart = partData as z.infer<typeof ComponentDataSchema>;
                return `${category}: ${singlePart.brand || ''} ${singlePart.model} ($${singlePart.price})`;
            })
            .join('\n');

        const prompt = `
You are an expert PC building consultant. Analyze the following PC build and provide a detailed critique.

Current Build:
${buildContext}

Please provide your analysis strictly matching the requested JSON output format.
1. Pros and Cons: List the strong points and weak points of the build.
2. Bottleneck Analysis: Identify any significant bottlenecks (e.g., CPU too weak for GPU, insufficient RAM for modern gaming, PSU wattage concerns). Be concise but informative.
3. FPS Estimates: Provide estimated frames per second for 3 popular, modern, demanding games. Specify the resolution (e.g., 1080p Ultra, 1440p High) that makes the most sense for this build tier.
4. Suggestions: Suggest alternative parts that would improve the build's value, performance, or fix any severe bottlenecks.

If the build is completely empty, state that the user needs to select parts first in the pros/cons and leave the other fields empty or give generic advice.
`;

        const response = await ai.generate({
            prompt: prompt,
            output: {
                schema: z.object({
                    prosCons: z.object({
                        pros: z.array(z.string()),
                        cons: z.array(z.string()),
                    }),
                    bottleneckAnalysis: z.string(),
                    fpsEstimates: z.array(
                        z.object({
                            game: z.string(),
                            resolution: z.string(),
                            estimatedFps: z.string(),
                        })
                    ),
                    suggestions: z.array(
                        z.object({
                            originalComponent: z.string(),
                            suggestedComponent: z.string(),
                            reason: z.string(),
                        })
                    ),
                })
            }
        });

        if (!response.output) {
            throw new Error("AI returned a null output.");
        }
        return response.output;
    }
);

export async function aiBuildCritiqueAction(input: AiBuildCritiqueInput) {
    return aiBuildCritique(input);
}
