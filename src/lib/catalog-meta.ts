import { z } from 'zod';

export const CatalogMetaSchema = z.object({
  catalogVersion: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
  brandsByCategory: z.record(z.string(), z.array(z.string())).default({}),
  activeCountsByCategory: z.record(z.string(), z.number().int().nonnegative()).default({}),
});

export type CatalogMeta = z.infer<typeof CatalogMetaSchema>;

export interface SearchTokenSource {
  name?: unknown;
  brand?: unknown;
  sku?: unknown;
  productId?: unknown;
}

export function deriveSearchTokens(source: SearchTokenSource): string[] {
  if (!source || typeof source !== 'object') {
    return [];
  }

  const rawValues: string[] = [];
  if (typeof source.name === 'string' && source.name.trim()) rawValues.push(source.name.trim());
  if (typeof source.brand === 'string' && source.brand.trim()) rawValues.push(source.brand.trim());
  if (typeof source.sku === 'string' && source.sku.trim()) rawValues.push(source.sku.trim());
  if (typeof source.productId === 'string' && source.productId.trim()) rawValues.push(source.productId.trim());

  if (rawValues.length === 0) {
    return [];
  }

  const exactTokens = new Set<string>();
  const prefixCandidates = new Set<string>();

  for (const raw of rawValues) {
    const lower = raw.toLowerCase();

    // Alphanumeric segments (words/numbers)
    const segments = lower.split(/[^a-z0-9]+/).filter(Boolean);
    for (const segment of segments) {
      exactTokens.add(segment);
      prefixCandidates.add(segment);
    }

    // For single identifiers without whitespace (e.g. SKUs, product IDs like ASUS-4070S, PRD-100042)
    if (!/\s/.test(lower)) {
      if (lower.includes('-') || lower.includes('_')) {
        exactTokens.add(lower);
      }
      const collapsed = lower.replace(/[^a-z0-9]/g, '');
      if (collapsed && collapsed !== lower) {
        exactTokens.add(collapsed);
        prefixCandidates.add(collapsed);
      }
    }
  }

  // Generate 3-6 char prefixes for partial SKU/model matches
  const prefixTokens = new Set<string>();
  for (const candidate of prefixCandidates) {
    if (candidate.length > 3) {
      for (let len = 3; len <= 6 && len < candidate.length; len++) {
        const prefix = candidate.slice(0, len);
        if (!exactTokens.has(prefix)) {
          prefixTokens.add(prefix);
        }
      }
    }
  }

  const result: string[] = [];
  for (const token of exactTokens) {
    if (result.length >= 40) break;
    result.push(token);
  }
  for (const prefix of prefixTokens) {
    if (result.length >= 40) break;
    result.push(prefix);
  }

  return result;
}

export function parseSearchQueryTokens(query: unknown): string[] {
  if (typeof query !== 'string') return [];
  const lower = query.trim().toLowerCase();
  if (!lower) return [];
  return lower.split(/[^a-z0-9]+/).filter(Boolean);
}

export function findLongestSearchToken(tokens: readonly string[]): string {
  let longest = '';
  for (const token of tokens) {
    if (token.length > longest.length) {
      longest = token;
    }
  }
  return longest;
}
