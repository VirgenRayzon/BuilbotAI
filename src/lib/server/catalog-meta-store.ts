import { FieldValue } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/firebase/server-init';
import { INVENTORY_CATEGORY_LABELS, INVENTORY_CATEGORY_SLUGS, inventoryItemsPath } from '../inventory-paths';
import { CatalogMetaSchema, type CatalogMeta } from '../catalog-meta';

export const CATALOG_META_DOC_PATH = 'siteSettings/catalogMeta';

export async function getCatalogMeta(db?: Firestore): Promise<CatalogMeta> {
  const firestore = db ?? getAdminFirestore();
  const docRef = firestore.collection('siteSettings').doc('catalogMeta');
  const snap = await docRef.get();
  if (!snap.exists) {
    return {
      catalogVersion: 0,
      updatedAt: 0,
      brandsByCategory: {},
      activeCountsByCategory: {},
    };
  }
  const data = snap.data() || {};
  return CatalogMetaSchema.parse(data);
}

export async function computeCatalogFacets(
  db: Firestore
): Promise<{
  brandsByCategory: Record<string, string[]>;
  activeCountsByCategory: Record<string, number>;
}> {
  const brandsByCategory: Record<string, string[]> = {};
  const activeCountsByCategory: Record<string, number> = {};

  await Promise.all(
    INVENTORY_CATEGORY_SLUGS.map(async (slug) => {
      const categoryLabel = INVENTORY_CATEGORY_LABELS[slug];
      const snapshot = await db
        .collection(inventoryItemsPath(slug))
        .where('isArchived', '==', false)
        .select('brand', 'category')
        .get();

      const brandsSet = new Set<string>();
      let activeCount = 0;

      for (const doc of snapshot.docs) {
        activeCount++;
        const brand = doc.get('brand');
        if (typeof brand === 'string' && brand.trim()) {
          brandsSet.add(brand.trim());
        }
      }

      brandsByCategory[categoryLabel] = Array.from(brandsSet).sort();
      activeCountsByCategory[categoryLabel] = activeCount;
    })
  );

  return { brandsByCategory, activeCountsByCategory };
}

export async function bumpCatalogMetaVersion(
  db: Firestore,
  options?: { refreshFacets?: boolean }
): Promise<number> {
  const metaRef = db.collection('siteSettings').doc('catalogMeta');
  const now = Date.now();

  if (options?.refreshFacets) {
    const { brandsByCategory, activeCountsByCategory } = await computeCatalogFacets(db);
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(metaRef);
      const currentVersion = snap.exists ? Number(snap.get('catalogVersion')) || 0 : 0;
      const nextVersion = currentVersion + 1;
      tx.set(
        metaRef,
        {
          catalogVersion: nextVersion,
          updatedAt: now,
          brandsByCategory,
          activeCountsByCategory,
        },
        { merge: true }
      );
      return nextVersion;
    });
  }

  return await db.runTransaction(async (tx) => {
    const snap = await tx.get(metaRef);
    if (!snap.exists) {
      const initial: CatalogMeta = {
        catalogVersion: 1,
        updatedAt: now,
        brandsByCategory: {},
        activeCountsByCategory: {},
      };
      tx.set(metaRef, initial);
      return 1;
    }
    const currentVersion = Number(snap.get('catalogVersion')) || 0;
    const nextVersion = currentVersion + 1;
    tx.set(
      metaRef,
      {
        catalogVersion: FieldValue.increment(1),
        updatedAt: now,
      },
      { merge: true }
    );
    return nextVersion;
  });
}
