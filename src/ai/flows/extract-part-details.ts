
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
  price: z.number().describe("A realistic estimated retail price for the component in Philippine Pesos (PHP), converted from its USD MSRP/street price. Do not default to 79999."),
  wattage: z.number().optional().describe("An estimated power consumption in watts for the component (e.g. 125 for a CPU or 850 for a PSU). Should be a number."),
  performanceScore: z.number().optional().describe("A performance score from 0 to 100."),
  dimensions: z.object({
    width: z.number(),
    height: z.number(),
    depth: z.number()
  }).optional().describe("Physical dimensions in mm."),
  specifications: z.array(SpecificationSchema).describe('A list of key-value specifications for the component, following strict category-specific keys.'),
});
export type ExtractPartDetailsOutput = z.infer<typeof ExtractPartDetailsOutputSchema>;

export async function extractPartDetails(input: ExtractPartDetailsInput): Promise<ExtractPartDetailsOutput> {
  if (!process.env.NVIDIA_API_KEY) {
    throw new Error("Missing NVIDIA_API_KEY for Extract Part Details.");
  }

  const prompt = `You are an expert PC component database. Your task is to extract key details for a given PC part name.

Given the part name, provide the full corrected part name, identify its category, brand, and a realistic estimate for its current retail price in Philippine Pesos (PHP). Base this on the component's actual MSRP or average street price in USD multiplied by 56 to get PHP. DO NOT use generic fallback or placeholder prices like 79999 or 79999.00.

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

Additionally:
- Provide a 'performanceScore' between 0 and 100 representing relative performance. Example CPU scores: Intel Core i3-10100 = 45, Ryzen 5 5600 = 72, Intel Core i5-12400F = 75, Ryzen 7 5800X = 82. Example GPU scores: GTX 1650 = 35, RTX 3060 = 68, RTX 4060 = 72, RTX 4070 = 86.
- ONLY provide a 'dimensions' object (with 'width', 'height', and 'depth' in mm) for 'GPU' and 'PSU' categories. Do not include 'dimensions' for other components.

Please provide your analysis strictly outputting ONLY valid JSON matching the requested JSON output format. No markdown blocks, no other text.

Part Name: ${input.partName}

FORMAT TO MATCH:
{
  "partName": "...",
  "category": "...",
  "brand": "...",
  "price": 0,
  "wattage": 0,
  "performanceScore": 50,
  "dimensions": { "width": 0, "height": 0, "depth": 0 },
  "specifications": [ { "key": "...", "value": "..." } ]
}
`;

  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta/llama-3.3-70b-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 1024
      })
    });

    if (!res.ok) {
      throw new Error(`NVIDIA API Error: ${res.statusText}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error("AI returned an empty string.");
    }

    let parsedData;
    try {
      const jsonStr = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Raw text:", text);
      throw new Error("Failed to parse JSON response from AI.");
    }

    return parsedData;

  } catch (error: any) {
    console.error("Extract Part Details failed:", error);
    throw error;
  }
}

