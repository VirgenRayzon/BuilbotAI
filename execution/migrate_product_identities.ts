/** Dry-run by default. Requires a fresh completed managed export before --apply. */
import 'dotenv/config';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { QuerySnapshot } from 'firebase-admin/firestore';
import { getAdminFirestore } from '../src/firebase/server-init';
import { INVENTORY_CATEGORY_SLUGS, inventoryItemsPath, inventoryCategoryLabel } from '../src/lib/inventory-paths';
import { assignProductIdentity } from '../src/lib/server/product-identities';
import { formatProductId, PRODUCT_ID_PATTERN, QR_TOKEN_PATTERN, skuPrefix, type ProductKind } from '../src/lib/product-identity';

async function main() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId || !process.argv.includes(`--project=${projectId}`)) throw new Error('Pass --project=<active project> to verify the intended database.');
  const apply = process.argv.includes('--apply');
  const db = getAdminFirestore();
  const output = process.argv.find(arg => arg.startsWith('--manifest='))?.slice(11) || '.tmp/qr-migration.json';
  if (apply) {
    const backupFile = process.argv.find(arg => arg.startsWith('--backup='))?.slice(9);
    if (!backupFile) throw new Error('--apply requires --backup=<completed managed backup manifest>.');
    const backup = JSON.parse((await readFile(backupFile, 'utf8')).replace(/^\uFEFF/, ''));
    const age = Date.now() - Date.parse(backup.completedAt);
    if (backup.projectId !== projectId || backup.completed !== true || backup.private !== true || !String(backup.backupUri).startsWith(`gs://${projectId}-private-backups/backups/`) || !Number.isFinite(age) || age < 0 || age > 86400000) throw new Error('Backup must be private, completed, match the project and be less than 24 hours old.');
  }
  const groups: { category: string; kind: ProductKind; snapshot: QuerySnapshot }[] = await Promise.all(INVENTORY_CATEGORY_SLUGS.map(async slug => ({ category: inventoryCategoryLabel(slug), kind: 'part', snapshot: await db.collection(inventoryItemsPath(slug)).get() })));
  groups.push({ category: 'PC', kind: 'prebuilt', snapshot: await db.collection('prebuiltSystems').get() });
  const records = groups.flatMap(group => group.snapshot.docs.map(doc => ({ doc, category: group.category, kind: group.kind }))).sort((a, b) => a.doc.ref.path.localeCompare(b.doc.ref.path));
  const usedIds = new Set<string>();
  const usedSkus = new Set<string>();
  const usedTokens = new Set<string>();
  const counter = Number((await db.doc('catalogCounters/products').get()).get('value') || 0);
  const registeredIds = await db.collection('productIds').select().get();
  let highest = 0;
  for (const { doc, category } of records) {
    const fields = [doc.get('productId'), doc.get('sku'), doc.get('qrToken')];
    if (fields.some(Boolean) && !fields.every(Boolean)) throw new Error(`Partial identity requires manual review: ${doc.ref.path}`);
    if (!fields[0]) continue;
    const [productId, sku, token] = fields.map(String);
    const suffix = sku.slice(sku.lastIndexOf('-') + 1);
    if (!PRODUCT_ID_PATTERN.test(productId) || !QR_TOKEN_PATTERN.test(token) || !/^SKU-(CPU|GPU|MTB|RAM|STG|PSU|CSE|CLR|MNT|KBD|MOU|HDT|PC)[23456789ABCDEFGHJKMNPQRSTVWXYZ]{8}$/.test(sku) || !suffix) throw new Error(`Invalid identity: ${doc.ref.path}`);
    if (usedIds.has(productId) || usedSkus.has(sku) || usedTokens.has(token)) throw new Error(`Duplicate identity: ${doc.ref.path}`);
    usedIds.add(productId); usedSkus.add(sku); usedTokens.add(token);
    highest = Math.max(highest, Number(productId.slice(4)));
    // Audit uses reads only. The mutating helper is called only in the --apply branch below.
    const [publicMap, skuMap, qrMap] = await Promise.all([
      db.doc(`productIds/${productId}`).get(), db.doc(`productSkus/${sku}`).get(), db.doc(`qrLinks/${token}`).get(),
    ]);
    if (publicMap.get('path') !== doc.ref.path || skuMap.get('path') !== doc.ref.path || qrMap.get('productId') !== productId) throw new Error(`Identity mappings require review: ${doc.ref.path}`);
  }
  for (const registered of registeredIds.docs) {
    if (!PRODUCT_ID_PATTERN.test(registered.id)) throw new Error('Invalid product-ID registry document.');
    highest = Math.max(highest, Number(registered.id.slice(4)));
  }
  if (!Number.isSafeInteger(counter) || counter < highest) throw new Error('Product counter is behind existing IDs; reconcile before applying.');
  const manifest: { path: string; before: Record<string, unknown>; productId?: string; sku?: string; qrToken?: string; proposedId?: string; skuPrefix: string }[] = [];
  let proposed = counter;
  await mkdir(dirname(output), { recursive: true });
  for (const { doc, kind, category } of records) {
    const row = { path: doc.ref.path, before: { productId: doc.get('productId') || null, sku: doc.get('sku') || null, qrToken: doc.get('qrToken') || null, stock: doc.get('stock') ?? null, updateTime: doc.updateTime.toDate().toISOString() }, skuPrefix: skuPrefix(category) };
    if (apply) {
      const identity = await assignProductIdentity(db, doc.ref, kind, category);
      manifest.push({ ...row, productId: identity.productId, sku: identity.sku, qrToken: identity.qrToken });
      await writeFile(output, JSON.stringify({ projectId, apply, records: manifest }, null, 2));
      if (manifest.length % 25 === 0) console.log(`Verified identities: ${manifest.length}/${records.length}`);
    } else manifest.push({ ...row, proposedId: doc.get('productId') || formatProductId(++proposed) });
  }
  await writeFile(output, JSON.stringify({ projectId, apply, records: manifest }, null, 2));
  console.log(JSON.stringify({ projectId, mode: apply ? 'apply' : 'dry-run', total: records.length, assigned: apply ? records.length : usedIds.size, pending: apply ? 0 : records.length - usedIds.size, manifest: output }, null, 2));
}
main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
