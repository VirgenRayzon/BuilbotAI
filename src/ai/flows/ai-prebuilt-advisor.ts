'use server';
/**
 * @fileOverview A Genkit flow for providing AI assistance for building a pre-built PC.
 *
 * - aiPrebuiltAdvisor - A function that validates a set of components and suggests a name, description, and price.
 * - AiPrebuiltAdvisorInput - The input type for the aiPrebuiltAdvisor function.
 * - AiPrebuiltAdvisorOutput - The return type for the aiPrebuiltAdvisor function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
});
export type AiPrebuiltAdvisorInput = z.infer<typeof AiPrebuiltAdvisorInputSchema>;

const AiPrebuiltAdvisorOutputSchema = z.object({
  systemName: z.string().describe('A catchy and appropriate name for the pre-built system.'),
  description: z.string().describe('A brief, engaging description of the pre-built system, highlighting its key strengths.'),
  price: z.number().describe('An estimated total price for the system in Philippine Pesos (PHP), based on the provided components.'),
  estimatedWattage: z.string().describe('The estimated total wattage for the build, in the format "550W".'),
  compatibilitySummary: z.string().describe('A summary of the component compatibility. Note any potential issues or bottlenecks. If everything is compatible, confirm that.'),
});
export type AiPrebuiltAdvisorOutput = z.infer<typeof AiPrebuiltAdvisorOutputSchema>;

export async function aiPrebuiltAdvisor(input: AiPrebuiltAdvisorInput): Promise<AiPrebuiltAdvisorOutput> {
  return aiPrebuiltAdvisorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiPrebuiltAdvisorPrompt',
  input: { schema: AiPrebuiltAdvisorInputSchema },
  output: { schema: AiPrebuiltAdvisorOutputSchema },
  prompt: `You are an expert PC Builder. A user has selected a list of components for a pre-built system.
Your task is to:
1.  Generate a creative and suitable name for this build (e.g., "The 1080p Powerhouse", "4K Video Editing Beast").
2.  Write a brief, appealing description for the system.
3.  Analyze the provided components for compatibility. Point out any issues (e.g., CPU socket not matching motherboard, RAM type mismatch, insufficient PSU). If they are compatible, confirm this.
4.  Estimate the total power consumption in watts (e.g., "550W").
5.  Estimate a reasonable market price for the entire build in Philippine Pesos (PHP).

The user has specified the build tier as: {{{tier}}}.

Here are the selected components:
{{#if components.cpu}}CPU: {{{components.cpu}}}{{/if}}
{{#if components.gpu}}GPU: {{{components.gpu}}}{{/if}}
{{#if components.motherboard}}Motherboard: {{{components.motherboard}}}{{/if}}
{{#if components.ram}}RAM: {{{components.ram}}}{{/if}}
{{#if components.storage}}Storage: {{{components.storage}}}{{/if}}
{{#if components.psu}}PSU: {{{components.psu}}}{{/if}}
{{#if components.case}}Case: {{{components.case}}}{{/if}}
{{#if components.cooler}}Cooler: {{{components.cooler}}}{{/if}}

Please provide the output in a JSON object that strictly adheres to the provided output schema. Ensure the price is a number.`,
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

    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to get suggestions from the AI.');
    }
    return output;
  }
);
