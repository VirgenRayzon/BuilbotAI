'use server';
/**
 * @fileOverview This file defines a Genkit flow for the AI Build Advisor chatbot,
 * providing initial recommendations for core PC components based on user goals.
 *
 * - aiBuildAdvisorRecommendations - A function that handles the AI-powered component recommendation process.
 * - AiBuildAdvisorRecommendationsInput - The input type for the aiBuildAdvisorRecommendations function.
 * - AiBuildAdvisorRecommendationsOutput - The return type for the aiBuildAdvisorRecommendations function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema Definition
const AiBuildAdvisorRecommendationsInputSchema = z.object({
  intendedUse: z
    .string()
    .describe(
      'The primary intended use of the PC (e.g., gaming, video editing, software development, general office work).'
    ),
  budget: z
    .string()
    .describe(
      'The approximate budget for the PC build in Philippine Peso (PHP) (e.g., "around ₱50,000", "75k PHP budget").'
    ),
  performanceLevel: z
    .string()
    .describe(
      'The desired performance level (e.g., "high performance for 4K gaming", "good for 1080p gaming", "reliable for daily tasks").'
    ),
  additionalNotes: z
    .string()
    .optional()
    .describe('Any additional specific requirements or preferences from the user.'),
});
export type AiBuildAdvisorRecommendationsInput = z.infer<
  typeof AiBuildAdvisorRecommendationsInputSchema
>;

// Output Schema Definition
const AiBuildAdvisorRecommendationsOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      'A brief overall summary of the recommended build strategy and its compatibility.'
    ),
  cpu: z.object({
    model: z.string().describe('The recommended CPU model name.'),
    description: z.string().describe('A brief explanation for the CPU recommendation.'),
    estimatedPrice: z.number().describe('The estimated price in PHP for this component.'),
  }),
  gpu: z.object({
    model: z.string().describe('The recommended GPU model name.'),
    description: z.string().describe('A brief explanation for the GPU recommendation.'),
    estimatedPrice: z.number().describe('The estimated price in PHP for this component.'),
  }),
  motherboard: z.object({
    model: z.string().describe('The recommended Motherboard model name.'),
    description: z.string().describe('A brief explanation for the Motherboard recommendation, highlighting compatibility with CPU and RAM.'),
    estimatedPrice: z.number().describe('The estimated price in PHP for this component.'),
  }),
  ram: z.object({
    model: z.string().describe('The recommended RAM model and specifications (e.g., "Corsair Vengeance RGB DDR5 32GB (2x16GB) 6000MHz").'),
    description: z.string().describe('A brief explanation for the RAM recommendation, including type and speed considerations.'),
    estimatedPrice: z.number().describe('The estimated price in PHP for this component.'),
  }),
  storage: z.object({
    model: z.string().describe('The recommended Storage (SSD/HDD) model name.'),
    description: z.string().describe('A brief explanation for the Storage recommendation.'),
    estimatedPrice: z.number().describe('The estimated price in PHP for this component.'),
  }),
  psu: z.object({
    model: z.string().describe('The recommended Power Supply Unit (PSU) model name.'),
    description: z.string().describe('A brief explanation for the PSU recommendation.'),
    estimatedPrice: z.number().describe('The estimated price in PHP for this component.'),
  }),
  case: z.object({
    model: z.string().describe('The recommended PC Case model name.'),
    description: z.string().describe('A brief explanation for the Case recommendation.'),
    estimatedPrice: z.number().describe('The estimated price in PHP for this component.'),
  }),
  cooler: z.object({
    model: z.string().describe('The recommended CPU Cooler model name.'),
    description: z.string().describe('A brief explanation for the Cooler recommendation.'),
    estimatedPrice: z.number().describe('The estimated price in PHP for this component.'),
  }),
  estimatedWattage: z.string().describe('The estimated total wattage for the build, in the format "550W".'),
});
export type AiBuildAdvisorRecommendationsOutput = z.infer<
  typeof AiBuildAdvisorRecommendationsOutputSchema
>;

// Wrapper function to call the Genkit flow
export async function aiBuildAdvisorRecommendations(
  input: AiBuildAdvisorRecommendationsInput
): Promise<AiBuildAdvisorRecommendationsOutput> {
  return aiBuildAdvisorRecommendationsFlow(input);
}

// Prompt Definition
const aiBuildAdvisorRecommendationsPrompt = ai.definePrompt({
  name: 'aiBuildAdvisorRecommendationsPrompt',
  input: { schema: AiBuildAdvisorRecommendationsInputSchema },
  output: { schema: AiBuildAdvisorRecommendationsOutputSchema },
  prompt: `You are an expert PC building advisor specializing in the Philippine market. Your goal is to recommend a set of compatible core components (CPU, GPU, Motherboard, RAM, Storage, PSU, Case, Cooler) for a user based on their specific needs.

CRITICAL RULES:
1. CURRENCY: All price discussions and budget considerations MUST be in Philippine Peso (PHP). Use the ₱ symbol.
2. LOCAL PRICING: Provide estimated prices that reflect the current PC component market in the Philippines (e.g., shops like Dynaquest, PCHub, Gilmore prices).
3. INVENTORY AVAILABILITY: Only recommend parts that are commonly available in standard PC parts inventories. If the user provides a specific inventory, prioritize items from that list.
4. COMPATIBILITY: Ensure all recommended components are 100% compatible.
5. BUDGET ADHERENCE: Strictly follow the PHP budget provided by the user.

Provide a brief summary of the overall build strategy in the context of the Philippine market, and then detail the recommendations for each component, including the model name, estimated PHP price, and a concise reason for its selection (mentioning why it's a good value in PHP where applicable). Also provide an estimated total wattage for the build.

User's PC building goals:
Intended Use: {{{intendedUse}}}
Budget: {{{budget}}} (PHP)
Desired Performance Level: {{{performanceLevel}}}
{{#if additionalNotes}}
Additional Notes: {{{additionalNotes}}}
{{/if}}

Please format your response as a JSON object strictly following the output schema provided. The estimatedPrice for each component must be a realistic PHP price number (not a string).`,
});

// Genkit Flow Definition
const aiBuildAdvisorRecommendationsFlow = ai.defineFlow(
  {
    name: 'aiBuildAdvisorRecommendationsFlow',
    inputSchema: AiBuildAdvisorRecommendationsInputSchema,
    outputSchema: AiBuildAdvisorRecommendationsOutputSchema,
  },
  async (input) => {
    const { output } = await aiBuildAdvisorRecommendationsPrompt(input);
    if (!output) {
      throw new Error('Failed to get recommendations from the AI.');
    }
    return output;
  }
);
