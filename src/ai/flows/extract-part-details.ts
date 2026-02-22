'use server';
/**
 * @fileOverview A Genkit flow for extracting PC part details using AI.
 *
 * - extractPartDetails - A function that takes a part name and returns structured details.
 * - ExtractPartDetailsInput - The input type for the extractPartDetails function.
 * - ExtractPartDetailsOutput - The return type for the extractPartDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpecificationSchema = z.object({
  key: z.string().describe('The name of the specification (e.g., "CUDA Cores", "Socket").'),
  value: z.string().describe('The value of the specification (e.g., "3584", "AM5").'),
});

const ExtractPartDetailsInputSchema = z.object({
  partName: z.string().describe('The name of the PC component.'),
});
export type ExtractPartDetailsInput = z.infer<typeof ExtractPartDetailsInputSchema>;

const ExtractPartDetailsOutputSchema = z.object({
  partName: z.string().describe("The full, corrected name of the PC component."),
  category: z.string().describe('The category of the component (e.g., "GPU", "CPU", "Motherboard").'),
  brand: z.string().describe('The brand name of the component (e.g., "NVIDIA", "AMD", "Intel").'),
  price: z.number().describe("An estimated price for the component in Philippine Pesos (PHP)."),
  specifications: z.array(SpecificationSchema).describe('A list of key-value specifications for the component. Return a maximum of 6 of the most important specifications.'),
});
export type ExtractPartDetailsOutput = z.infer<typeof ExtractPartDetailsOutputSchema>;

export async function extractPartDetails(input: ExtractPartDetailsInput): Promise<ExtractPartDetailsOutput> {
  return extractPartDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractPartDetailsPrompt',
  input: { schema: ExtractPartDetailsInputSchema },
  output: { schema: ExtractPartDetailsOutputSchema },
  prompt: `You are an expert PC component database. Your task is to extract key details for a given PC part name.

Given the part name, provide the full corrected part name, identify the category, the brand, provide an estimated price in Philippine Pesos (PHP), and the top 5-6 most important and common specifications. Do not include the part name or brand in the specifications.

For example, for "NVIDIA GeForce RTX 3060", you should identify the brand as "NVIDIA", category as "GPU", provide a PHP price, and specifications like "Memory: 12GB GDDR6", "CUDA Cores: 3584", etc.
For "AMD Ryzen 5 5600X", brand is "AMD", category is "CPU", and specs could be "Cores: 6", "Threads: 12", "Socket: AM4".

Part Name: {{{partName}}}

Please provide the output in a JSON object that strictly adheres to the provided output schema. Make sure the price is a number, not a string.`,
});


const extractPartDetailsFlow = ai.defineFlow(
  {
    name: 'extractPartDetailsFlow',
    inputSchema: ExtractPartDetailsInputSchema,
    outputSchema: ExtractPartDetailsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to get part details from the AI.');
    }
    return output;
  }
);
