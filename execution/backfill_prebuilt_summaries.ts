import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { FieldPath } from 'firebase-admin/firestore';
import { getAdminFirestore } from '../src/firebase/server-init';
import {
  buildPrebuiltComponentSummaries,
  extractPrebuiltComponentPartIds,
  calculatePrebuiltDerivedPrice,
} from '../src/lib/prebuilt-summaries';
import { inventoryItemPath } from '../src/lib/inventory-paths';
import type { Part, PrebuiltSystem } from '../src/lib/types';

interface BackupManifest {
  projectId?: string;
  completed?: boolean;
  private?: boolean;
  completedAt?: string;
  backupUri?: string;
}

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const value = (prefix: string) => args.find(arg => arg.startsWith(prefix))?.slice(prefix.length);
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const expectedProject = value('--project=');
const backupPath = value('--backup=');
const after = value('--after=');

async function main() {
  if (!projectId || expectedProject !== projectId) {
    throw new Error('Pass --project=<configured project> to identify the target.');
  }

  if (apply) {
    if (!backupPath) throw new Error('--apply requires --backup=<completed private export manifest>.');
    const backupContent = await readFile(backupPath, 'utf8');
    const backup = JSON.parse(backupContent) as BackupManifest;
    const completedAt = backup.completedAt ? Date.parse(backup.completedAt) : NaN;
    const backupAge = Date.now() - completedAt;

    if (
      backup.projectId !== projectId ||
      backup.completed !== true ||
      backup.private !== true ||
      !Number.isFinite(backupAge) ||
      backupAge < 0 ||
      backupAge > 86_400_000 ||
      typeof backup.backupUri !== 'string' ||
      !backup.backupUri.startsWith(`gs://${projectId}-private-backups/backups/`)
    ) {
      throw new Error('Backup manifest must be completed, private, and match this project.');
    }
  }

  const db = getAdminFirestore();
  const partCache = new Map<string, Part | null>();

  const partResolver = async (category: string, partId: string): Promise<Part | null> => {
    const key = `${category.toLowerCase()}/${partId}`;
    if (partCache.has(key)) return partCache.get(key) ?? null;

    try {
      const snap = await db.doc(inventoryItemPath(category, partId)).get();
      if (snap.exists) {
        const part = { ...snap.data(), id: snap.id } as Part;
        partCache.set(key, part);
        return part;
      }
    } catch {
      // Non-fatal lookup miss
    }

    partCache.set(key, null);
    return null;
  };

  let scanned = 0;
  let pending = 0;
  let updated = 0;
  let active = 0;
  let archived = 0;
  let cursor = after || '';

  while (true) {
    let query = db.collection('prebuiltSystems').orderBy(FieldPath.documentId()).limit(50);
    if (cursor) query = query.startAfter(cursor);
    const page = await query.get();
    if (page.empty) break;

    for (const document of page.docs) {
      cursor = document.id;
      scanned++;
      const system = { ...(document.data() as PrebuiltSystem), id: document.id };

      if (system.isArchived) archived++;
      else active++;

      const expectedPartIds = extractPrebuiltComponentPartIds(system);
      const expectedSummaries = await buildPrebuiltComponentSummaries(system, partResolver);
      const derivedPrice = calculatePrebuiltDerivedPrice(expectedSummaries, system.price);

      const currentPartIds = system.componentPartIds || [];
      const currentSummaries = system.componentSummaries || [];

      const partIdsMatch =
        currentPartIds.length === expectedPartIds.length &&
        currentPartIds.every((id, idx) => id === expectedPartIds[idx]);

      const summariesMatch =
        currentSummaries.length === expectedSummaries.length &&
        currentSummaries.every((s, idx) => {
          const exp = expectedSummaries[idx];
          return (
            s.key === exp.key &&
            s.partId === exp.partId &&
            s.price === exp.price &&
            s.inStock === exp.inStock &&
            s.isArchived === exp.isArchived
          );
        });

      const expectedIsArchived = system.isArchived ?? false;
      const rawData = document.data() as Record<string, unknown>;
      const hasIsArchivedField = typeof rawData.isArchived === 'boolean';

      if (partIdsMatch && summariesMatch && hasIsArchivedField) {
        continue;
      }

      pending++;
      if (apply) {
        await document.ref.update({
          componentPartIds: expectedPartIds,
          componentSummaries: expectedSummaries,
          price: derivedPrice,
          isArchived: expectedIsArchived,
        });
        updated++;
      }
    }

    console.log(JSON.stringify({ checkpoint: cursor, scanned, active, archived, pending, updated }));
    if (page.size < 50) break;
  }

  console.log(
    JSON.stringify({
      complete: true,
      scanned,
      active,
      archived,
      pending,
      updated,
      mode: apply ? 'apply' : 'dry-run',
    })
  );
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
