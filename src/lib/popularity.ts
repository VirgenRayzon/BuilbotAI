import type { Part } from '@/lib/types';

export const POPULARITY_LIMIT = 10;

export function getPopularityCategories(parts: Part[]) {
    const groups = new Map<string, Part[]>();

    parts.forEach((part) => {
        const categoryParts = groups.get(part.category) ?? [];
        categoryParts.push(part);
        groups.set(part.category, categoryParts);
    });

    return Array.from(groups, ([category, categoryParts]) => {
        const rankedParts = [...categoryParts]
            .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
            .slice(0, POPULARITY_LIMIT);

        return {
            category,
            parts: rankedParts,
            maxPopularity: Math.max(rankedParts[0]?.popularity ?? 0, 1),
        };
    }).sort((a, b) => a.category.localeCompare(b.category));
}
