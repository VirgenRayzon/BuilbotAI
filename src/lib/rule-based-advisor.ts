import type { AiBuildAdvisorRecommendationsInput, AiBuildAdvisorRecommendationsOutput } from '@/ai/schemas/build-advisor-schemas';
import { checkFullBuildCompatibility } from '@/lib/compatibility';
import { getBuildAdvisorGoal } from '@/lib/build-advisor-goals';
import { INCLUDED_INTEGRATED_GPU_ID, integratedGraphicsName } from '@/lib/integrated-graphics';
import type { StructuredPart } from '@/lib/inventory-fetcher';
import type { ComponentData } from '@/lib/types';
import { Cpu } from 'lucide-react';
import { validateAdvisorBuild } from '@/lib/validate-advisor-build';

type Category = 'cpu' | 'motherboard' | 'ram' | 'storage' | 'gpu' | 'psu' | 'case' | 'cooler';
type Choice = StructuredPart | { id: typeof INCLUDED_INTEGRATED_GPU_ID; name: string; price: 0; category: 'gpu'; wattage: 0 };
type Candidate = { parts: Partial<Record<Category, Choice>>; total: number; score: number };

const ORDER: Category[] = ['cpu', 'motherboard', 'ram', 'storage', 'gpu', 'psu', 'case', 'cooler'];
const MAX_CHOICES = 18;
const BEAM_WIDTH = 180;

const asComponent = (part: Choice): ComponentData => ({
  id: part.id, model: part.name, price: part.price,
  description: '', image: '', imageHint: '', icon: Cpu,
  socket: 'socket' in part ? part.socket : undefined,
  ramType: 'ramType' in part ? part.ramType : undefined,
  specifications: 'specifications' in part ? part.specifications as ComponentData['specifications'] : undefined,
  wattage: part.wattage,
});

function workloadWeights(input: AiBuildAdvisorRecommendationsInput): Record<Category, number> {
  const goal = Object.entries({
    Gaming: ['4k-quality', 'high-fps', '1440p-balanced', '1080p-value'],
    'Video Editing': ['1080p-editing', '4k-editing', 'effects-color'],
    'Software Development': ['web-apps', 'containers', 'local-ai'],
    'General Office Work': ['daily-office', 'multitasking', 'quiet-compact'],
  }).find(([use]) => use === input.intendedUse)?.[1].find(value => getBuildAdvisorGoal(input.intendedUse, value)?.prompt === input.performanceLevel);
  const base = { cpu: 1.2, motherboard: 0.3, ram: 0.7, storage: 0.6, gpu: 0.3, psu: 0.2, case: 0.2, cooler: 0.1 };
  if (input.intendedUse === 'Gaming') return { ...base, cpu: goal === 'high-fps' ? 2.3 : 1.6, gpu: goal === '4k-quality' ? 3.3 : 2.7 };
  if (input.intendedUse === 'Video Editing') return { ...base, cpu: 2.2, ram: 1.6, storage: 1.3, gpu: goal === 'effects-color' ? 2.2 : 0.9 };
  if (input.intendedUse === 'Software Development') return { ...base, cpu: 2, ram: 1.7, storage: 1.1, gpu: goal === 'local-ai' ? 3 : 0.15 };
  return { ...base, cpu: 1.3, ram: goal === 'multitasking' ? 1.5 : 0.8, gpu: 0.05, case: goal === 'quiet-compact' ? 0.8 : 0.2 };
}

function shortlist(items: StructuredPart[]): StructuredPart[] {
  const byPrice = [...items].sort((a, b) => a.price - b.price || a.id.localeCompare(b.id));
  const byPerformance = [...items].sort((a, b) => (b.performanceScore ?? 0) - (a.performanceScore ?? 0) || a.price - b.price);
  const chosen = [...byPrice.slice(0, MAX_CHOICES), ...byPerformance.slice(0, 6)];
  return chosen.filter((part, index) => chosen.findIndex(other => other.id === part.id) === index);
}

function compatible(parts: Partial<Record<Category, Choice>>): boolean {
  const build: Record<string, ComponentData | ComponentData[] | null> = {};
  for (const [category, part] of Object.entries(parts)) {
    if (!part || part.id === INCLUDED_INTEGRATED_GPU_ID) continue;
    const key = category === 'cpu' ? 'CPU' : category === 'gpu' ? 'GPU' : category === 'psu' ? 'PSU' : category[0].toUpperCase() + category.slice(1);
    build[key] = category === 'ram' || category === 'storage' ? [asComponent(part)] : asComponent(part);
  }
  return !checkFullBuildCompatibility(build).some(issue => issue.severity === 'critical');
}

function scorePart(part: Choice, category: Category, weights: Record<Category, number>, prices: number[], budget: number): number {
  if (part.id === INCLUDED_INTEGRATED_GPU_ID) return weights.gpu < 0.4 ? 18 : -4;
  const highest = Math.max(...prices, 1);
  const performance = 'performanceScore' in part && typeof part.performanceScore === 'number'
    ? part.performanceScore / 100 : Math.sqrt(part.price / highest);
  return weights[category] * performance * 12 - part.price / budget * 5;
}

function toOutput(parts: Record<Category, Choice>, input: AiBuildAdvisorRecommendationsInput, total: number): AiBuildAdvisorRecommendationsOutput {
  const cpu = parts.cpu;
  const integrated = parts.gpu.id === INCLUDED_INTEGRATED_GPU_ID;
  const purpose = input.intendedUse.toLowerCase();
  const summary = `An in-stock build for ${purpose} at ₱${total.toLocaleString('en-PH')}. ${integrated
    ? `${cpu.name}'s included graphics use shared system memory and avoid a separate graphics card.`
    : `The ${parts.gpu.name} provides dedicated graphics.`} Parts were selected using budget and compatibility rules; confirm specifications and availability before reserving.`;
  const entry = (category: Category) => ({
    partId: parts[category].id,
    model: parts[category].name,
    description: category === 'cpu' ? `Selected for ${purpose} within the budget.`
      : category === 'gpu' && integrated ? `Included with ${cpu.name}; uses shared system memory.`
      : category === 'motherboard' ? `Selected for compatibility with ${cpu.name}.` : '',
    estimatedPrice: parts[category].price,
  });
  const draw = ORDER.filter(category => category !== 'psu').reduce((sum, category) => sum + (parts[category].wattage ?? 0), 0);
  return {
    summary, cpu: entry('cpu'), gpu: entry('gpu'), motherboard: entry('motherboard'),
    ram: entry('ram'), storage: entry('storage'), psu: entry('psu'), case: entry('case'), cooler: entry('cooler'),
    estimatedWattage: `${Math.ceil(draw)}W`,
  };
}

export function recommendFromInventory(
  input: AiBuildAdvisorRecommendationsInput,
  inventory: StructuredPart[],
  budgetLimit: number,
): AiBuildAdvisorRecommendationsOutput | null {
  const available = inventory.filter(part => !part.isArchived && Number.isFinite(part.price) && part.price > 0
    && (typeof part.stock !== 'number' || part.stock > 0));
  const groups = Object.fromEntries(ORDER.map(category => [category, shortlist(available.filter(part => part.category === category))])) as Record<Category, StructuredPart[]>;
  if (ORDER.some(category => category !== 'gpu' && groups[category].length === 0)) return null;
  const weights = workloadWeights(input);
  const minimum = Object.fromEntries(ORDER.map(category => [category, Math.min(...groups[category].map(part => part.price))])) as Record<Category, number>;
  minimum.gpu = Math.min(minimum.gpu, groups.cpu.some(cpu => integratedGraphicsName(cpu)) ? 0 : Infinity);
  let beam: Candidate[] = [{ parts: {}, total: 0, score: 0 }];

  for (const [index, category] of ORDER.entries()) {
    const next: Candidate[] = [];
    for (const candidate of beam) {
      const cpu = candidate.parts.cpu;
      const included = category === 'gpu' && cpu && integratedGraphicsName(cpu)
        ? [{ id: INCLUDED_INTEGRATED_GPU_ID, category: 'gpu' as const, name: integratedGraphicsName(cpu)!, price: 0 as const, wattage: 0 as const,
          brand: '', model: '', imageUrl: '' }]
        : [];
      const choices: Choice[] = [...groups[category], ...included];
      for (const part of choices) {
        if (category === 'gpu' && part.id === INCLUDED_INTEGRATED_GPU_ID && input.intendedUse === 'Gaming'
          && !input.performanceLevel.toLowerCase().includes('budget')) continue;
        if (category === 'gpu' && part.id === INCLUDED_INTEGRATED_GPU_ID && input.performanceLevel.toLowerCase().includes('local ai')) continue;
        const total = candidate.total + part.price;
        const remaining = ORDER.slice(index + 1).reduce((sum, key) => sum + minimum[key], 0);
        if (total + remaining > budgetLimit) continue;
        const parts = { ...candidate.parts, [category]: part };
        if (!compatible(parts)) continue;
        if (category === 'psu') {
          const draw = ORDER.filter(key => key !== 'psu').reduce((sum, key) => sum + (parts[key]?.wattage ?? 0), 0);
          if (part.wattage && part.wattage < draw * 1.25) continue;
        }
        next.push({ parts, total, score: candidate.score + scorePart(part, category, weights,
          groups[category].map(item => item.price), budgetLimit) });
      }
    }
    next.sort((a, b) => b.score - a.score || a.total - b.total);
    beam = next.slice(0, BEAM_WIDTH);
    if (!beam.length) return null;
  }

  for (const candidate of beam) {
    const parts = candidate.parts as Record<Category, Choice>;
    const output = toOutput(parts, input, candidate.total);
    if (validateAdvisorBuild(output, available, budgetLimit, false).length === 0) return output;
  }
  return null;
}
