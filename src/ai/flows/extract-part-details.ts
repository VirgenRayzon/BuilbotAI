
'use server';
/**
 * @fileOverview A Genkit flow for extracting PC part details using AI.
 *
 * - extractPartDetails - A function that takes a part name and returns structured details.
 * - ExtractPartDetailsInput - The input type for the extractPartDetails function.
 * - ExtractPartDetailsOutput - The return type for the extractPartDetails function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SpecificationSchema = z.object({
  key: z.string().describe('The name of the specification (e.g., "CUDA Cores", "Socket").'),
  value: z.string().describe('The value of the specification (e.g., "3584", "AM5").'),
});

const ExtractPartDetailsInputSchema = z.object({
  partName: z.string().describe('The name of the PC component.'),
});
export type ExtractPartDetailsInput = z.infer<typeof ExtractPartDetailsInputSchema>;

const componentCategories = ["CPU", "GPU", "Motherboard", "RAM", "Storage", "PSU", "Case", "Cooler"] as const;

const ExtractPartDetailsOutputSchema = z.object({
  partName: z.string().describe("The full, corrected name of the PC component."),
  category: z.enum(componentCategories).describe('The category of the component.'),
  brand: z.string().describe('The brand name of the component (e.g., "NVIDIA", "AMD", "Intel").'),
  price: z.number().describe("An estimated price for the component in Philippine Pesos (PHP)."),
  wattage: z.number().optional().describe("An estimated power consumption in watts for the component (e.g. 125 for a CPU or 850 for a PSU). Should be a number."),
  specifications: z.array(SpecificationSchema).describe('A list of key-value specifications for the component, following strict category-specific keys.'),
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

Given the part name, provide the full corrected part name, identify its category, brand, and an estimated price in Philippine Pesos (PHP).

Crucially, you must also provide a list of key-value specifications that are **consistent and specific to the component's category**. Adhere strictly to the following keys for each category:

- **CPU**: Provide 'Cores', 'Threads', 'Socket', 'Base Clock', and 'Boost Clock'.
- **GPU**: Provide 'VRAM Capacity', 'Memory Interface', 'Boost Clock', and 'Game Clock'.
- **Motherboard**: Provide 'Socket', 'Chipset', 'Form Factor', 'Memory Slots', and 'Max RAM'.
- **RAM**: Provide 'Capacity', 'Speed', 'Type', and 'CAS Latency'.
- **Storage**: Provide 'Capacity', 'Type' (e.g., NVMe SSD, SATA SSD, HDD), 'Interface', and 'Form Factor'.
- **PSU**: Provide 'Efficiency' (e.g., 80+ Gold), 'Form Factor', and 'Modularity'.
- **Case**: Provide 'Type' (e.g., ATX Mid Tower), 'Motherboard Support', and 'Max GPU Length'.
- **Cooler**: Provide 'Type' (e.g., Air, AIO Liquid), 'Fan RPM', and 'Socket Support'.

The category must be one of the following: "CPU", "GPU", "Motherboard", "RAM", "Storage", "PSU", "Case", "Cooler".

Only provide the top-level 'wattage' field for 'CPU', 'GPU', and 'PSU' categories. For 'CPU' and 'GPU', this should be the estimated power consumption. For 'PSU', this should be the advertised output wattage (e.g., 850 for an 850W PSU). For all other categories (Motherboard, RAM, Storage, Case, Cooler), DO NOT include the 'wattage' field in the output.

Part Name: {{{partName}}}

Please provide the output in a JSON object that strictly adheres to the provided output schema. Make sure the price and wattage are numbers, not strings.`,
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
