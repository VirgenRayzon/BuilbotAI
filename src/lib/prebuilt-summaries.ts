import type { Part, PrebuiltSystem, PrebuiltComponentSummary } from './types';
import type { Firestore } from 'firebase-admin/firestore';
import { INCLUDED_INTEGRATED_GPU_ID, createIntegratedGpuPart } from './integrated-graphics';
import { includedCpuCoolerName } from './included-cpu-cooler';
import { inventoryCategoryLabel } from './inventory-paths';

export type { PrebuiltComponentSummary };

export function extractPrebuiltComponentPartIds(system: PrebuiltSystem): string[] {
  if (!system.components) return [];
  const ids = Object.values(system.components).flatMap(val => {
    if (Array.isArray(val)) {
      return val.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
    }
    if (typeof val === 'string' && val.trim().length > 0) {
      return [val.trim()];
    }
    return [];
  });
  return Array.from(new Set(ids));
}

export function calculatePrebuiltDerivedPrice(
  summaries: PrebuiltComponentSummary[],
  fallbackPrice?: number
): number {
  if (!summaries || summaries.length === 0) return fallbackPrice ?? 0;
  const total = summaries.reduce((acc, s) => acc + (Number(s.price) || 0), 0);
  return Math.round(total * 100) / 100;
}

export async function buildPrebuiltComponentSummaries(
  system: PrebuiltSystem,
  partResolver: (category: string, partId: string) => Promise<Part | null> | Part | null
): Promise<PrebuiltComponentSummary[]> {
  const selections = Object.entries(system.components || {}).flatMap(([category, value]) => {
    const list = Array.isArray(value) ? value : [value];
    return list.filter((id): id is string => Boolean(id)).map((partId, index) => ({
      key: `${category}-${index}`,
      category,
      partId,
    }));
  });

  const cpuId = system.components?.cpu;
  let cpuPart: Part | null = null;
  const needsCpu = selections.some(
    s => s.partId === 'included-stock-cooler' || s.partId === INCLUDED_INTEGRATED_GPU_ID
  );
  if (needsCpu && cpuId) {
    cpuPart = await partResolver('cpu', cpuId);
  }

  const summaries = await Promise.all(
    selections.map(async (entry): Promise<PrebuiltComponentSummary> => {
      const canonicalCategory = inventoryCategoryLabel(entry.category) as Part['category'];

      if (entry.category === 'cooler' && entry.partId === 'included-stock-cooler') {
        const coolerName = cpuPart && !cpuPart.isArchived ? includedCpuCoolerName(cpuPart) : null;
        return {
          key: entry.key,
          category: 'Cooler',
          partId: entry.partId,
          productId: null,
          name: coolerName || 'Included stock cooler',
          price: 0,
          imageUrl: '/placeholders/components/cooler.jpg',
          inStock: Boolean(cpuPart && !cpuPart.isArchived && (cpuPart.stock ?? 0) > 0),
          isArchived: Boolean(cpuPart?.isArchived),
        };
      }

      if (entry.partId === INCLUDED_INTEGRATED_GPU_ID) {
        const igpu = cpuPart && !cpuPart.isArchived ? createIntegratedGpuPart(cpuPart) : null;
        return {
          key: entry.key,
          category: 'GPU',
          partId: entry.partId,
          productId: null,
          name: igpu?.name || 'Integrated Graphics',
          price: 0,
          imageUrl: '/placeholders/components/gpu.jpg',
          inStock: Boolean(igpu && cpuPart && !cpuPart.isArchived && (cpuPart.stock ?? 0) > 0),
          isArchived: Boolean(cpuPart?.isArchived),
        };
      }

      const part = await partResolver(entry.category, entry.partId);
      const isArchived = Boolean(part?.isArchived);
      const inStock = Boolean(part && !isArchived && (part.stock ?? 0) > 0);

      return {
        key: entry.key,
        category: (part?.category || canonicalCategory) as Part['category'],
        partId: part?.id || entry.partId,
        productId: part?.productId || null,
        name: part?.name || entry.partId,
        price: part?.price ?? 0,
        imageUrl: part?.imageUrl || part?.images?.[0] || '',
        inStock,
        isArchived,
      };
    })
  );

  return summaries;
}

export async function syncPrebuiltSummariesForPart(
  db: Firestore | any,
  partPath: string,
  partData: Part
): Promise<void> {
  const partId = partData.id || partPath.split('/').pop() || '';
  if (!partId) return;

  const snapshot = await db
    .collection('prebuiltSystems')
    .where('componentPartIds', 'array-contains', partId)
    .get();

  if (!snapshot || snapshot.empty) return;

  const updates = snapshot.docs.map(async (docSnap: any) => {
    const data = docSnap.data() as PrebuiltSystem;
    const existingSummaries = data.componentSummaries;
    if (!existingSummaries || !Array.isArray(existingSummaries)) return;

    let hasChanged = false;
    const updatedSummaries = existingSummaries.map((summary: PrebuiltComponentSummary) => {
      const isTargetPart = summary.partId === partId || (summary.productId && summary.productId === partData.productId);
      if (isTargetPart) {
        hasChanged = true;
        const isArchived = Boolean(partData.isArchived);
        const inStock = !isArchived && (partData.stock ?? 0) > 0;
        return {
          ...summary,
          price: partData.price ?? summary.price,
          name: partData.name ?? summary.name,
          imageUrl: partData.imageUrl || partData.images?.[0] || summary.imageUrl,
          inStock,
          isArchived,
          productId: partData.productId ?? summary.productId,
        };
      }

      if (partData.category === 'CPU') {
        if (summary.partId === 'included-stock-cooler') {
          hasChanged = true;
          const isArchived = Boolean(partData.isArchived);
          const inStock = !isArchived && (partData.stock ?? 0) > 0;
          const coolerName = !isArchived ? includedCpuCoolerName(partData) : null;
          return {
            ...summary,
            name: coolerName || summary.name,
            inStock,
            isArchived,
          };
        }
        if (summary.partId === INCLUDED_INTEGRATED_GPU_ID) {
          hasChanged = true;
          const isArchived = Boolean(partData.isArchived);
          const inStock = !isArchived && (partData.stock ?? 0) > 0;
          const igpu = !isArchived ? createIntegratedGpuPart(partData) : null;
          return {
            ...summary,
            name: igpu?.name || summary.name,
            inStock,
            isArchived,
          };
        }
      }

      return summary;
    });

    if (hasChanged) {
      const derivedPrice = calculatePrebuiltDerivedPrice(updatedSummaries, data.price);
      await docSnap.ref.update({
        componentSummaries: updatedSummaries,
        price: derivedPrice,
      });
    }
  });

  await Promise.all(updates);
}
