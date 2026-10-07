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
    .describe('Whether the AI is allowed to recommend parts outside the local store inventory using broader market knowledge.'),
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
    model: z.string().describe('The recommended CPU model name.'),
    description: z.string().describe('A brief explanation for the CPU recommendation.'),
    estimatedPrice: z.number().describe('The estimated price in PHP for this component.'),
  }),
  gpu: z.object({
    model: z.string().describe('The recommended GPU model name.'),
    description: z.string().describe('A brief explanation for the GPU recommendation.'),
    estimatedPrice: z.number().describe('The estimated price in PHP for this component.'),
  }),
  motherboard: z.object({
    model: z.string().describe('The recommended Motherboard model name.'),
    description: z.string().describe('A brief explanation for the Motherboard recommendation, highlighting compatibility with CPU and RAM.'),
    estimatedPrice: z.number().describe('The estimated price in PHP for this component.'),
  }),
  ram: z.object({
    model: z.string().describe('The recommended RAM model and specifications (e.g., "Corsair Vengeance RGB DDR5 32GB (2x16GB) 6000MHz").'),
    description: z.string().optional().default('').describe('Optional brief spec tag or empty string.'),
    estimatedPrice: z.number().describe('The estimated price in PHP for this component.'),
  }),
  storage: z.object({
    model: z.string().describe('The recommended Storage (SSD/HDD) model name.'),
    description: z.string().optional().default('').describe('Optional brief spec tag or empty string.'),
    estimatedPrice: z.number().describe('The estimated price in PHP for this component.'),
  }),
  psu: z.object({
    model: z.string().describe('The recommended Power Supply Unit (PSU) model name.'),
    description: z.string().optional().default('').describe('Optional brief spec tag or empty string.'),
    estimatedPrice: z.number().describe('The estimated price in PHP for this component.'),
  }),
  case: z.object({
    model: z.string().describe('The recommended PC Case model name.'),
    description: z.string().optional().default('').describe('Optional brief spec tag or empty string.'),
    estimatedPrice: z.number().describe('The estimated price in PHP for this component.'),
  }),
  cooler: z.object({
    model: z.string().describe('The recommended CPU Cooler model name.'),
    description: z.string().optional().default('').describe('Optional brief spec tag or empty string.'),
    estimatedPrice: z.number().describe('The estimated price in PHP for this component.'),
  }),
  estimatedWattage: z.string().describe('The estimated total wattage for the build, in the format "550W".'),
});

export type AiBuildAdvisorRecommendationsOutput = z.infer<
  typeof AiBuildAdvisorRecommendationsOutputSchema
>;
