
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
  price: z.number().describe("Realistic estimated retail price in PHP. Multiply USD MSRP by 56."),
  wattage: z.number().optional().describe("Estimated power consumption (W) or rated output for PSU."),
  performanceScore: z.number().optional().describe("0-100 score relative to modern high-end standards."),
  socket: z.string().optional().describe("Socket type for CPU/Mobo/Cooler (e.g., AM5, LGA1700)."),
  ramType: z.string().optional().describe("Memory type for RAM/Mobo (e.g., DDR4, DDR5)."),
  dimensions: z.object({
    width: z.number(),
    height: z.number(),
    depth: z.number()
  }).optional().describe("Dimensions in mm. Vital for Case and GPU."),
  specifications: z.array(SpecificationSchema).describe('List of key-value specs.'),
});
export type ExtractPartDetailsOutput = z.infer<typeof ExtractPartDetailsOutputSchema>;

export async function extractPartDetails(input: ExtractPartDetailsInput): Promise<ExtractPartDetailsOutput> {
  if (!process.env.NVIDIA_API_KEY) {
    throw new Error("Missing NVIDIA_API_KEY for Extract Part Details.");
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

SPECIFICATION RULES:
- Use neutral, universal keys where possible.
- **CPU**: 'Cores', 'Threads', 'Socket' (MUST match LGA1700, AM5, etc.), 'Base Clock', 'Boost Clock'.
- **GPU**: 'VRAM Capacity', 'Memory Type' (e.g. GDDR6X), 'Bus Width'. 
  - For NVIDIA: Include 'CUDA Cores'.
  - For AMD: Include 'Stream Processors'.
  - For Intel Arc: Include 'Xe-cores'.
- **Motherboard**: 'Socket', 'Chipset', 'Form Factor', 'Memory Type' (DDR4 or DDR5), 'Memory Slots'.
- **RAM**: 'Capacity', 'Speed', 'Type' (DDR4 or DDR5), 'CAS Latency'.
- **Storage**: 'Capacity', 'Type' (NVMe SSD, SATA SSD, HDD), 'Interface', 'Form Factor'.
- **PSU**: 'Efficiency' (e.g. 80+ Gold), 'Form Factor', 'Modularity'.
- **Case**: 'Type' (e.g. ATX Mid Tower), 'Motherboard Support', 'Max GPU Length'.
- **Cooler**: 'Type' (Air, AIO Liquid), 'Socket Support'.

ADDITIONAL FIELDS:
- 'wattage': TDP for CPU/GPU, rated output for PSU.
- 'performanceScore': 0-100 (e.g., i9-14900K = 98, RTX 4090 = 100, RTX 3060 = 65).
- 'socket': Extract the socket type (e.g., "LGA1700", "AM5") into this top-level field if applicable.
- 'ramType': Extract "DDR4" or "DDR5" into this top-level field for RAM and Motherboards.
- 'dimensions': Extract {width, height, depth} in mm. Crucial for GPUs (length is width) and Cases.

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
  "socket": "...",
  "ramType": "...",
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

