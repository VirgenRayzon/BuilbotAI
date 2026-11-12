import { FieldValue } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';

export interface PartPopularityIncrement {
  path: string;
  delta: number;
}

export function aggregatePopularityIncrements(
  increments: Array<PartPopularityIncrement>
): Array<PartPopularityIncrement> {
  const aggregated = new Map<string, number>();

  for (const item of increments) {
    if (!item?.path || typeof item.path !== 'string') continue;
    const delta = Number(item.delta);
    if (!Number.isFinite(delta) || delta <= 0) continue;

    const current = aggregated.get(item.path) ?? 0;
    aggregated.set(item.path, current + delta);
  }

  const results: Array<PartPopularityIncrement> = [];
  for (const [path, delta] of aggregated.entries()) {
    if (delta > 0) {
      results.push({ path, delta });
    }
  }

  return results;
}

export async function recordPartPopularityIncrements(
  db: Firestore,
  increments: Array<PartPopularityIncrement>
): Promise<void> {
  try {
    const aggregated = aggregatePopularityIncrements(increments);
    if (aggregated.length === 0) return;

    const BATCH_SIZE = 400;
    for (let i = 0; i < aggregated.length; i += BATCH_SIZE) {
      const chunk = aggregated.slice(i, i + BATCH_SIZE);
      const batch = db.batch();

      for (const item of chunk) {
        const docRef = db.doc(item.path);
        batch.update(docRef, {
          popularity: FieldValue.increment(item.delta),
        });
      }

      await batch.commit();
    }
  } catch (err) {
    console.warn(
      '[recordPartPopularityIncrements] Non-fatal error recording part popularity:',
      err
    );
  }
}
