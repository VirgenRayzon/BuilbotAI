'use server';
/**
 * @fileOverview This file defines a Genkit flow for the AI Build Advisor chatbot,
 * providing initial recommendations for core PC components based on user goals.
 *
 * - aiBuildAdvisorRecommendations - A function that handles the AI-powered component recommendation process.
 * - AiBuildAdvisorRecommendationsInput - The input type for the aiBuildAdvisorRecommendations function.
 * - AiBuildAdvisorRecommendationsOutput - The return type for the aiBuildAdvisorRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
      'The approximate budget for the PC build (e.g., "around $1000", "high-end, no budget limit", "budget-friendly under $700").'
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
  }),
  gpu: z.object({
    model: z.string().describe('The recommended GPU model name.'),
    description: z.string().describe('A brief explanation for the GPU recommendation.'),
  }),
  motherboard: z.object({
    model: z.string().describe('The recommended Motherboard model name.'),
    description: z.string().describe('A brief explanation for the Motherboard recommendation, highlighting compatibility with CPU and RAM.'),
  }),
  ram: z.object({
    model: z.string().describe('The recommended RAM model and specifications (e.g., "Corsair Vengeance RGB DDR5 32GB (2x16GB) 6000MHz").'),
    description: z.string().describe('A brief explanation for the RAM recommendation, including type and speed considerations.'),
  }),
  storage: z.object({
    model: z.string().describe('The recommended Storage (SSD/HDD) model name.'),
    description: z.string().describe('A brief explanation for the Storage recommendation.'),
  }),
  psu: z.object({
    model: z.string().describe('The recommended Power Supply Unit (PSU) model name.'),
    description: z.string().describe('A brief explanation for the PSU recommendation.'),
  }),
  case: z.object({
    model: z.string().describe('The recommended PC Case model name.'),
    description: z.string().describe('A brief explanation for the Case recommendation.'),
  }),
  cooler: z.object({
    model: z.string().describe('The recommended CPU Cooler model name.'),
    description: z.string().describe('A brief explanation for the Cooler recommendation.'),
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
  prompt: `You are an expert PC building advisor. Your goal is to recommend a set of compatible core components (CPU, GPU, Motherboard, RAM, Storage, PSU, Case, Cooler) for a user based on their specific needs. Ensure all recommended components are compatible with each other.\n\nProvide a brief summary of the overall build strategy, and then detail the recommendations for each component, including the model name and a concise reason for its selection. Also provide an estimated total wattage for the build.\n\nUser's PC building goals:\nIntended Use: {{{intendedUse}}}\nBudget: {{{budget}}}\nDesired Performance Level: {{{performanceLevel}}}\n{{#if additionalNotes}}\nAdditional Notes: {{{additionalNotes}}}\n{{/if}}\n\nPlease format your response as a JSON object strictly following the output schema provided.`,
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
