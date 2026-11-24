import { createHash } from 'node:crypto';
import type { AiBuildAdvisorRecommendationsInput } from '@/ai/schemas/build-advisor-schemas';
import type { Firestore } from 'firebase-admin/firestore';
import { getCatalogMeta } from './catalog-meta-store';

export interface BuildAdvisorRecommendationCacheKeyInput {
  intendedUse: string;
  budget: string;
  performanceLevel?: string;
  additionalNotes?: string;
  allowFlexibleBudget?: boolean;
  allowAiSearch?: boolean;
  allowWebSearch?: boolean;
}

export interface BuildAdvisorRecommendationCacheKeyParams {
  input: BuildAdvisorRecommendationCacheKeyInput;
  prompt?: string;
  modelSettings?: unknown;
  catalogVersion: number;
}

/**
 * Deterministically constructs a SHA-256 cache key for AI build recommendations,
 * incorporating input parameters, active system prompt, resolved model settings,
 * and the authoritative catalogVersion from siteSettings/catalogMeta.
 *
 * This guarantees that whenever inventory prices, stock, or items change and bump
 * catalogVersion, recommendation cache misses occur without serving stale hardware specs.
 */
export function buildAdvisorRecommendationCacheKey(
  params: BuildAdvisorRecommendationCacheKeyParams
): string {
  const { input, prompt = '', modelSettings = null, catalogVersion } = params;
  return createHash('sha256')
    .update(
      JSON.stringify({
        version: 14,
        catalogVersion,
        intendedUse: input.intendedUse.trim().toLowerCase(),
        budget: input.budget.trim().toLowerCase(),
        performanceLevel: (input.performanceLevel || '').trim().toLowerCase(),
        additionalNotes: (input.additionalNotes || '').trim().toLowerCase(),
        allowFlexibleBudget: Boolean(input.allowFlexibleBudget),
        allowAiSearch: Boolean(input.allowAiSearch),
        allowWebSearch: Boolean(input.allowWebSearch),
        prompt: prompt.trim(),
        modelSettings,
      })
    )
    .digest('hex');
}

/**
 * Convenience helper to compute the recommendation cache key by reading
 * catalogVersion from getCatalogMeta() if not explicitly supplied.
 */
export async function getAdvisorRecommendationCacheKey(
  input: BuildAdvisorRecommendationCacheKeyInput,
  options?: {
    prompt?: string;
    modelSettings?: unknown;
    catalogVersion?: number;
    db?: Firestore;
  }
): Promise<string> {
  const catalogVersion =
    options?.catalogVersion !== undefined
      ? options.catalogVersion
      : (await getCatalogMeta(options?.db)).catalogVersion;

  return buildAdvisorRecommendationCacheKey({
    input,
    prompt: options?.prompt,
    modelSettings: options?.modelSettings,
    catalogVersion,
  });
}

/**
 * Deterministically constructs a SHA-256 cache key for AI build critique requests.
 */
export function buildCritiqueCacheKey(
  input: {
    build?: Record<string, unknown> | null;
    intendedUse?: string;
    performanceLevel?: string;
    additionalNotes?: string;
  },
  modelSettings: unknown
): string {
  const parts = Object.entries(input.build || {}).sort(([a], [b]) => a.localeCompare(b));
  return createHash('sha256')
    .update(
      JSON.stringify({
        version: 3,
        parts,
        intendedUse: (input.intendedUse || '').trim().toLowerCase(),
        performanceLevel: (input.performanceLevel || '').trim().toLowerCase(),
        additionalNotes: (input.additionalNotes || '').trim().toLowerCase(),
        modelSettings,
      })
    )
    .digest('hex');
}
