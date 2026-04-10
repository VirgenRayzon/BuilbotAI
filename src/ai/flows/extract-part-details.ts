
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

  const prompt = `You are an expert PC component database. Your task is to extract key details for a given PC part name.
  
${groundedContext ? `GROUNDING CONTEXT FROM EXPERT SOURCE:\n${groundedContext}\n\nUSE THE ABOVE DATA AS THE PRIMARY SOURCE OF TRUTH.` : "NO LOCAL DATA FOUND. You MUST use the 'googleSearch' tool to find accurate and up-to-date specifications and pricing for this part."}

Given the part name, provide the full corrected part name, identify its category, brand, and a realistic estimate for its current retail price in Philippine Pesos (PHP). Base this on the component's actual MSRP or average street price in USD multiplied by 56. Identify the 'packageType' (TRAY or BOX) if it is a CPU. Generate a 'description' field containing brief product highlights in rich Markdown format. MANDATORY: Each highlight must be on its own NEW LINE starting with an asterisk (*). If you are unsure about any specification or the price, use the 'googleSearch' tool to verify.

SPECIFICATION RULES (MANDATORY KEYS FOR 'specifications' ARRAY):
The following keys MUST be used in the 'specifications' array for each category to ensure they appear in the UI:

- **CPU**: 'Architecture' (e.g., "Zen 4"), 'Cores' (e.g., "8"), 'Threads' (e.g., "16"), 'Base Clock (GHz)' (e.g., "4.5 GHz"), 'Boost Clock (GHz)' (e.g., "5.4 GHz"), 'Socket' (e.g., "AM5"), 'TDP / Peak Power' (e.g., "105 W"), 'L3 Cache' (e.g., "32 MB"), 'Memory Support' (e.g., "DDR5"), 'Integrated Graphics' (e.g., "Yes" or "No").
- **GPU**: 'Chipset' (e.g., "RTX 4070"), 'VRAM Capacity' (e.g., "12 GB"), 'Memory Type' (e.g., "GDDR6X"), 'TGP / Power Draw (W)' (e.g., "200 W"), 'Length (Depth) (mm)' (MUST be rounded UP to the nearest whole integer and formatted exactly as "X mm", e.g. "336 mm"), 'Slot Thickness' (MUST be rounded UP to the nearest whole integer and formatted exactly as "X slot", e.g. "2 slot"), 'Interface' (e.g., "PCIe 4.0 x16"), 'CUDA Cores' (e.g., "5888" for NVIDIA) or 'Stream Processors' (for AMD).
- **Motherboard**: 'Chipset' (e.g., "B650"), 'Socket' (e.g., "AM5"), 'Form Factor' (e.g., "ATX"), 'RAM Type' (e.g., "DDR5"), 'M.2 Slots' (e.g., "3x Gen4"), 'Back-Connect Support' (e.g., "Yes" or "No"), 'Connectivity' (e.g., "Wi-Fi 6E, 2.5Gb Ethernet"), 'Memory Slots' (e.g., "4"), 'Memory Type' (e.g., "DDR5").
- **RAM**: 'Generation' (e.g., "DDR5"), 'Capacity' (e.g., "32 GB"), 'Speed' (e.g., "6000 MT/s"), 'CAS Latency' (e.g., "CL30"), 'Stick Count' (e.g., "2").
- **Storage**: 'Interface' (e.g., "NVMe M.2"), 'Capacity' (e.g., "1 TB"), 'Read Speed' (e.g., "7000 MB/s"), 'Write Speed' (e.g., "6500 MB/s"), 'TBW Rating' (e.g., "600 TBW"), 'Form Factor' (e.g., "M.2 2280"), 'Type' (e.g., "NVMe SSD").
- **PSU**: 'Wattage (W)' (e.g., "850 W"), 'Efficiency Rating' (e.g., "80+ Gold"), 'Modularity' (e.g., "Fully Modular"), '12VHPWR Support' (e.g., "Native ATX 3.0 / ATX 3.1"), 'Form Factor' (e.g., "ATX / SFX").
- **Case**: 'Max GPU Length' (e.g., "400 mm"), 'Max Cooler Height' (e.g., "170 mm"), 'Max Radiator Size (mm)' (e.g., "360"), 'Mobo Support' (e.g., "ATX, M-ATX, ITX"), 'Radiator Support' (e.g., "360mm Top, 240mm Front"), 'Back-Connect Cutout' (e.g., "Yes" or "No"), 'Type' (e.g., "ATX Mid Tower"), 'PSU Form Factor' (e.g., "ATX / SFX").
- **Cooler**: 'TDP Rating' (e.g., "250 W"), 'Socket Support' (e.g., "AM4, AM5, LGA1700"), 'Height' (e.g., "165 mm"), 'Radiator Size' (e.g., "360 mm"), 'Type' (e.g., "Air" or "AIO Liquid").
- **Monitor**: 'Screen Size' (e.g., "27 inch"), 'Resolution' (e.g., "2560 x 1440"), 'Refresh Rate' (e.g., "144 Hz"), 'Panel Type' (e.g., "IPS / VA / OLED"), 'Response Time' (e.g., "1ms GtG").
- **Keyboard**: 'Type' (e.g., "Mechanical"), 'Switches' (e.g., "Cherry MX Red"), 'Layout' (e.g., "Full Size / TKL / 60%"), 'Backlighting' (e.g., "RGB").
- **Mouse**: 'Sensor' (e.g., "Hero 25K"), 'DPI' (e.g., "25600"), 'Connectivity' (e.g., "Wireless"), 'Weight' (e.g., "63g").
- **Headset**: 'Type' (e.g., "Over-Ear"), 'Connectivity' (e.g., "Wireless"), 'Driver Size' (e.g., "50mm"), 'Microphone' (e.g., "Detachable").

ADDITIONAL FIELDS:
- 'wattage': TDP for CPU/GPU, rated output for PSU (number).
- 'performanceScore': 0-100 (e.g., i9-14900K = 98, RTX 4090 = 100).
- 'dimensions': {width, height, depth} in mm. For GPUs, 'depth' is the length.

Part Name: ${input.partName}`;

  try {
    // Stage 1: Intelligence & Research (Conditional Search)
    logDebug("Stage 1: Evaluating info and researching if needed...");
    const researcherPrompt = `You are an expert PC hardware researcher.
    
GROUNDING CONTEXT FROM LOCAL DATABASE:
${groundedContext || "NONE - Part not found in local database."}

User is asking for details on: ${input.partName}

LOGIC RULES:
1. FIRST, check the GROUNDING CONTEXT above. If it is for the ${input.partName} and contains COMPLETE specifications (Brand, Category, Price, Wattage/TDP, Dimensions, and technical specs like Cores/Clock speeds), skip web search entirely.
2. If the context is for the correct part but is missing specific fields (e.g. Dimensions or TDP is zero/null), use the 'googleSearch' tool ONLY to find those missing details.
3. If the context is NONE or for the wrong part, use the 'googleSearch' tool to perform a full web search for the specs and current PHP price (MSRP/Street USD * 56).
4. Be accurate. If you find data in the context, do not overwrite it with generic training data unless the web search finds newer/more accurate info.

Output your final gathered findings clearly in plain text for the formatter. Mention clearly if the data came from the Local DB or the Web.`;

    const searchResponse = await ai.generate({
      prompt: researcherPrompt,
      config: {
        temperature: 0, // Lower temperature for more deterministic logic evaluation
        googleSearchRetrieval: {},
      },
    });

    const findings = searchResponse.text;
    logDebug(`Stage 1 findings: ${findings.substring(0, 150)}...`);

    // Stage 2: Format findings into structured JSON (without tools to avoid schema conflicts)
    logDebug("Stage 2: Formatting findings into JSON...");
    const formatPrompt = `Convert the following PC hardware findings into a structured JSON object.

Findings:
${findings}

Part Name Requested: ${input.partName}

SPECIFICATION RULES (Ensure these keys appear in the JSON 'specifications' array):
- **CPU**: 'Architecture' (e.g., "Zen 4"), 'Cores' (e.g., "8"), 'Threads' (e.g., "16"), 'Base Clock (GHz)' (e.g., "4.5 GHz"), 'Boost Clock (GHz)' (e.g., "5.4 GHz"), 'Socket' (e.g., "AM5"), 'TDP / Peak Power' (e.g., "105 W"), 'L3 Cache' (e.g., "32 MB"), 'Memory Support' (e.g., "DDR5"), 'Integrated Graphics' (e.g., "Yes" or "No").
- **GPU**: 'Chipset' (e.g., "RTX 4070"), 'VRAM Capacity' (e.g., "12 GB"), 'Memory Type' (e.g., "GDDR6X"), 'TGP / Power Draw (W)' (e.g., "200 W"), 'Length (Depth) (mm)' (Integer only), 'Slot Thickness' (Round UP to nearest whole number and format exactly as "X slot", e.g., "4 slot"), 'Interface' (e.g., "PCIe 4.0 x16"), 'CUDA Cores' (e.g., "5888" for NVIDIA) or 'Stream Processors' (for AMD).
- **Motherboard**: 'Chipset' (e.g., "B650"), 'Socket' (e.g., "AM5"), 'Form Factor' (e.g., "ATX"), 'RAM Type' (e.g., "DDR5"), 'M.2 Slots' (e.g., "3x Gen4"), 'Back-Connect Support' (e.g., "Yes" or "No"), 'Connectivity' (e.g., "Wi-Fi 6E, 2.5Gb Ethernet"), 'Memory Slots' (e.g., "4"), 'Memory Type' (e.g., "DDR5").
- **RAM**: 'Generation' (e.g., "DDR5"), 'Capacity' (e.g., "32 GB"), 'Speed' (e.g., "6000 MT/s"), 'CAS Latency' (e.g., "CL30"), 'Stick Count' (e.g., "2").
- **Storage**: 'Interface' (e.g., "NVMe M.2"), 'Capacity' (e.g., "1 TB"), 'Read Speed' (e.g., "7000 MB/s"), 'Write Speed' (e.g., "6500 MB/s"), 'TBW Rating' (e.g., "600 TBW"), 'Form Factor' (e.g., "M.2 2280"), 'Type' (e.g., "NVMe SSD").
- **PSU**: 'Wattage (W)' (e.g., "850 W"), 'Efficiency Rating' (e.g., "80+ Gold"), 'Modularity' (e.g., "Fully Modular"), '12VHPWR Support' (e.g., "Native ATX 3.0 / ATX 3.1"), 'Form Factor' (e.g., "ATX / SFX").
- **Case**: 'Max GPU Length' (e.g., "400 mm"), 'Max Cooler Height' (e.g., "170 mm"), 'Max Radiator Size (mm)' (e.g., "360"), 'Mobo Support' (e.g., "ATX, M-ATX, ITX"), 'Radiator Support' (e.g., "360mm Top"), 'Back-Connect Cutout' (e.g., "Yes" or "No"), 'Type' (e.g., "ATX Mid Tower"), 'PSU Form Factor' (e.g., "ATX").
- **Cooler**: 'TDP Rating' (e.g., "250 W"), 'Socket Support' (e.g., "AM4, AM5, LGA1700"), 'Height' (e.g., "165 mm"), 'Radiator Size' (e.g., "360 mm"), 'Type' (e.g., "Air" or "AIO Liquid").

ADDITIONAL FIELDS:
- 'wattage': TDP for CPU/GPU, rated output for PSU (number).
- 'performanceScore': 0-100.
- 'dimensions': {width, height, depth} in mm. For GPUs, 'depth' is the length.
- 'price': number in PHP.
- 'packageType': 'TRAY' or 'BOX' (for CPUs only).
- 'description': brief product highlights in Markdown. IMPORTANT: Use one bullet point per line (e.g., * **Title**: Detail).

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
