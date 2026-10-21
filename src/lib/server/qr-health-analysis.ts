import { PRODUCT_ID_PATTERN, QR_TOKEN_PATTERN, productAdminUrl } from '../product-identity';
import type { QRHealthRecord, QRHealthReport } from '../qr-health';

const skuPattern = /^SKU-(CPU|GPU|MTB|RAM|STG|PSU|CSE|CLR|MNT|KBD|MOU|HDT|PC)[23456789ABCDEFGHJKMNPQRSTVWXYZ]{8}$/;
type Input = { products: QRHealthRecord[]; ids: QRHealthRecord[]; skus: QRHealthRecord[]; links: QRHealthRecord[]; counter: unknown };

/** Pure diagnostics: no repair, allocation or writes. */
export function analyzeQRHealth(input: Input): QRHealthReport {
  const issues: QRHealthReport['issues'] = [];
  const ids = new Map(input.ids.map(row => [row.id, row]));
  const skus = new Map(input.skus.map(row => [row.id, row]));
  const links = new Map(input.links.map(row => [row.id, row]));
  const products = new Map(input.products.map(row => [row.path, row]));
  const counts = new Map<string, number>();
  for (const row of input.products) for (const field of ['productId', 'sku', 'qrToken']) {
    const value = row.data[field];
    if (typeof value === 'string' && value) counts.set(`${field}:${value}`, (counts.get(`${field}:${value}`) || 0) + 1);
  }
  const add = (row: QRHealthRecord, code: string, message: string) => {
    const productId = row.data.productId;
    const kind = row.path.startsWith('prebuiltSystems/') ? 'prebuilt' : 'part';
    const href = products.has(row.path) && typeof productId === 'string' && PRODUCT_ID_PATTERN.test(productId) && counts.get(`productId:${productId}`) === 1
      ? productAdminUrl(kind, productId, row.data.isArchived === true) : null;
    issues.push({ code, message, path: row.path, name: typeof row.data.name === 'string' ? row.data.name : row.id, href });
  };
  let archived = 0, disabled = 0, highest = 0;
  for (const row of input.products) {
    const { productId, sku, qrToken } = row.data;
    if (row.data.isArchived === true) archived++;
    for (const [field, pattern] of [['productId', PRODUCT_ID_PATTERN], ['sku', skuPattern], ['qrToken', QR_TOKEN_PATTERN]] as const) {
      const value = row.data[field];
      if (value === undefined || value === null || value === '') add(row, 'MISSING_IDENTITY', `${field} is missing.`);
      else if (typeof value !== 'string' || !pattern.test(value)) add(row, 'MALFORMED_IDENTITY', `${field} has an invalid format.`);
      else if ((counts.get(`${field}:${value}`) || 0) > 1) add(row, 'DUPLICATE_IDENTITY', `${field} is assigned to more than one product.`);
    }
    const idMap = typeof productId === 'string' ? ids.get(productId)?.data : undefined;
    const skuMap = typeof sku === 'string' ? skus.get(sku)?.data : undefined;
    const qrMap = typeof qrToken === 'string' ? links.get(qrToken)?.data : undefined;
    if (typeof productId === 'string' && PRODUCT_ID_PATTERN.test(productId)) highest = Math.max(highest, Number(productId.slice(4)));
    if (idMap?.path !== row.path || idMap?.kind !== (row.path.startsWith('prebuiltSystems/') ? 'prebuilt' : 'part')) add(row, 'PRODUCT_MAPPING', 'Product directory is missing or points to a different item.');
    if (skuMap?.path !== row.path || skuMap?.productId !== productId) add(row, 'SKU_MAPPING', 'SKU directory is missing or inconsistent.');
    if (!qrMap || qrMap.productId !== productId || typeof qrMap.enabled !== 'boolean') add(row, 'QR_MAPPING', 'QR directory is missing or inconsistent.');
    else if (qrMap.enabled === false) disabled++;
  }
  // Also inspect registry records that no canonical product references.
  for (const [rows, field, pattern] of [[input.ids, 'productId', PRODUCT_ID_PATTERN], [input.skus, 'sku', skuPattern]] as const) {
    for (const row of rows) {
      if (field === 'productId' && pattern.test(row.id)) highest = Math.max(highest, Number(row.id.slice(4)));
      const target = typeof row.data.path === 'string' ? products.get(row.data.path) : undefined;
      if (!pattern.test(row.id)) add(row, 'MALFORMED_MAPPING', 'Registry identifier has an invalid format.');
      if (!target) add(row, 'MISSING_TARGET', 'Registry target no longer exists in the catalog.');
      else if (target.data[field] !== row.id) add(row, 'ORPHAN_MAPPING', 'Registry identifier does not match its target product.');
    }
  }
  for (const row of input.links) {
    const targetPath = typeof row.data.productId === 'string' ? ids.get(row.data.productId)?.data.path : undefined;
    const target = typeof targetPath === 'string' ? products.get(targetPath) : undefined;
    if (!QR_TOKEN_PATTERN.test(row.id) || typeof row.data.enabled !== 'boolean') add(row, 'MALFORMED_MAPPING', 'QR mapping has an invalid token or enabled state.');
    if (!target) add(row, 'MISSING_TARGET', 'QR target no longer exists in the catalog.');
    else if (target.data.qrToken !== row.id) add(row, 'ORPHAN_MAPPING', 'QR token does not match its target product.');
  }
  if (!Number.isSafeInteger(input.counter) || Number(input.counter) < highest || Number(input.counter) < 0) {
    add({ id: 'Product counter', path: 'catalogCounters/products', data: {} }, 'COUNTER', 'Product counter is invalid or behind assigned identifiers.');
  }
  return { completedAt: new Date().toISOString(), products: input.products.length, archived, disabled, issues };
}
