import { z } from 'zod';
import { INVENTORY_CATEGORY_LABELS } from './inventory-paths';

const categoryNames = Object.values(INVENTORY_CATEGORY_LABELS) as [string, ...string[]];

export const adminInventoryQuerySchema = z.object({
  categories: z.array(z.enum(categoryNames)).max(12),
  brands: z.array(z.string().trim().min(1)).max(30).default([]),
  availability: z.enum(['all', 'in-stock', 'out-of-stock']).default('all'),
  search: z.string().trim().max(120).default(''),
  sortBy: z.enum(['Date Added', 'Name', 'Price', 'Brand', 'Stock']).default('Date Added'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
  pageSize: z.number().int().min(1).max(100).default(24),
  cursor: z.string().nullable().optional(),
});

export type AdminInventoryQuery = z.infer<typeof adminInventoryQuerySchema>;

export function usesLegacyInventorySearch(_query: AdminInventoryQuery): boolean {
  return false;
}
