'use server';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminFirestore } from '@/firebase/server-init';
import { invalidatePublicPartsCatalog, productReference, resolveSystemParts } from '@/lib/server/public-products';
import { getMissingParts } from '@/lib/prebuilt-utils';
import { inventoryItemPath, inventoryCategoryLabel } from '@/lib/inventory-paths';
import type { FavoriteBuild, OrderItem, Part, PrebuiltSystem } from '@/lib/types';

const requestSchema = z.object({ productId: z.string().regex(/^PRD-\d{6,}$/), idToken: z.string().min(1), operationId: z.string().uuid(), expectedPrice: z.number().finite().nonnegative().optional() });

export async function reservePublicProduct(input: unknown) {
  const request = requestSchema.parse(input);
  const user = await getAdminAuth().verifyIdToken(request.idToken, true);
  const db = getAdminFirestore();
  const profile = (await db.doc(`users/${user.uid}`).get()).data();
  if (!profile || profile.isManager || profile.isSuperAdmin || user.isManager || user.isSuperAdmin) throw new Error('Sign in with a customer account to reserve.');
  const target = await productReference(request.productId);
  if (!target) throw new Error('Product not found.');
  const orderRef = db.collection('orders').doc();
  const operationRef = db.doc(`reservationOperations/${user.uid}_${request.operationId}`);
  const result = await db.runTransaction(async tx => {
    const previous = await tx.get(operationRef);
    if (previous.exists) {
      if (previous.get('productId') !== request.productId) throw new Error('Reservation request does not match.');
      return { orderId: previous.get('orderId') as string };
    }
    const snap = await tx.get(target.ref);
    if (!snap.exists || snap.get('isArchived')) throw new Error('Product is unavailable.');
    const data = snap.data() as Part & PrebuiltSystem;
    if (target.kind === 'prebuilt' && getMissingParts(data).length) throw new Error('This system has missing components.');
    const resolved = target.kind === 'prebuilt' ? await resolveSystemParts(data, tx) : [];
    if (resolved.some(p => !p.part)) throw new Error('A configured component no longer exists.');
    const selections = target.kind === 'part' ? [{ category: data.category, partId: snap.id }] : resolved.map(p => ({ category: p.category, partId: p.partId }));
    const grouped = new Map<string, { category: string; id: string; quantity: number }>();
    const items: OrderItem[] = [];
    for (const item of selections) {
      if (item.partId === 'included-stock-cooler') { items.push({ id: item.partId, category: 'Cooler', name: 'Included stock cooler', price: 0 }); continue; }
      const path = inventoryItemPath(item.category, item.partId);
      const previousItem = grouped.get(path);
      grouped.set(path, { category: inventoryCategoryLabel(item.category), id: item.partId, quantity: (previousItem?.quantity || 0) + 1 });
    }
    const stocks = await Promise.all([...grouped].map(async ([path, line]) => ({ ref: db.doc(path), line, snap: await tx.get(db.doc(path)) })));
    for (const { line, snap: stock } of stocks) {
      const available = Number(stock.get('stock'));
      if (!stock.exists || stock.get('isArchived') || !Number.isSafeInteger(available) || available < line.quantity) throw new Error('A component no longer has enough stock.');
      for (let i = 0; i < line.quantity; i++) items.push({ id: line.id, category: line.category, name: String(stock.get('name')), price: Number(stock.get('price')) });
    }
    const totalPrice = Math.round(items.reduce((sum, item) => sum + item.price, 0) * 100) / 100;
    if (!Number.isFinite(totalPrice)) throw new Error('Invalid product pricing. Contact the store.');
    if (request.expectedPrice !== undefined && Math.abs(request.expectedPrice - totalPrice) > 0.005) throw new Error('Pricing has changed. Refresh the page before reserving.');
    for (const { ref, line } of stocks) tx.update(ref, { stock: FieldValue.increment(-line.quantity), popularity: FieldValue.increment(line.quantity) });
    const createdAt = FieldValue.serverTimestamp();
    tx.create(orderRef, { userId: user.uid, userEmail: user.email || profile.email, items, totalPrice, status: 'pending',
      type: target.kind === 'prebuilt' ? 'prebuilt' : 'custom', createdAt,
      ...(target.kind === 'prebuilt' ? { prebuiltId: snap.id, prebuiltName: data.name, prebuiltTier: data.tier } : {}),
    });
    tx.create(operationRef, { productId: request.productId, orderId: orderRef.id, createdAt });
    tx.create(db.collection(`users/${user.uid}/notifications`).doc(), { userId: user.uid, orderId: orderRef.id, title: 'Reservation received', message: `Your reservation for ${data.name} has been received.`, read: false, createdAt });
    tx.create(db.collection('system_notifications').doc(), { type: 'reservation_received', actorId: user.uid, actorName: String(profile.name || user.email || 'Customer'), title: 'New reservation', message: `Reservation received for ${data.name}.`, targetId: orderRef.id, readBy: [], createdAt });
    tx.create(db.collection('user_auditLogs').doc(), { userId: user.uid, userEmail: user.email || '', actionName: 'created', scope: 'Order', resourceId: orderRef.id, resourceName: data.name, details: 'Reserved from product page', createdAt });
    return { orderId: orderRef.id };
  });
  invalidatePublicPartsCatalog();
  return result;
}

export async function customizePublicProduct(productId: string, idToken: string): Promise<FavoriteBuild> {
  const user = await getAdminAuth().verifyIdToken(idToken, true);
  if (user.isManager || user.isSuperAdmin) throw new Error('Use the admin prebuilt builder.');
  const target = await productReference(productId, 'prebuilt');
  const snap = target ? await target.ref.get() : null;
  if (!snap?.exists || snap.get('isArchived')) throw new Error('System is unavailable.');
  const system = { ...snap.data(), id: snap.id } as PrebuiltSystem;
  const resolved = await resolveSystemParts(system);
  return { id: productId, name: `${system.name} (Customized)`, totalPrice: system.price, source: 'builder', createdAt: new Date().toISOString(),
    parts: resolved.map(p => ({ category: inventoryCategoryLabel(p.category), partId: p.partId, name: p.part?.name || p.category, price: p.part?.price || 0 })),
    loadContext: { type: 'prebuilt', systemName: system.name, unavailableParts: resolved.filter(p => !p.part || p.part.isArchived || p.part.stock <= 0).map(p => p.part?.name || p.category) },
  };
}

export async function submitProductReservation(input: unknown) {
  try { return { success: true as const, ...await reservePublicProduct(input) }; }
  catch (error) { return { success: false as const, error: error instanceof Error ? error.message : 'Could not reserve this product. Please retry.' }; }
}
