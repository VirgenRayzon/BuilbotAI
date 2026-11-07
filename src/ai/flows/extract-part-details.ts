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
import { retrieveHardwareVectorSpecs } from '@/lib/vector-retriever';
import { getGenkitModelName, safeGenkitGenerate } from '@/lib/ai-model-resolver';
import { hasExactHardwareModelMatch } from '@/lib/hardware-model-identity';
import { getChatPartSpecifications } from '@/lib/chat-part-specifications';

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
  exists: z.boolean().describe("Whether the exact requested component can be verified as a real, officially released product."),
  verificationMessage: z.string().optional().describe("A short explanation when the exact component cannot be verified. Do not add this explanation to partName."),
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
  packageType: z.enum(['TRAY', 'BOX']).optional().describe('CPU package type. TRAY means OEM/bulk; BOX means retail packaging and does not imply a cooler is included. Record the actual included thermal solution separately in specifications when verified.'),
  description: z.string().optional().describe('Brief product highlights in Markdown format. MANDATORY: ALWAYS put each point on a "NEW PARAGRAPH". Start the description with a new paragraph and an asterisk (*). Use bold text for headers. Example: * **Feature**: Description.'),
});
export type ExtractPartDetailsOutput = z.infer<typeof ExtractPartDetailsOutputSchema>;

export async function extractPartDetails(input: ExtractPartDetailsInput): Promise<ExtractPartDetailsOutput> {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("Missing GOOGLE_API_KEY for Extract Part Details.");
  }

  let groundedContext = "";

  // 1. Try Hardware Vector Storage (buildbot_hardware_vector in Firestore)
  try {
    const vectorResults = await retrieveHardwareVectorSpecs(input.partName, { limit: 1 });

    if (hasExactHardwareModelMatch(input.partName, vectorResults)) {
      groundedContext = vectorResults.join('\n\n');
      logDebug("Successfully retrieved an exact model match from Hardware Vector Store.");
    } else if (vectorResults.length > 0) {
      logDebug("Hardware Vector Store returned only similar models. Running web search for exact verification.");
    } else {
      logDebug("Hardware Vector Store returned no matches.");
    }
  } catch (error: any) {
    logDebug(`Vector store search failed: ${error.message}`);
  }

  // 2. Fallback notice if grounded context is empty
  if (!groundedContext) {
    logDebug("No grounded context found. Falling back to general AI knowledge.");
  }

  try {
    let webResearchContext = '';

    const dynamicModel = await getGenkitModelName();

    // Step 1: If no local database context, run a plain-text search to gather specs and pricing
    if (!groundedContext) {
      logDebug("Step 1: No local context found. Running web search pre-research...");
      console.log(`[Extract Part Details] Step 1: Running web search for: ${input.partName} using model ${dynamicModel}`);
      const research = await getChatPartSpecifications(input.partName);
      if (research.source === 'none') {
        throw new Error(research.message || 'Google Search could not verify this exact component.');
      }
      webResearchContext = `${research.specs.join('\n\n')}\nSources:\n${research.sources.map(source => `${source.title}: ${source.url}`).join('\n')}`;
      logDebug("Step 1 complete. Web research context obtained.");
      console.log(`[Extract Part Details] Step 1 complete. Research context obtained.`);
    }

    // Step 2: Structured output prompt WITHOUT googleSearchRetrieval
    logDebug("Step 2: Formatting part details into structured output...");

    const { getActiveSystemPrompt } = await import('@/lib/system-prompts');
    const customSystemPrompt = await getActiveSystemPrompt('partExtractor');

    const researcherPrompt = `${customSystemPrompt || "You are an expert PC hardware researcher and data formatter."}
    
GROUNDING CONTEXT FROM LOCAL DATABASE:
${groundedContext || "NONE - Part not found in local database."}

${webResearchContext ? `WEB SEARCH RESEARCH CONTEXT:\n${webResearchContext}` : ''}

Target Component to extract: ${input.partName}

LOGIC RULES:
1. FIRST, check the GROUNDING CONTEXT above. If it is for the requested part (${input.partName}), use its details.
2. If the context is NONE or for the wrong part, use the WEB SEARCH RESEARCH CONTEXT above for accurate specs and pricing.
3. Verify the exact model and variant. Set exists to false when the exact requested product cannot be verified. Never substitute a similarly named product.
4. Keep partName clean. Never prepend labels such as "Non-existent Component:" or put warnings in partName. Put the explanation in verificationMessage instead.
5. Once you have the data, format it strictly into the requested JSON schema.
6. For prices: Convert USD street price to PHP by multiplying by 60 (e.g., $1000 = ₱60,000) or use local Philippine retailer pricing.
7. For CPUs, do not infer an included cooler from BOX packaging. Include a 'Thermal Solution (PIB)' specification only when the source explicitly confirms its value; use 'Not Included' when the official page says so.

SPECIFICATION RULES (Ensure these keys appear in the JSON 'specifications' array):
- **CPU**: 'Architecture', 'Cores', 'Threads', 'Base Clock (GHz)', 'Boost Clock (GHz)', 'Socket', 'TDP / Peak Power', 'L3 Cache', 'Memory Support', 'Integrated Graphics', and verified 'Thermal Solution (PIB)' when available.
- **GPU**: 'Chipset', 'VRAM Capacity', 'Memory Type', 'TGP / Power Draw (W)', 'Length (Depth) (mm)' (Integer), 'Slot Thickness' (Integer), 'Interface', 'CUDA Cores' or 'Stream Processors'.
- **Motherboard**: 'Chipset', 'Socket', 'Form Factor' (MANDATORY: MUST be exactly one of: eatx, atx, matx, itx), 'RAM Type', 'SATA Slots' (Integer), 'NVMe Slots' (Integer), 'Back-Connect Support', 'Connectivity', 'Memory Slots', 'Memory Type'.
- **RAM**: 'Generation', 'Capacity', 'Speed', 'CAS Latency', 'Stick Count'.
- **Storage**: 'Interface', 'Capacity', 'Read Speed', 'Write Speed', 'TBW Rating', 'Form Factor', 'Type' (MANDATORY: exactly one of: NVME, SATA).
- **PSU**: 'Wattage (W)', 'Efficiency Rating', 'Modularity', '12VHPWR Support', 'Form Factor'.
- **Case**: 'Width (mm)' (Integer), 'Depth (mm)' (Integer), 'Height (mm)' (Integer), 'Mobo Support' (MANDATORY: comma-separated list of: eatx, atx, matx, itx), 'Radiator Support (mm)' (MANDATORY: comma-separated list of: 120, 140, 240, 280, 360, 480), 'Type' (MANDATORY: exactly one of: full tower, mid tower, mini tower, sff), 'Back-Connect Cutout' (MANDATORY: exactly one of: yes, no), 'PSU Form Factor'.
- **Cooler**: 'TDP Rating', 'Socket Support', 'Height', 'Radiator Size', 'Type'.

Output strictly the JSON object matching the schema.`;

    const response = await safeGenkitGenerate(ai, {
      model: dynamicModel,
      prompt: researcherPrompt,
      output: {
        schema: ExtractPartDetailsOutputSchema,
      },
      config: {
        temperature: 0,
      },
    });

    if (!response.output) {
      throw new Error("AI returned empty output during part details extraction.");
    }

    logDebug(`Successfully extracted and formatted details for: ${input.partName}`);
    if (response.output.category === 'CPU' && response.output.brand.toLowerCase() === 'amd' &&
        /^(?:AMD\s+)?Ryzen(?:™)?\s+7\s+9850X3D\b/i.test(response.output.partName.trim())) {
      // AMD's official product specification lists the in-box thermal solution as not included.
      return {
        ...response.output,
        specifications: [
          ...response.output.specifications.filter(({ key }: { key: string }) =>
            !/^(?:thermal solution(?: \(pib\))?|included cooler|cooler included|box cooler)$/i.test(key.trim())),
          { key: 'Thermal Solution (PIB)', value: 'Not Included' },
        ],
      };
    }
    if (webResearchContext && response.output.exists === false) {
      throw new Error('Grounded research found the exact component, but AI formatting rejected it. Please retry.');
    }
    return response.output;

  } catch (error: any) {
    console.error("Extract Part Details failed:", error);
    throw error;
  }
}

