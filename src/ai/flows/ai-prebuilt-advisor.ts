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
import { retrieveLocalKnowledge } from "@/lib/knowledge-retriever";

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
  systemName: z.string().describe('An ultra-catchy, premium, and marketing-friendly name for the pre-built system (e.g., "Neon Vanguard", "Titan Elite V2").'),
  description: z.string().describe('A high-conversion, punchy description (2-3 sentences) that makes the user want to buy it instantly. Focus on performance breakthroughs or aesthetic vibes.'),
  price: z.number().describe('An estimated total price for the system in Philippine Pesos (PHP), based on the provided components.'),
  estimatedWattage: z.string().describe('The estimated total wattage for the build, in the format "550W".'),
  compatibilitySummary: z.string().describe('A summary of the component compatibility. Note any potential issues or bottlenecks. If everything is compatible, confirm that.'),
  tier: z.enum(['Entry', 'Mid-Range', 'High-End', 'Workstation']).describe('The tier this system falls into based on components (Entry, Mid-Range, High-End, or Workstation).'),
});
export type AiPrebuiltAdvisorOutput = z.infer<typeof AiPrebuiltAdvisorOutputSchema>;

export async function aiPrebuiltAdvisor(input: AiPrebuiltAdvisorInput): Promise<AiPrebuiltAdvisorOutput> {
  return aiPrebuiltAdvisorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiPrebuiltAdvisorPrompt',
  input: {
    schema: AiPrebuiltAdvisorInputSchema.extend({
      knowledgeContext: z.string().optional()
    })
  },
  output: { schema: AiPrebuiltAdvisorOutputSchema },
  config: {
    temperature: 0.2,
  },
  prompt: `You are an expert PC Builder. A user has selected a list of components for a pre-built system.

EXPERT LOCAL KNOWLEDGE BASE:
{{{knowledgeContext}}}

Your task is to:
1.  Generate a premium, ultra-catchy, and memorable name for this build (e.g., "The Midnight Apex", "Quantum Overlord"). Focus on energy and performance tiers.
2.  Write a high-impact, marketing-ready description for the system. Sell the experience—mention specific gaming resolutions (1440p/4K) or productivity gains.
3.  Analyze the provided components for compatibility. Point out any issues (e.g., CPU socket not matching motherboard, RAM type mismatch, insufficient PSU). If they are compatible, confirm this. Use the provided Expert Local Knowledge Base if it contains relevant compatibility rules.
4.  Estimate the total power consumption in watts (e.g., "550W").
5.  Estimate a reasonable market price for the entire build in Philippine Pesos (PHP). Ensure it accurately reflects current real-world pricing. If you are unsure of the price or if it's missing from your knowledge, MUST use the "googleSearch" tool to find the current price in PHP.
6.  Identify the appropriate performance tier ('Entry', 'Mid-Range', 'High-End', or 'Workstation') for this configuration.

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

    // Retrieve local knowledge based on the selected components
    const componentNames = Object.values(input.components)
      .filter(c => c !== undefined && c !== '')
      .join(' ');

    const knowledgeResults = await retrieveLocalKnowledge(`compatibility rules tier lists ${componentNames}`);
    const knowledgeContext = knowledgeResults.join('\n\n');

    // Stage 1: Analyze and Search (Text Output)
    const analysisPrompt = `You are an expert PC Builder. Analyze the following components for a pre-built system.
    
EXPERT LOCAL KNOWLEDGE BASE:
${knowledgeContext}

Components:
${Object.entries(input.components).map(([k, v]) => v ? `${k}: ${v}` : '').filter(v => v).join('\n')}

Tier: ${input.tier || 'Not specified'}

Tasks:
1. Generate name and description.
2. Analyze compatibility.
3. Estimate wattage.
4. Estimate price in PHP (Use Google Search for current pricing).

Provide details in clear text.`;

    const analysisResponse = await ai.generate({
      prompt: analysisPrompt,
      config: {
        temperature: 0.2,
        googleSearchRetrieval: {}
      }
    });

    const analysisText = analysisResponse.text;

    // Stage 2: Format to JSON (Structured Output) using the defined prompt
    const { output } = await prompt({
      ...input,
      knowledgeContext: `ANALYSIS FINDINGS:\n${analysisText}\n\n${knowledgeContext}`
    });

    if (!output) {
      throw new Error('Failed to get suggestions from the AI.');
    }
    return output;
  }
);
