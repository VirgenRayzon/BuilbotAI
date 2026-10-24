import { createHash, randomBytes, randomInt } from 'node:crypto';
import { FieldValue, type DocumentReference, type Firestore } from 'firebase-admin/firestore';
import { formatProductId, productAdminUrl, SKU_ALPHABET, skuPrefix, type CreatedProduct, type ProductKind } from '../product-identity';
import { inventoryItemsPath, INVENTORY_CATEGORY_SLUGS } from '../inventory-paths';
import { resolveSystemParts } from './public-products';
import type { PrebuiltSystem } from '../types';

export function nameKey(name: string): string {
  return createHash('sha256').update(name.trim().toLowerCase()).digest('hex');
}
function newIdentity(category: string) {
  return { sku: skuPrefix(category) + Array.from({ length: 8 }, () => SKU_ALPHABET[randomInt(SKU_ALPHABET.length)]).join(''),
    qrToken: randomBytes(16).toString('hex') };
}

/** All references remain internal. Never change stock while assigning identity. */
export async function assignProductIdentity(db: Firestore, ref: DocumentReference, kind: ProductKind,
  category: string, create?: { payload: Record<string, unknown>; uid: string; operationId: string; fingerprint: string }): Promise<CreatedProduct> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const random = newIdentity(category);
    try {
      return await db.runTransaction(async tx => {
        const operation = create ? db.doc(`catalogOperations/${create.uid}_${create.operationId}`) : null;
        const operationSnap = operation ? await tx.get(operation) : null;
        if (operationSnap?.exists) {
          if (operationSnap.get('fingerprint') !== create?.fingerprint || operationSnap.get('kind') !== kind) throw new Error('This save request belongs to different form contents.');
          return operationSnap.get('result') as CreatedProduct;
        }
        const current = await tx.get(ref);
        if (current.exists && current.get('productId')) {
          if (create) throw new Error('Product already exists.');
          const productId = current.get('productId') as string;
          const sku = current.get('sku') as string;
          const qrToken = current.get('qrToken') as string;
          const maps = await Promise.all([tx.get(db.doc(`productIds/${productId}`)), tx.get(db.doc(`productSkus/${sku}`)), tx.get(db.doc(`qrLinks/${qrToken}`))]);
          if (!sku || !qrToken || maps.some(s => !s.exists) || maps[0].get('path') !== ref.path || maps[1].get('path') !== ref.path || maps[2].get('productId') !== productId) {
            throw new Error(`Inconsistent product identity: ${ref.path}`);
          }
          return { id: ref.id, productId, sku, qrToken, adminUrl: productAdminUrl(kind, productId) };
        }
        if (!create && !current.exists) throw new Error('Product no longer exists.');
        const payload = create?.payload ?? current.data() ?? {};
        const name = String(payload.name || '');
        const counterRef = db.doc('catalogCounters/products');
        const counter = await tx.get(counterRef);
        const productId = formatProductId(Number(counter.get('value') || 0) + 1);
        const publicRef = db.doc(`productIds/${productId}`);
        const skuRef = db.doc(`productSkus/${random.sku}`);
        const qrRef = db.doc(`qrLinks/${random.qrToken}`);
        const nameRef = db.doc(`catalogNames/${kind}_${nameKey(name)}`);
        const [publicSnap, skuSnap, qrSnap, nameSnap] = await Promise.all([tx.get(publicRef), tx.get(skuRef), tx.get(qrRef), tx.get(nameRef)]);
        if (publicSnap.exists) throw new Error('Product counter is behind assigned IDs. Run the identity audit.');
        if (skuSnap.exists || qrSnap.exists) throw new Error('IDENTITY_COLLISION');
        const existingNamedProduct = create && nameSnap.exists ? await tx.get(db.doc(String(nameSnap.get('path')))) : null;
        if (existingNamedProduct?.exists && nameKey(String(existingNamedProduct.get('name'))) === nameKey(name)) throw new Error('A product with this name already exists.');
        if (create?.payload) {
          // Covers legacy documents before their name locks have been backfilled.
          for (const path of kind === 'part' ? INVENTORY_CATEGORY_SLUGS.map(inventoryItemsPath) : ['prebuiltSystems']) {
            const existing = await tx.get(db.collection(path).select('name'));
            if (existing.docs.some(doc => nameKey(String(doc.get('name'))) === nameKey(name))) throw new Error('A part with this name already exists.');
          }
        }
        let productPayload = payload;
        if (create && kind === 'prebuilt') {
          const resolved = await resolveSystemParts(payload as unknown as PrebuiltSystem, tx);
          if (resolved.some(p => !p.part)) throw new Error('A configured component no longer exists.');
          productPayload = { ...payload, price: Math.round(resolved.reduce((sum, p) => sum + (p.part?.price || 0), 0) * 100) / 100 };
        }
        const identity = { productId, ...random, schemaVersion: 1 };
        const result = { id: ref.id, productId, ...random, adminUrl: productAdminUrl(kind, productId) };
        tx.set(counterRef, { value: Number(counter.get('value') || 0) + 1 });
        if (create) tx.create(ref, { ...productPayload, ...identity, isArchived: false, createdAt: FieldValue.serverTimestamp() });
        else tx.update(ref, identity);
        tx.create(publicRef, { path: ref.path, kind, category });
        tx.create(skuRef, { path: ref.path, productId });
        tx.create(qrRef, { productId, enabled: true });
        if (create || !nameSnap.exists) tx.set(nameRef, { path: ref.path });
        if (operation && create) tx.create(operation, { kind, fingerprint: create.fingerprint, result, createdAt: FieldValue.serverTimestamp() });
        return result;
      });
    } catch (error) {
      if (!(error instanceof Error) || error.message !== 'IDENTITY_COLLISION') throw error;
    }
  }
  throw new Error('Could not allocate a unique identifier. Please retry.');
}
