/** Read-only cloud audit. Optional local snapshots verify every original catalog field. */
import 'dotenv/config';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { DocumentReference } from 'firebase-admin/firestore';
import { getAdminFirestore } from '../src/firebase/server-init';
import { inventoryItemsPath, INVENTORY_CATEGORY_SLUGS } from '../src/lib/inventory-paths';
import { PRODUCT_ID_PATTERN, QR_TOKEN_PATTERN } from '../src/lib/product-identity';
import { auditQRHealth } from '../src/lib/server/qr-health';

function originalContentHash(data: Record<string, unknown>): string {
  const original = { ...data };
  for (const key of ['productId', 'sku', 'qrToken', 'schemaVersion']) delete original[key];
  const encoded = JSON.stringify(original, (_key: string, value: unknown) => {
    if (value instanceof DocumentReference) return { referencePath: value.path };
    if (value && typeof value === 'object' && !Array.isArray(value)) return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
    return value;
  });
  return createHash('sha256').update(encoded).digest('hex');
}

async function main() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId || !process.argv.includes(`--project=${projectId}`)) throw new Error('Pass --project=<active project> to audit the intended database.');
  const snapshotFile = process.argv.find(a => a.startsWith('--snapshot='))?.slice(11);
  const beforeFile = process.argv.find(a => a.startsWith('--before='))?.slice(9);
  const db = getAdminFirestore();
  const reportFile = process.argv.find(arg => arg.startsWith('--report='))?.slice(9);
  if (reportFile) {
    const report = await auditQRHealth(db);
    await mkdir(dirname(reportFile), { recursive: true });
    await writeFile(reportFile, JSON.stringify({ projectId, ...report }, null, 2));
    console.log(JSON.stringify({ projectId, products: report.products, issues: report.issues.length, archived: report.archived, disabled: report.disabled, completedAt: report.completedAt, report: reportFile }));
    if (report.issues.length) process.exitCode = 1;
    if (!snapshotFile && !beforeFile) return;
  }
  const groups = await Promise.all([...INVENTORY_CATEGORY_SLUGS.map(inventoryItemsPath), 'prebuiltSystems'].map(path => db.collection(path).get()));
  const documents = groups.flatMap(g => g.docs);
  const hashes: Record<string, string> = {};
  const ids = new Set<string>(), skus = new Set<string>(), tokens = new Set<string>();
  const mappings: { path: string; productId: string; sku: string; token: string }[] = [];
  let unassigned = 0;
  for (const doc of documents) {
    hashes[doc.ref.path] = originalContentHash(doc.data());
    const productId = doc.get('productId'), sku = doc.get('sku'), token = doc.get('qrToken');
    if (!productId && !sku && !token) { unassigned++; if (snapshotFile) continue; throw new Error(`Missing identity at ${doc.ref.path}`); }
    if (!PRODUCT_ID_PATTERN.test(String(productId)) || !QR_TOKEN_PATTERN.test(String(token)) || !/^SKU-(CPU|GPU|MTB|RAM|STG|PSU|CSE|CLR|MNT|KBD|MOU|HDT|PC)[23456789ABCDEFGHJKMNPQRSTVWXYZ]{8}$/.test(String(sku))) throw new Error(`Invalid identity at ${doc.ref.path}`);
    if (ids.has(productId) || skus.has(sku) || tokens.has(token)) throw new Error('Duplicate catalog identity.');
    ids.add(productId); skus.add(sku); tokens.add(token);
    mappings.push({ path: doc.ref.path, productId, sku, token });
  }
  const refs = mappings.flatMap(m => [db.doc(`productIds/${m.productId}`), db.doc(`productSkus/${m.sku}`), db.doc(`qrLinks/${m.token}`)]);
  const registry = new Map<string, Record<string, unknown>>();
  for (let index = 0; index < refs.length; index += 200) {
    for (const doc of await db.getAll(...refs.slice(index, index + 200))) registry.set(doc.ref.path, doc.data() || {});
  }
  for (const mapping of mappings) {
    if (registry.get(`productIds/${mapping.productId}`)?.path !== mapping.path || registry.get(`productSkus/${mapping.sku}`)?.path !== mapping.path || registry.get(`qrLinks/${mapping.token}`)?.productId !== mapping.productId) throw new Error(`Broken identity mapping at ${mapping.path}`);
  }
  if (beforeFile) {
    const before = JSON.parse((await readFile(beforeFile, 'utf8')).replace(/^\uFEFF/, '')) as { projectId: string; hashes: Record<string, string> };
    if (before.projectId !== projectId || Object.keys(before.hashes).length !== documents.length) throw new Error('Before/after catalog project or count changed. Review concurrent catalog activity.');
    const changes = Object.entries(before.hashes).filter(([path, hash]) => hashes[path] !== hash).map(([path]) => path);
    if (changes.length) throw new Error(`Original catalog fields changed; review concurrent activity: ${changes.join(', ')}`);
  }
  if (snapshotFile) {
    await mkdir(dirname(snapshotFile), { recursive: true });
    await writeFile(snapshotFile, JSON.stringify({ projectId, hashes, capturedAt: new Date().toISOString() }, null, 2));
  }
  const counter = (await db.doc('catalogCounters/products').get()).get('value') || 0;
  if (Math.max(0, ...[...ids].map(id => Number(id.slice(4)))) > counter) throw new Error('Counter is behind assigned public IDs.');
  console.log(JSON.stringify({ projectId, parts: documents.filter(d => d.ref.path.startsWith('inventory/')).length, prebuilts: documents.filter(d => d.ref.path.startsWith('prebuiltSystems/')).length, assigned: ids.size, unassigned, counter, originalFieldsUnchanged: beforeFile ? true : undefined, snapshot: snapshotFile }, null, 2));
}
main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
