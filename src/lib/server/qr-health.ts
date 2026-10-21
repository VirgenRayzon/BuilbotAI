import type { Firestore, QuerySnapshot } from 'firebase-admin/firestore';
import { inventoryItemsPath, INVENTORY_CATEGORY_SLUGS } from '../inventory-paths';
import type { QRHealthRecord } from '../qr-health';
import { analyzeQRHealth } from './qr-health-analysis';

const MAX_RECORDS = 10000;
const rows = (snapshot: QuerySnapshot): QRHealthRecord[] => snapshot.docs.map(doc => ({ id: doc.id, path: doc.ref.path, data: doc.data() }));

export async function auditQRHealth(db: Firestore) {
  // One consistent, bounded read-only snapshot. Never report partial results as healthy.
  return db.runTransaction(async transaction => {
    const catalogPaths = [...INVENTORY_CATEGORY_SLUGS.map(inventoryItemsPath), 'prebuiltSystems'];
    const catalog = await Promise.all(catalogPaths.map(path => transaction.get(db.collection(path)
      .select('productId', 'sku', 'qrToken', 'name', 'isArchived').limit(MAX_RECORDS + 1))));
    const registries = await Promise.all(['productIds', 'productSkus', 'qrLinks'].map(path => transaction.get(db.collection(path).limit(MAX_RECORDS + 1))));
    const products = catalog.flatMap(rows);
    if (products.length > MAX_RECORDS || registries.some(snapshot => snapshot.size > MAX_RECORDS)) throw new Error('QR audit exceeds the supported catalog size. Run a paginated maintenance audit.');
    const counter = await transaction.get(db.doc('catalogCounters/products'));
    return analyzeQRHealth({ products, ids: rows(registries[0]), skus: rows(registries[1]), links: rows(registries[2]), counter: counter.get('value') ?? 0 });
  }, { readOnly: true });
}
