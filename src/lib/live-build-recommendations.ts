import { checkCompatibility, checkFullBuildCompatibility } from './compatibility';
import { isIncludedIntegratedGpu } from './integrated-graphics';
import type { ComponentData, Part, Resolution, WorkloadType } from './types';

export type BuilderSelection = Record<string, ComponentData | ComponentData[] | null>;
export type RecommendationAction = 'add' | 'replace';
export type RecommendationRole = 'bestMatch' | 'bestValue';
export type RecommendationCandidate = {
  part: Part;
  action: RecommendationAction;
  role: RecommendationRole;
  reason: string;
  projectedCompleteTotal?: number;
};

export type BudgetProjection = {
  currentTotal: number;
  minimumRemaining: number | null;
  minimumCompleteTotal: number | null;
  missingCategories: Part['category'][];
  unavailableCategories: Part['category'][];
};

/** Show the two recommendation roles before the filtered catalog, without duplicate cards. */
export function prioritizeRecommendedParts<T extends Part>(
  filteredParts: T[], suggestions: readonly { part: Part }[],
): Part[] {
  const filteredByKey = new Map(filteredParts.map(part => [`${part.category}:${part.id}`, part]));
  const promotedKeys = new Set<string>();
  const promoted = suggestions.slice(0, 2).flatMap(({ part }) => {
    const key = `${part.category}:${part.id}`;
    if (promotedKeys.has(key)) return [];
    promotedKeys.add(key);
    return [{ ...filteredByKey.get(key), ...part }];
  });
  return [...promoted, ...filteredParts.filter(part => !promotedKeys.has(`${part.category}:${part.id}`))];
}

export const CORE_RECOMMENDATION_CATEGORIES = [
  'Motherboard', 'CPU', 'GPU', 'RAM', 'Storage', 'PSU', 'Cooler', 'Case',
] as const satisfies readonly Part['category'][];

const powerCategories = new Set<Part['category']>(['CPU', 'GPU', 'Motherboard', 'RAM', 'Storage', 'Cooler']);

export function selectedInventoryParts(build: BuilderSelection): { category: Part['category']; id: string }[] {
  return Object.entries(build).flatMap(([category, value]) => {
    const items = Array.isArray(value) ? value : value ? [value] : [];
    return items.filter(part => part.id && part.id !== 'included-stock-cooler' && !isIncludedIntegratedGpu(part))
      .map(part => ({ category: category as Part['category'], id: part.id }));
  });
}

export function componentFromPart(part: Part): ComponentData {
  return {
    id: part.id,
    model: part.name,
    description: part.description || '',
    price: part.price,
    image: part.imageUrl,
    imageHint: '',
    icon: () => null,
    wattage: part.wattage,
    socket: part.socket,
    ramType: part.ramType,
    performanceScore: part.performanceScore,
    performanceTier: part.performanceTier,
    specifications: part.specifications,
    dimensions: part.dimensions,
  };
}

function itemsIn(build: BuilderSelection, category: string): ComponentData[] {
  const value = build[category];
  return Array.isArray(value) ? value : value ? [value] : [];
}

function buildTotal(build: BuilderSelection): number {
  return Object.values(build).flatMap(value => Array.isArray(value) ? value : value ? [value] : [])
    .reduce((sum, selected) => sum + (selected.price || 0), 0);
}

function trialBuild(build: BuilderSelection, part: Part): BuilderSelection {
  const next = { ...build };
  next[part.category] = part.category === 'RAM' || part.category === 'Storage'
    ? [...itemsIn(build, part.category), componentFromPart(part)]
    : componentFromPart(part);
  return next;
}

function estimatedDraw(build: BuilderSelection): number {
  return [...powerCategories].reduce((sum, category) =>
    sum + itemsIn(build, category).reduce((partSum, part) => partSum + (part.wattage || 0), 0), 0);
}

export function isSafeRecommendation(part: Part, build: BuilderSelection, budget?: number): boolean {
  if (part.isArchived || !Number.isFinite(part.price) || part.price < 0 ||
    !Number.isFinite(part.stock) || part.stock <= 0) return false;
  if (part.category === 'PSU' && (!Number.isFinite(part.wattage) || (part.wattage || 0) <= 0)) return false;
  const selectedCount = itemsIn(build, part.category).filter(selected => selected.id === part.id).length;
  if (selectedCount >= part.stock) return false;
  const current = itemsIn(build, part.category);
  if (part.category !== 'RAM' && part.category !== 'Storage' && current.some(selected => selected.id === part.id)) return false;
  if (!checkCompatibility(part, build).compatible) return false;

  const next = trialBuild(build, part);
  if (checkFullBuildCompatibility(next).some(issue => issue.severity === 'critical')) return false;
  const psu = itemsIn(next, 'PSU')[0];
  if (psu && (!psu.wattage || estimatedDraw(next) * 1.25 > psu.wattage)) return false;
  if (budget && buildTotal(next) > budget) return false;
  return true;
}

/** An optimistic lower bound for finishing all eight core categories with in-stock catalog parts. */
export function getBudgetProjection(inventory: Part[], build: BuilderSelection): BudgetProjection {
  const currentTotal = buildTotal(build);
  const missingCategories = CORE_RECOMMENDATION_CATEGORIES.filter(category => itemsIn(build, category).length === 0);
  const unavailableCategories: Part['category'][] = [];
  let minimumRemaining = 0;

  for (const category of missingCategories) {
    const prerequisiteMissing = (category === 'RAM' || category === 'Storage') && !itemsIn(build, 'Motherboard').length;
    const prices = inventory.filter(part => part.category === category && !part.isArchived &&
      Number.isFinite(part.price) && part.price >= 0 && Number.isFinite(part.stock) && part.stock > 0 &&
      (prerequisiteMissing || isSafeRecommendation(part, build))).map(part => part.price);
    if (!prices.length) {
      unavailableCategories.push(category);
      continue;
    }
    minimumRemaining += prices.reduce((lowest, price) => Math.min(lowest, price), Infinity);
  }

  return {
    currentTotal,
    minimumRemaining: unavailableCategories.length ? null : minimumRemaining,
    minimumCompleteTotal: unavailableCategories.length ? null : currentTotal + minimumRemaining,
    missingCategories: [...missingCategories],
    unavailableCategories,
  };
}

function rankPart(part: Part, workload: WorkloadType, resolution: Resolution): number {
  const performance = part.performanceScore ?? (part.performanceTier ? part.performanceTier * 22 : 45);
  const weight = part.category === 'GPU' && (resolution === '4K' || workload === 'AAA') ? 1.25
    : part.category === 'CPU' && workload === 'Esports' ? 1.2
      : workload === 'VideoEditing' && ['CPU', 'RAM', 'Storage'].includes(part.category) ? 1.2
        : workload === 'Rendering' && part.category === 'GPU' ? 1.3
          : workload === 'Rendering' && ['CPU', 'RAM'].includes(part.category) ? 1.12 : 1;
  const pricePenalty = workload === 'Office' ? 4.5 : 3;
  return performance * weight - Math.log2(Math.max(part.price, 1) + 1) * pricePenalty;
}

function valueRank(part: Part, workload: WorkloadType, resolution: Resolution): number {
  const performance = part.performanceScore ?? (part.performanceTier ? part.performanceTier * 22 : 45);
  const workloadWeight = part.category === 'GPU' && (resolution === '4K' || workload === 'AAA') ? 1.2
    : part.category === 'CPU' && workload === 'Esports' ? 1.15
      : workload === 'VideoEditing' && ['CPU', 'RAM', 'Storage'].includes(part.category) ? 1.15
        : workload === 'Rendering' && part.category === 'GPU' ? 1.25 : 1;
  return (performance * workloadWeight) / Math.sqrt(Math.max(part.price, 1));
}

function assignRecommendationRoles(
  candidates: Omit<RecommendationCandidate, 'role'>[],
  workload: WorkloadType,
  resolution: Resolution,
): RecommendationCandidate[] {
  if (!candidates.length) return [];
  const bestMatch = candidates.reduce((best, candidate) =>
    rankPart(candidate.part, workload, resolution) > rankPart(best.part, workload, resolution) ? candidate : best);
  const alternatives = candidates.filter(candidate =>
    candidate.part.id !== bestMatch.part.id || candidate.part.category !== bestMatch.part.category);
  const bestValue = alternatives.reduce<typeof alternatives[number] | null>((best, candidate) =>
    !best || valueRank(candidate.part, workload, resolution) > valueRank(best.part, workload, resolution)
      ? candidate : best, null);
  return [
    { ...bestMatch, role: 'bestMatch' },
    ...(bestValue ? [{ ...bestValue, role: 'bestValue' as const }] : []),
  ];
}

export function getLiveCandidates(
  inventory: Part[],
  build: BuilderSelection,
  options: { resolution: Resolution; workload: WorkloadType; budget?: number; preferredCategory?: string | null },
): { candidates: RecommendationCandidate[]; message: string; category: Part['category'] | null; projection: BudgetProjection | null } {
  const projection = options.budget ? getBudgetProjection(inventory, build) : null;
  const selectedCount = selectedInventoryParts(build).length;
  if (!selectedCount) return {
    candidates: [], category: null, projection,
    message: 'Add a first part to get recommendations tailored to your build.',
  };

  const preferred = typeof options.preferredCategory === 'string'
    ? inventory.find(part => part.category === options.preferredCategory)?.category
    : undefined;

  if (!preferred && options.budget && (projection?.minimumCompleteTotal === null ||
    (projection?.minimumCompleteTotal !== undefined && projection.minimumCompleteTotal > options.budget))) {
    const repairCategories = ['GPU', 'CPU', 'PSU', 'Cooler'] as const;
    const repairs: Omit<RecommendationCandidate, 'role'>[] = inventory.flatMap(part => {
      if (!repairCategories.some(category => category === part.category)) return [];
      const current = itemsIn(build, part.category)[0];
      if (!current || part.price >= current.price || !isSafeRecommendation(part, build)) return [];
      const nextProjection = getBudgetProjection(inventory, trialBuild(build, part));
      if (nextProjection.minimumCompleteTotal === null || nextProjection.minimumCompleteTotal > options.budget!) return [];
      return [{
        part, action: 'replace' as const,
        reason: 'Lower-cost option that leaves room for the remaining required parts.',
        projectedCompleteTotal: nextProjection.minimumCompleteTotal,
      }];
    });
    const shortfall = projection?.minimumCompleteTotal !== null && projection?.minimumCompleteTotal !== undefined
      ? Math.ceil(projection.minimumCompleteTotal - options.budget) : null;
    return {
      candidates: assignRecommendationRoles(repairs, options.workload, options.resolution),
      category: repairs[0]?.part.category || null,
      projection,
      message: shortfall && shortfall > 0
        ? `The selected parts leave at least ₱${shortfall.toLocaleString('en-PH')} too little for a complete PC. Replace a part or raise the budget.`
        : `A complete PC cannot be priced from the available compatible parts. Replace a selected part or review the budget.`,
    };
  }

  const missing = projection?.missingCategories || CORE_RECOMMENDATION_CATEGORIES.filter(category => itemsIn(build, category).length === 0);
  const workloadPriority: Partial<Record<WorkloadType, readonly Part['category'][]>> = {
    AAA: ['GPU', 'CPU', 'RAM', 'Storage'],
    Esports: ['CPU', 'GPU', 'RAM', 'Storage'],
    VideoEditing: ['CPU', 'RAM', 'Storage', 'GPU'],
    Rendering: ['GPU', 'CPU', 'RAM', 'Storage'],
    Office: ['CPU', 'Storage', 'RAM', 'Motherboard'],
  };
  const prioritizedMissing = workloadPriority[options.workload]?.find(category => missing.includes(category));
  const category = preferred || prioritizedMissing || missing[0] ||
    (options.workload === 'Esports' && itemsIn(build, 'CPU').length ? 'CPU' : 'GPU');
  const current = itemsIn(build, category)[0];
  const isUpgrade = category !== 'RAM' && category !== 'Storage' && !!current;
  const candidates: Omit<RecommendationCandidate, 'role'>[] = inventory.filter(part => {
    if (part.category !== category || !isSafeRecommendation(part, build, options.budget)) return false;
    if (itemsIn(build, category).some(selected => selected.id === part.id)) return false;
    if (!isUpgrade) return true;
    const currentScore = current.performanceScore ?? (current.performanceTier ? current.performanceTier * 22 : 0);
    const nextScore = part.performanceScore ?? (part.performanceTier ? part.performanceTier * 22 : 0);
    return nextScore >= currentScore + 8;
  }).flatMap(part => {
    const projectedCompleteTotal = options.budget
      ? getBudgetProjection(inventory, trialBuild(build, part)).minimumCompleteTotal : null;
    if (options.budget && (projectedCompleteTotal === null || projectedCompleteTotal > options.budget)) return [];
    return [{ part, projectedCompleteTotal: projectedCompleteTotal ?? undefined }];
  }).sort((a, b) => rankPart(b.part, options.workload, options.resolution) -
      rankPart(a.part, options.workload, options.resolution))
    .slice(0, 8)
    .map(({ part, projectedCompleteTotal }) => ({
      part,
      action: isUpgrade ? 'replace' as const : 'add' as const,
      reason: isUpgrade
        ? `Higher listed performance than your current ${category.toLowerCase()}.`
        : options.budget
          ? 'Leaves room for the remaining required parts at current catalog prices.'
          : 'Compatible with your selected parts and within the current stock limit.',
      projectedCompleteTotal,
    }));

  const recommendations = assignRecommendationRoles(candidates, options.workload, options.resolution);
  return {
    candidates: recommendations,
    category,
    projection,
    message: recommendations.length ? '' : options.budget
      ? `No available ${category} leaves enough for the remaining core parts within this budget.`
      : `No available ${category} fits the selected parts right now.`,
  };
}
