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
import fs from 'fs';
import { searchLocalDatabase } from '@/lib/local-db';

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
  packageType: z.enum(['TRAY', 'BOX']).optional().describe('CPU Package Type. TRAY (OEM/Bulk) or BOX (Retail with heatsink).'),
  description: z.string().optional().describe('Brief product highlights in Markdown format. MANDATORY: ALWAYS put each point on a "NEW PARAGRAPH". Start the description with a new paragraph and an asterisk (*). Use bold text for headers. Example: * **Feature**: Description.'),
});
export type ExtractPartDetailsOutput = z.infer<typeof ExtractPartDetailsOutputSchema>;

export async function extractPartDetails(input: ExtractPartDetailsInput): Promise<ExtractPartDetailsOutput> {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("Missing GOOGLE_API_KEY for Extract Part Details.");
  }

  let groundedContext = "";

  // 1. Try Local CSV Database (Highest Priority)
  try {
    logDebug(`Checking local database for: ${input.partName}...`);
    const localResults = await searchLocalDatabase(input.partName);

    if (localResults.length > 0) {
      groundedContext = localResults.join('\n\n');
      logDebug("Successfully retrieved grounded context from Local Database.");
    } else {
      logDebug("Local database returned no matches.");
    }
  } catch (error: any) {
    logDebug(`Local database search failed: ${error.message}`);
  }

  // 2. Fallback to general knowledge if grounded context is empty
  if (!groundedContext) {
    logDebug("No grounded context found. Falling back to general AI knowledge.");
  }

  try {
    // Stage 1: Intelligence & Research (Conditional Search)
    logDebug("Stage 1: Evaluating info and researching if needed...");

    // Determine if we need to research. If groundedContext is for the correct part, we might skip.
    const researcherPrompt = `You are an expert PC hardware researcher.
    
GROUNDING CONTEXT FROM LOCAL DATABASE:
${groundedContext || "NONE - Part not found in local database."}

User is asking for details on: ${input.partName}

LOGIC RULES:
1. FIRST, check the GROUNDING CONTEXT above. If it is for the requested part (${input.partName}), summarize its details.
2. If the context is NONE or for the wrong part, you MUST use the 'googleSearch' tool to find the accurate specs and current street price in USD.
3. Be accurate. Do not use generic training data for specs if search/context provides specific numbers.

Output your final gathered findings clearly in plain text for the formatter.`;

    const searchConfig = groundedContext ? {} : { googleSearchRetrieval: {} };

    const searchResponse = await ai.generate({
      prompt: researcherPrompt,
      config: {
        temperature: 0,
        ...searchConfig
      },
    });

    const findings = searchResponse.text;
    logDebug(`Stage 1 findings: ${findings.substring(0, 150)}...`);

    // Stage 2: Format findings into structured JSON
    logDebug("Stage 2: Formatting findings into JSON...");
    const formatPrompt = `Convert the following PC hardware findings into a structured JSON object.

Findings:
${findings}

Part Name Requested: ${input.partName}

SPECIFICATION RULES (Ensure these keys appear in the JSON 'specifications' array):
- **CPU**: 'Architecture', 'Cores', 'Threads', 'Base Clock (GHz)', 'Boost Clock (GHz)', 'Socket', 'TDP / Peak Power', 'L3 Cache', 'Memory Support', 'Integrated Graphics'.
- **GPU**: 'Chipset', 'VRAM Capacity', 'Memory Type', 'TGP / Power Draw (W)', 'Length (Depth) (mm)' (Integer), 'Slot Thickness' (Integer), 'Interface', 'CUDA Cores' or 'Stream Processors'.
- **Motherboard**: 'Chipset', 'Socket', 'Form Factor' (MANDATORY: MUST be exactly one of: eatx, atx, matx, itx), 'RAM Type', 'SATA Slots' (Integer), 'NVMe Slots' (Integer), 'Back-Connect Support', 'Connectivity', 'Memory Slots', 'Memory Type'.
- **RAM**: 'Generation', 'Capacity', 'Speed', 'CAS Latency', 'Stick Count'.
- **Storage**: 'Interface', 'Capacity', 'Read Speed', 'Write Speed', 'TBW Rating', 'Form Factor', 'Type' (MANDATORY: exactly one of: NVME, SATA).
- **PSU**: 'Wattage (W)', 'Efficiency Rating', 'Modularity', '12VHPWR Support', 'Form Factor'.
- **Case**: 'Mobo Support' (MANDATORY: comma-separated list of: eatx, atx, matx, itx), 'Radiator Support (mm)' (MANDATORY: comma-separated list of: 120, 140, 240, 280, 360, 480), 'Type' (MANDATORY: exactly one of: full tower, mid tower, mini tower, sff), 'Back-Connect Cutout' (MANDATORY: exactly one of: yes, no), 'PSU Form Factor'.
- **Cooler**: 'TDP Rating', 'Socket Support', 'Height', 'Radiator Size', 'Type'.

ADDITIONAL FIELDS:
- 'wattage': number.
- 'performanceScore': 0-100.
- 'dimensions': {width, height, depth} in mm. For GPUs, 'depth' is the length.
- 'price': number in PHP (USD * 56).
- 'packageType': 'TRAY' or 'BOX' (for CPUs only).
- 'description': brief product highlights in Markdown.

Output ONLY the JSON object.`;

    const formatResponse = await ai.generate({
      prompt: formatPrompt,
      output: {
        schema: ExtractPartDetailsOutputSchema,
      },
      config: {
        temperature: 0,
      },
    });

    if (!formatResponse.output) {
      throw new Error("AI returned empty formatted output.");
    }

    return formatResponse.output;

  } catch (error: any) {
    console.error("Extract Part Details failed:", error);
    throw error;
  }
}
