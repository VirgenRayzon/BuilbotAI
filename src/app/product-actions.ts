'use server';

import { getAdminAuth, getAdminFirestore } from '@/firebase/server-init';
import { createProductSchema } from '@/lib/product-schemas';
import { assignProductIdentity } from '@/lib/server/product-identities';
import { inventoryItemsPath } from '@/lib/inventory-paths';
import { inventoryItemPath } from '@/lib/inventory-paths';
import { partProductSchema } from '@/lib/product-schemas';
import { nameKey } from '@/lib/server/product-identities';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { invalidatePublicPartsCatalog } from '@/lib/server/public-products';

async function requireStaff(idToken: string) {
  const decoded = await getAdminAuth().verifyIdToken(idToken, true);
  const db = getAdminFirestore();
  const profile = (await db.doc(`users/${decoded.uid}`).get()).data();
  if (!((decoded.isSuperAdmin && profile?.isSuperAdmin) || (decoded.isManager && profile?.isManager))) throw new Error('Only authorized inventory staff can manage products.');
  return { db, decoded };
}

export async function createCatalogProduct(input: unknown) {
  const parsed = createProductSchema.parse(input);
  const { db, decoded } = await requireStaff(parsed.idToken);
  const collection = parsed.kind === 'part' ? inventoryItemsPath(parsed.payload.category) : 'prebuiltSystems';
  const category = parsed.kind === 'part' ? parsed.payload.category : 'PC';
  const payload: Record<string, unknown> = JSON.parse(JSON.stringify(parsed.payload));
  // Bind retry keys to server-validated business fields as well as the source
  // form hash. Uploaded URLs can change when the same source image is retried.
  const logicalPayload = { ...payload };
  delete logicalPayload.imageUrl;
  delete logicalPayload.images;
  const fingerprint = createHash('sha256').update(JSON.stringify({ kind: parsed.kind, source: parsed.fingerprint, payload: logicalPayload })).digest('hex');
  const result = await assignProductIdentity(db, db.collection(collection).doc(), parsed.kind, category, {
    payload, uid: decoded.uid, operationId: parsed.operationId, fingerprint,
  });
  if (parsed.kind === 'part') invalidatePublicPartsCatalog();
  return result;
}

/** Return expected form errors explicitly; Next hides thrown server errors in production. */
export async function submitCatalogProduct(input: unknown) {
  try { return { success: true as const, product: await createCatalogProduct(input) }; }
  catch (error) {
    const message = error instanceof z.ZodError ? `${error.issues[0]?.path.join('.')}: ${error.issues[0]?.message}`
      : error instanceof Error ? error.message : 'Could not save this product. Please retry.';
    return { success: false as const, error: message };
  }
}

export async function updateCatalogPart(input: unknown) {
  const request = z.object({ idToken: z.string().min(1), id: z.string().regex(/^[\w-]+$/),
    category: partProductSchema.shape.category, payload: partProductSchema.partial(),
  }).parse(input);
  const { db } = await requireStaff(request.idToken);
  const oldRef = db.doc(inventoryItemPath(request.category, request.id));
  const category = request.payload.category || request.category;
  const target = db.doc(inventoryItemPath(category, request.id));
  await db.runTransaction(async tx => {
    const source = await tx.get(oldRef);
    if (!source.exists) throw new Error('Part no longer exists.');
    const destination = target.path !== oldRef.path ? await tx.get(target) : null;
    if (destination?.exists) throw new Error('Another part already exists at the target location.');
    const oldName = String(source.get('name'));
    const name = request.payload.name ?? oldName;
    const nameRef = db.doc(`catalogNames/part_${nameKey(name)}`);
    const nameSnap = await tx.get(nameRef);
    const oldNameRef = db.doc(`catalogNames/part_${nameKey(oldName)}`);
    const oldNameSnap = oldNameRef.path !== nameRef.path ? await tx.get(oldNameRef) : null;
    if (nameSnap.exists && nameSnap.get('path') !== oldRef.path) throw new Error('A part with this name already exists.');
    const productId = source.get('productId');
    const sku = source.get('sku');
    const identityMap = productId ? await tx.get(db.doc(`productIds/${productId}`)) : null;
    const skuMap = sku ? await tx.get(db.doc(`productSkus/${sku}`)) : null;
    if ((identityMap?.exists && identityMap.get('path') !== oldRef.path) || (skuMap?.exists && skuMap.get('path') !== oldRef.path)) throw new Error('Identity mapping is inconsistent.');
    const payload = JSON.parse(JSON.stringify(request.payload));
    if (target.path === oldRef.path) tx.update(oldRef, payload);
    else {
      tx.create(target, { ...source.data(), ...payload, category });
      tx.delete(oldRef);
      if (productId) tx.set(db.doc(`productIds/${productId}`), { path: target.path, kind: 'part', category }, { merge: true });
      if (sku) tx.set(db.doc(`productSkus/${sku}`), { path: target.path, productId }, { merge: true });
    }
    if (oldNameSnap?.exists && oldNameSnap.get('path') === oldRef.path) tx.delete(oldNameRef);
    tx.set(nameRef, { path: target.path });
  });
  invalidatePublicPartsCatalog();
}
