'use server';
/**
 * @fileOverview A Genkit flow for providing AI assistance for building a pre-built PC.
 *
 * - aiPrebuiltAdvisor - A function that validates a set of components and suggests a name, description, and price.
 * - AiPrebuiltAdvisorInput - The input type for the aiPrebuiltAdvisor function.
 * - AiPrebuiltAdvisorOutput - The return type for the aiPrebuiltAdvisor function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getGenkitModelName } from '@/lib/ai-model-resolver';

const ComponentInputSchema = z.object({
  cpu: z.string().optional(),
  gpu: z.string().optional(),
  motherboard: z.string().optional(),
  ram: z.string().optional(),
  storage: z.string().optional(),
  psu: z.string().optional(),
  case: z.string().optional(),
  cooler: z.string().optional(),
});

const AiPrebuiltAdvisorInputSchema = z.object({
  components: ComponentInputSchema,
  tier: z.string().optional(),
  inventoryPrice: z.number().nonnegative().optional(),
  productHighlights: z.string().optional(),
});
export type AiPrebuiltAdvisorInput = z.infer<typeof AiPrebuiltAdvisorInputSchema>;

const AiPrebuiltAdvisorOutputSchema = z.object({
  description: z.string().min(1).describe('A concise 2-3 sentence prebuilt product description synthesized from every selected component product description.'),
  systemName: z.string().optional(),
  price: z.number().optional(),
  tier: z.enum(['Entry', 'Mid-Range', 'High-End', 'Workstation']).optional(),
});
export type AiPrebuiltAdvisorOutput = z.infer<typeof AiPrebuiltAdvisorOutputSchema>;

export async function aiPrebuiltAdvisor(input: AiPrebuiltAdvisorInput): Promise<AiPrebuiltAdvisorOutput> {
  return aiPrebuiltAdvisorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiPrebuiltAdvisorPrompt',
  input: {
    schema: AiPrebuiltAdvisorInputSchema,
  },
  output: { schema: AiPrebuiltAdvisorOutputSchema },
  model: 'googleai/gemini-2.5-flash',
  config: {
    temperature: 0.2,
    // Gemini 2.5 uses part of this budget for internal reasoning. A complete
    // eight-part build with product highlights can otherwise be truncated
    // after `systemName`, which makes the required structured output invalid.
    maxOutputTokens: 1024,
    thinkingConfig: {
      thinkingBudget: 0,
    },
  },
  prompt: `You write concise product descriptions for complete prebuilt PCs.

Synthesize the saved descriptions of ALL selected components into one cohesive, customer-facing description of 2-3 sentences. Mention meaningful combined benefits, performance positioning, cooling, power delivery, storage, and aesthetics only when supported by the supplied text. Do not list the parts, do not search the web, do not invent specifications, and do not return analysis.

{{#if productHighlights}}
SELECTED COMPONENT PRODUCT DESCRIPTIONS:
{{{productHighlights}}}
{{/if}}

Return a JSON object with the required description field.`,
});

const aiPrebuiltAdvisorFlow = ai.defineFlow(
  {
    name: 'aiPrebuiltAdvisorFlow',
    inputSchema: AiPrebuiltAdvisorInputSchema,
    outputSchema: AiPrebuiltAdvisorOutputSchema,
  },
  async (input) => {
    // If no components are provided, we can't do much.
    if (Object.values(input.components).every(c => !c)) {
      throw new Error('At least one component must be selected to get an AI suggestion.');
    }

    const componentNames = Object.values(input.components)
      .filter(c => c !== undefined && c !== '')
      .join(' ');

    console.log(`[aiPrebuiltAdvisorFlow] Starting analysis for: ${componentNames}`);

    try {
      const dynamicModel = await getGenkitModelName('prebuiltAdvisor');

      console.log(`[aiPrebuiltAdvisorFlow] Generating structured analysis with ${dynamicModel}...`);

      const { output } = await prompt({
        ...input,
      }, { model: dynamicModel });

      if (!output) {
        throw new Error('Failed to get suggestions from the AI.');
      }

      console.log("[aiPrebuiltAdvisorFlow] Flow complete.");
      return output;
    } catch (error: any) {
      console.error("[aiPrebuiltAdvisorFlow] Description generation failed:", error);
      throw error;
    }
  }
);
