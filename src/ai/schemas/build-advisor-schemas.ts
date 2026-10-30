import { z } from 'zod';

// Input Schema Definition
export const AiBuildAdvisorRecommendationsInputSchema = z.object({
  intendedUse: z
    .string()
    .describe(
      'The primary intended use of the PC (e.g., gaming, video editing, software development, general office work).'
    ),
  budget: z
    .string()
    .describe(
      'The approximate budget for the PC build in Philippine Peso (PHP) (e.g., "around ₱50,000", "75k PHP budget").'
    ),
  performanceLevel: z
    .string()
    .optional()
    .default('Optimal performance for budget and intended workload')
    .describe(
      'The desired performance level (e.g., "high performance for 4K gaming", "good for 1080p gaming", "reliable for daily tasks").'
    ),
  additionalNotes: z
    .string()
    .optional()
    .describe('Any additional specific requirements or preferences from the user.'),
  allowFlexibleBudget: z
    .boolean()
    .optional()
    .describe('Whether the AI is allowed to exceed the budget by up to 30% for significantly better value/performance.'),
  allowAiSearch: z
    .boolean()
    .optional()
    .default(true)
    .describe('When true, AI can recommend store and outside-market parts. When false, use in-stock inventory with deterministic budget and compatibility rules, without a model call.'),
  allowWebSearch: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to run a live Google Search for current PC hardware information before recommending a build.'),
});

export type AiBuildAdvisorRecommendationsInput = z.infer<
  typeof AiBuildAdvisorRecommendationsInputSchema
>;

// Output Schema Definition
export const AiBuildAdvisorRecommendationsOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      'A brief overall summary of the recommended build strategy and its compatibility.'
    ),
  cpu: z.object({
    partId: z.string().describe('Exact store inventory ID, or an empty string only for an external-market part.'),
    model: z.string().describe('The recommended CPU model name.'),
    description: z.string().describe('A brief explanation for the CPU recommendation.'),
    estimatedPrice: z.number().describe('The estimated price in PHP for this component.'),
    socket: z.string().optional().describe('CPU socket, required when this is an external-market CPU.'),
    integratedGraphics: z.string().optional().describe('For an external CPU, state its integrated graphics model or No. Do not guess when unknown.'),
  }),
  gpu: z.object({
    partId: z.string().describe('Exact store inventory ID, included-integrated-gpu for graphics included with the selected CPU, or an empty string for an external-market card.'),
    model: z.string().describe('The recommended GPU model name.'),
    description: z.string().describe('A brief explanation for the GPU recommendation.'),
    estimatedPrice: z.number().describe('The estimated price in PHP for this component.'),
  }),
  motherboard: z.object({
    partId: z.string().describe('Exact store inventory ID, or an empty string only for an external-market part.'),
    model: z.string().describe('The recommended Motherboard model name.'),
    description: z.string().describe('A brief explanation for the Motherboard recommendation, highlighting compatibility with CPU and RAM.'),
    estimatedPrice: z.number().describe('The estimated price in PHP for this component.'),
    socket: z.string().optional().describe('Motherboard CPU socket, required for an external-market motherboard.'),
    ramType: z.string().optional().describe('Supported RAM generation such as DDR4 or DDR5, required for an external-market motherboard.'),
    formFactor: z.string().optional().describe('ATX, Micro ATX, or Mini ITX, required for an external-market motherboard.'),
    nvmeSlots: z.number().optional().describe('Number of NVMe slots, required for an external-market motherboard.'),
    sataSlots: z.number().optional().describe('Number of SATA ports, required for an external-market motherboard.'),
  }),
  ram: z.object({
    partId: z.string().describe('Exact store inventory ID, or an empty string only for an external-market part.'),
    model: z.string().describe('The recommended RAM model and specifications (e.g., "Corsair Vengeance RGB DDR5 32GB (2x16GB) 6000MHz").'),
    description: z.string().optional().default('').describe('Optional brief spec tag or empty string.'),
    estimatedPrice: z.number().describe('The estimated price in PHP for this component.'),
    ramType: z.string().optional().describe('DDR4 or DDR5 generation, required for external-market RAM.'),
  }),
  storage: z.object({
    partId: z.string().describe('Exact store inventory ID, or an empty string only for an external-market part.'),
    model: z.string().describe('The recommended Storage (SSD/HDD) model name.'),
    description: z.string().optional().default('').describe('Optional brief spec tag or empty string.'),
    estimatedPrice: z.number().describe('The estimated price in PHP for this component.'),
    storageType: z.string().optional().describe('NVMe or SATA, required for external-market storage.'),
  }),
  psu: z.object({
    partId: z.string().describe('Exact store inventory ID, or an empty string only for an external-market part.'),
    model: z.string().describe('The recommended Power Supply Unit (PSU) model name.'),
    description: z.string().optional().default('').describe('Optional brief spec tag or empty string.'),
    estimatedPrice: z.number().describe('The estimated price in PHP for this component.'),
  }),
  case: z.object({
    partId: z.string().describe('Exact store inventory ID, or an empty string only for an external-market part.'),
    model: z.string().describe('The recommended PC Case model name.'),
    description: z.string().optional().default('').describe('Optional brief spec tag or empty string.'),
    estimatedPrice: z.number().describe('The estimated price in PHP for this component.'),
    moboSupport: z.string().optional().describe('Supported motherboard form factors, required for an external-market case.'),
    maxRadiatorSizeMm: z.number().optional().describe('Maximum radiator size in millimeters, or 0 if no radiator support.'),
  }),
  cooler: z.object({
    partId: z.string().describe('Exact store inventory ID, or an empty string only for an external-market part.'),
    model: z.string().describe('The recommended CPU Cooler model name.'),
    description: z.string().optional().default('').describe('Optional brief spec tag or empty string.'),
    estimatedPrice: z.number().describe('The estimated price in PHP for this component.'),
    radiatorSizeMm: z.number().optional().describe('Radiator size in millimeters, or 0 for an air cooler.'),
  }),
  estimatedWattage: z.string().describe('The estimated total wattage for the build, in the format "550W".'),
});

export type AiBuildAdvisorRecommendationsOutput = z.infer<
  typeof AiBuildAdvisorRecommendationsOutputSchema
>;
