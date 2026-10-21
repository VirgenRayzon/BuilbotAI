import type { Part } from './types';

export const SKU_CATEGORY_CODES = {
  CPU: 'CPU', GPU: 'GPU', Motherboard: 'MTB', RAM: 'RAM', Storage: 'STG',
  PSU: 'PSU', Case: 'CSE', Cooler: 'CLR', Monitor: 'MNT', Keyboard: 'KBD',
  Mouse: 'MOU', Headset: 'HDT',
} as const satisfies Record<Part['category'], string>;
export type ProductKind = 'part' | 'prebuilt';
export type ProductIdentity = { productId: string; sku: string; qrToken: string };
export type CreatedProduct = ProductIdentity & { id: string; adminUrl: string };
export const SKU_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
export const PRODUCT_ID_PATTERN = /^PRD-\d{6,}$/;
export const QR_TOKEN_PATTERN = /^[a-f0-9]{32}$/;
export const DEFAULT_QR_ORIGIN = 'https://buildbotai--studio-3150054754-c7d0b.us-central1.hosted.app';

export function formatProductId(sequence: number): string {
  if (!Number.isSafeInteger(sequence) || sequence < 1) throw new Error('Invalid product sequence.');
  return `PRD-${String(sequence).padStart(6, '0')}`;
}
export function skuPrefix(category: string): string {
  const code = category === 'PC' ? 'PC' : SKU_CATEGORY_CODES[category as Part['category']];
  if (!code) throw new Error('Unknown SKU category.');
  return `SKU-${code}`;
}
export function productUrl(kind: ProductKind, productId: string): string {
  if (!PRODUCT_ID_PATTERN.test(productId)) throw new Error('Invalid product ID.');
  return `/${kind === 'part' ? 'parts' : 'pre-builts'}/${productId}`;
}
export function productAdminUrl(kind: ProductKind, productId: string, archived = false): string {
  return `/admin?tab=${archived ? 'archive' : kind === 'part' ? 'stock' : 'prebuilts'}&product=${encodeURIComponent(productId)}`;
}
export function qrUrl(token: string, origin = DEFAULT_QR_ORIGIN): string {
  if (!QR_TOKEN_PATTERN.test(token)) throw new Error('Invalid QR token.');
  const parsed = new URL(origin);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error('QR origin must be an HTTPS origin without a path.');
  }
  return `${parsed.origin}/q/${token}`;
}

export function safeProductReturn(value: string | null): string {
  return value && (/^\/(parts|pre-builts)\/PRD-\d{6,}$/.test(value) || /^\/q\/[a-f0-9]{32}$/.test(value)) ? value : '/builder';
}

export function safeStaffProductReturn(value: string | null): string {
  return value && (/^\/admin\?tab=(stock|prebuilts|archive)&product=PRD-\d{6,}$/.test(value) || /^\/q\/[a-f0-9]{32}$/.test(value)) ? value : '/admin';
}
