import 'dotenv/config';
import { getAdminFirestore } from '../src/firebase/server-init';
import {
  inventoryCategorySlug,
  inventoryItemPath,
} from '../src/lib/inventory-paths';

const LEGACY_TOP_LEVEL_COLLECTIONS = [
  'parts',
  'CPU',
  'GPU',
  'Motherboard',
  'RAM',
  'Storage',
  'PSU',
  'Power Supply',
  'Case',
  'Cooler',
  'CPU Cooler',
  'Monitor',
  'Keyboard',
  'Mouse',
  'Headset',
] as const;

interface LegacyCollectionCheckResult {
  collection: string;
  documentCount: number;
  retired: boolean;
}

interface PrebuiltCheckResult {
  systemId: string;
  name: string;
  componentCount: number;
  unresolvedParts: Array<{ category: string; partId: string }>;
}

async function verifyLegacyPathRetirement(): Promise<void> {
  const expectedProject = process.argv
    .find((arg) => arg.startsWith('--project='))
    ?.slice('--project='.length);

  if (
    !expectedProject ||
    expectedProject !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  ) {
    throw new Error(
      `Pass --project=<active Firebase project ID> to verify the intended database. Expected: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`
    );
  }

  const db = getAdminFirestore();

  // 1. Parallel check of legacy top-level collections
  const legacyCollectionResults: LegacyCollectionCheckResult[] = await Promise.all(
    LEGACY_TOP_LEVEL_COLLECTIONS.map(async (colName) => {
      const snap = await db.collection(colName).limit(10).get();
      const count = snap.size;
      return {
        collection: colName,
        documentCount: count,
        retired: count === 0,
      };
    })
  );

  const violations: string[] = [];
  for (const r of legacyCollectionResults) {
    if (!r.retired) {
      violations.push(
        `Legacy collection '${r.collection}' still contains at least ${r.documentCount} document(s). Must be 0.`
      );
    }
  }

  // 2. Check prebuiltSystems canonical component references
  const prebuiltsSnap = await db.collection('prebuiltSystems').get();
  const prebuilts = prebuiltsSnap.docs.map((doc) => ({
    id: doc.id,
    data: doc.data() as {
      name?: string;
      components?: Record<string, string | string[]>;
    },
  }));

  // Collect all unique component item paths to fetch in parallel
  const itemPathsToFetch = new Set<string>();
  for (const pb of prebuilts) {
    const components = pb.data.components || {};
    for (const [categoryKey, value] of Object.entries(components)) {
      const partIds = Array.isArray(value) ? value : [value];
      for (const rawPartId of partIds) {
        if (
          !rawPartId ||
          rawPartId === 'included-stock-cooler' ||
          rawPartId === 'included-integrated-gpu'
        ) {
          continue;
        }
        try {
          const slug = inventoryCategorySlug(categoryKey);
          itemPathsToFetch.add(inventoryItemPath(slug, rawPartId));
        } catch {
          // invalid category slug will be detected during resolution
        }
      }
    }
  }

  // Batch get all component documents
  const pathArray = Array.from(itemPathsToFetch);
  const docSnaps = pathArray.length > 0
    ? await db.getAll(...pathArray.map((p) => db.doc(p)))
    : [];
  const existingDocPaths = new Set<string>(
    docSnaps.filter((s) => s.exists).map((s) => s.ref.path)
  );

  const prebuiltResults: PrebuiltCheckResult[] = [];
  for (const pb of prebuilts) {
    const components = pb.data.components || {};
    const unresolvedParts: Array<{ category: string; partId: string }> = [];
    let componentCount = 0;

    for (const [categoryKey, value] of Object.entries(components)) {
      const partIds = Array.isArray(value) ? value : [value];
      for (const rawPartId of partIds) {
        if (!rawPartId) continue;
        componentCount++;

        if (
          rawPartId === 'included-stock-cooler' ||
          rawPartId === 'included-integrated-gpu'
        ) {
          continue;
        }

        try {
          const slug = inventoryCategorySlug(categoryKey);
          const itemDocPath = inventoryItemPath(slug, rawPartId);
          if (!existingDocPaths.has(itemDocPath)) {
            unresolvedParts.push({ category: categoryKey, partId: rawPartId });
          }
        } catch {
          unresolvedParts.push({ category: categoryKey, partId: rawPartId });
        }
      }
    }

    if (unresolvedParts.length > 0) {
      violations.push(
        `Prebuilt system '${pb.data.name || pb.id}' (${pb.id}) references unresolvable/unmigrated components: ${JSON.stringify(unresolvedParts)}`
      );
    }

    prebuiltResults.push({
      systemId: pb.id,
      name: pb.data.name || pb.id,
      componentCount,
      unresolvedParts,
    });
  }

  const summary = {
    projectId: expectedProject,
    timestamp: new Date().toISOString(),
    legacyCollectionsChecked: legacyCollectionResults.length,
    legacyCollectionsClean: legacyCollectionResults.every((r) => r.retired),
    prebuiltSystemsChecked: prebuiltResults.length,
    prebuiltSystemsClean: prebuiltResults.every(
      (r) => r.unresolvedParts.length === 0
    ),
    violations,
    legacyCollectionDetails: legacyCollectionResults,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (violations.length > 0) {
    throw new Error(
      `Legacy path retirement verification failed with ${violations.length} violation(s):\n${violations.join('\n')}`
    );
  }
}

verifyLegacyPathRetirement().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
