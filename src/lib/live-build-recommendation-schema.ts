import { z } from 'zod';

export const recommendationCategorySchema = z.enum([
  'CPU', 'GPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Case', 'Cooler',
  'Monitor', 'Keyboard', 'Mouse', 'Headset',
]);

const partReferenceSchema = z.object({
  category: recommendationCategorySchema,
  id: z.string().min(1).max(128).regex(/^[^/]+$/),
}).strict();

export const recommendationRoleSchema = z.enum(['bestMatch', 'bestValue']);
const candidateReferenceSchema = partReferenceSchema.extend({ role: recommendationRoleSchema }).strict();

export const liveRecommendationRequestSchema = z.object({
  mode: z.enum(['validate', 'verify']),
  selected: z.array(partReferenceSchema).max(40),
  candidates: z.array(candidateReferenceSchema).max(2),
  includedCooler: z.boolean().optional(),
  budget: z.number().positive().max(10_000_000).optional(),
}).strict();

export const liveRecommendationResponseSchema = z.object({
  projection: z.object({
    currentTotal: z.number(),
    minimumRemaining: z.number().nullable(),
    minimumCompleteTotal: z.number().nullable(),
    missingCategories: z.array(recommendationCategorySchema),
    unavailableCategories: z.array(recommendationCategorySchema),
  }).nullable(),
  suggestions: z.array(z.object({
    id: z.string(),
    category: recommendationCategorySchema,
    name: z.string(),
    price: z.number(),
    stock: z.number(),
    action: z.enum(['add', 'replace']),
    role: recommendationRoleSchema,
    reason: z.string(),
    projectedCompleteTotal: z.number().optional(),
  })).max(2),
});

export type LiveRecommendationRequest = z.infer<typeof liveRecommendationRequestSchema>;
export type LiveRecommendationResponse = z.infer<typeof liveRecommendationResponseSchema>;
