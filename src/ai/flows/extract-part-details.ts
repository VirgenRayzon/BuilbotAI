
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
import { callNotebookTool } from '@/lib/mcp-client';
import fs from 'fs';

const DEBUG_LOG = 'grounding-debug.log';

function logDebug(msg: string) {
  fs.appendFileSync(DEBUG_LOG, `[${new Date().toISOString()}] ${msg}\n`);
}


const SpecificationSchema = z.object({
  key: z.string().describe('The name of the specification (e.g., "Cores", "Socket"). Avoid vendor-specific keys like "CUDA Cores" for non-NVIDIA GPUs.'),
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
  brand: z.string().describe('The brand name of the component (e.g., "NVIDIA", "AMD", "Intel", "ASUS").'),
  price: z.number().describe("Realistic estimated retail price in PHP. Multiply USD MSRP by 60."),
  wattage: z.number().optional().describe("Estimated power consumption (W) or rated output for PSU."),
  performanceScore: z.number().optional().describe("0-100 score relative to modern high-end standards."),
  dimensions: z.object({
    width: z.number(),
    height: z.number(),
    depth: z.number()
  }).optional().describe("Dimensions in mm. Vital for Case and GPU."),
  specifications: z.array(SpecificationSchema).describe('List of key-value specs.'),
});
export type ExtractPartDetailsOutput = z.infer<typeof ExtractPartDetailsOutputSchema>;

export async function extractPartDetails(input: ExtractPartDetailsInput): Promise<ExtractPartDetailsOutput> {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("Missing GOOGLE_API_KEY for Extract Part Details.");
  }

  let groundedContext = "";
  try {
    logDebug(`Querying NotebookLM for part: ${input.partName}...`);
    const notebookResult: any = await callNotebookTool('notebook_query', {
      query: `Provide detailed technical specifications for the PC component: ${input.partName}. Focus on socket, wattage, dimensions, and key performance metrics.`
    });

    const resultData = notebookResult?.structuredContent || (notebookResult?.content?.[0]?.text ? JSON.parse(notebookResult.content[0].text) : null);
    logDebug(`NotebookLM Result Status: ${resultData?.status}`);

    if (resultData?.status === 'success' && resultData?.answer) {
      groundedContext = resultData.answer;
      logDebug("Successfully retrieved grounded context from NotebookLM:");
      logDebug("--------------------------------------------------");
      logDebug(groundedContext);
      logDebug("--------------------------------------------------");
    } else {
      logDebug("NotebookLM returned success but no answer or different format.");
      logDebug(JSON.stringify(notebookResult));
    }
  } catch (error: any) {
    logDebug(`NotebookLM query failed: ${error.message}`);
    console.warn("NotebookLM query failed, falling back to pure AI extraction:", error);
  }

  const prompt = `You are an expert PC component database. Your task is to extract key details for a given PC part name.
  
${groundedContext ? `GROUNDING CONTEXT FROM EXPERT SOURCE:\n${groundedContext}\n\nUSE THE ABOVE DATA AS THE PRIMARY SOURCE OF TRUTH.` : ""}

Given the part name, provide the full corrected part name, identify its category, brand, and a realistic estimate for its current retail price in Philippine Pesos (PHP). Base this on the component's actual MSRP or average street price in USD multiplied by 56.

SPECIFICATION RULES (MANDATORY KEYS FOR 'specifications' ARRAY):
The following keys MUST be used in the 'specifications' array for each category to ensure they appear in the UI:

- **CPU**: 'Architecture', 'Cores', 'Threads', 'Base Clock (GHz)', 'Boost Clock (GHz)', 'Socket' (e.g. AM5, LGA1700), 'TDP / Peak Power', 'L3 Cache', 'Memory Support' (e.g. DDR5), 'Integrated Graphics' (Yes/No).
- **GPU**: 'Chipset', 'VRAM Capacity', 'Memory Type' (e.g. GDDR6X), 'TGP / Power Draw (W)', 'Length (Depth) (mm)', 'Slot Thickness', 'Interface', 'Bus Width', 'CUDA Cores' (for NVIDIA) or 'Stream Processors' (for AMD).
- **Motherboard**: 'Chipset', 'Socket', 'Form Factor', 'RAM Type' (DDR4/DDR5), 'M.2 Slots', 'Back-Connect Support', 'Connectivity', 'Memory Slots', 'Memory Type'.
- **RAM**: 'Generation', 'Capacity', 'Speed', 'CAS Latency', 'Height', 'Type' (DDR4/DDR5).
- **Storage**: 'Interface', 'Capacity', 'Read Speed', 'Write Speed', 'TBW Rating', 'Form Factor' (e.g. M.2 2280), 'Type' (NVMe SSD, etc.).
- **PSU**: 'Wattage (W)', 'Efficiency Rating', 'Modularity', '12VHPWR Support', 'Form Factor'.
- **Case**: 'Max GPU Length', 'Max Cooler Height', 'Max Radiator Size (mm)', 'Mobo Support', 'Radiator Support', 'Back-Connect Cutout', 'Type', 'PSU Form Factor'.
- **Cooler**: 'TDP Rating', 'Socket Support', 'Height', 'Radiator Size', 'Type'.
- **Monitor**: 'Screen Size', 'Resolution', 'Refresh Rate', 'Panel Type', 'Response Time'.
- **Keyboard**: 'Type', 'Switches', 'Layout', 'Backlighting'.
- **Mouse**: 'Sensor', 'DPI', 'Connectivity', 'Weight'.
- **Headset**: 'Type', 'Connectivity', 'Driver Size', 'Microphone'.

ADDITIONAL FIELDS:
- 'wattage': TDP for CPU/GPU, rated output for PSU (number).
- 'performanceScore': 0-100 (e.g., i9-14900K = 98, RTX 4090 = 100).
- 'dimensions': {width, height, depth} in mm. For GPUs, 'depth' is the length.

Part Name: ${input.partName}`;

  try {
    const response = await ai.generate({
      prompt: prompt,
      output: {
        schema: ExtractPartDetailsOutputSchema,
      },
      config: {
        temperature: 0.2,
      },
    });

    if (!response.output) {
      throw new Error("AI returned an empty response.");
    }

    return response.output;

  } catch (error: any) {
    console.error("Extract Part Details failed:", error);
    throw error;
  }
}
