import type { AiBuildAdvisorRecommendationsOutput } from '@/ai/schemas/build-advisor-schemas';
import { checkFullBuildCompatibility } from '@/lib/compatibility';
import type { StructuredPart } from '@/lib/inventory-fetcher';
import type { ComponentData } from '@/lib/types';

const CATEGORIES = ['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler'] as const;

export function validateAdvisorBuild(
  output: AiBuildAdvisorRecommendationsOutput,
  selected: StructuredPart[],
  budgetLimit: number,
  allowAiSearch: boolean,
): string[] {
  const issues: string[] = [];
  const selectedById = new Map(selected.map(part => [part.id, part]));
  const chosenBuild: Record<string, ComponentData | ComponentData[] | null> = {};
  let total = 0;

  for (const category of CATEGORIES) {
    const component = output[category];
    if (!component?.model?.trim() || !Number.isFinite(component.estimatedPrice) || component.estimatedPrice <= 0) {
      issues.push(`The ${category} is missing a valid model or price.`);
      continue;
    }

    const storePart = component.partId ? selectedById.get(component.partId) : undefined;
    if (component.partId && (!storePart || storePart.category !== category)) {
      issues.push(`The ${category} store ID is invalid or belongs to another category.`);
      continue;
    }
    if (!allowAiSearch && !storePart) {
      issues.push(`The ${category} must be selected from current store inventory.`);
      continue;
    }

    const key = category === 'cpu' ? 'CPU' : category === 'gpu' ? 'GPU' : category === 'psu'
      ? 'PSU' : category[0].toUpperCase() + category.slice(1);
    let validationPart: ComponentData;
    if (storePart) {
      validationPart = storePart as unknown as ComponentData;
    } else {
      const facts = component as unknown as Record<string, unknown>;
      const requiredText = (field: string) => {
        const value = facts[field];
        if (typeof value !== 'string' || !value.trim()) issues.push(`External ${category} needs a stated ${field}.`);
        return typeof value === 'string' ? value.trim() : '';
      };
      const requiredNumber = (field: string) => {
        const value = facts[field];
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
          issues.push(`External ${category} needs a valid ${field}.`);
        }
        return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
      };
      const specifications: Record<string, string | number> = {};
      let socket = '';
      let ramType = '';
      if (category === 'cpu') socket = requiredText('socket');
      if (category === 'motherboard') {
        socket = requiredText('socket');
        ramType = requiredText('ramType');
        specifications['Form Factor'] = requiredText('formFactor');
        specifications['NVMe Slots'] = requiredNumber('nvmeSlots');
        specifications['SATA Slots'] = requiredNumber('sataSlots');
      }
      if (category === 'ram') ramType = requiredText('ramType');
      if (category === 'storage') specifications['Type'] = requiredText('storageType');
      if (category === 'case') {
        specifications['Mobo Support'] = requiredText('moboSupport');
        specifications['Max Radiator Size (mm)'] = requiredNumber('maxRadiatorSizeMm');
      }
      if (category === 'cooler') specifications['Radiator Size'] = requiredNumber('radiatorSizeMm');
      validationPart = { name: component.model, model: component.model, socket, ramType, specifications } as unknown as ComponentData;
    }
    chosenBuild[key] = category === 'ram' || category === 'storage' ? [validationPart] : validationPart;
    total += storePart?.price ?? component.estimatedPrice;
  }

  if (total > budgetLimit + 1) {
    issues.push(`The actual total is ₱${total.toLocaleString()}, above the ₱${Math.floor(budgetLimit).toLocaleString()} limit.`);
  }
  issues.push(...checkFullBuildCompatibility(chosenBuild)
    .filter(issue => issue.severity === 'critical')
    .map(issue => issue.message));
  if (!output.case.partId && !output.cooler.partId &&
    (output.cooler.radiatorSizeMm ?? 0) > (output.case.maxRadiatorSizeMm ?? 0)) {
    issues.push('The selected cooler radiator does not fit the external case.');
  }
  return issues;
}
