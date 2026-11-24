import { z } from 'zod';

export const SuggestionSchema = z.object({
    originalComponent: z.string(),
    suggestedComponent: z.string(),
    suggestedPartId: z.string().optional().describe("The exact ID from the [ID: ...] section in the menu"),
    reason: z.string(),
});

export const aiBuildCritiqueOutputSchema = z.object({
    pros: z.array(z.string()),
    cons: z.array(z.string()),
    bottleneck: z.object({
        analysis: z.string(),
    }),
    fpsEstimates: z.array(z.object({
        game: z.string(),
        fps: z.string(),
        settings: z.string(),
    })),
    suggestions: z.array(SuggestionSchema),
});

export type AiBuildCritiqueOutput = z.infer<typeof aiBuildCritiqueOutputSchema>;
