'use client';
import Link from 'next/link';
import { productAdminUrl, type ProductKind } from '@/lib/product-identity';

export function ProductIdentityLink({ product, kind }: { product: { productId?: string; sku?: string; isArchived?: boolean }; kind: ProductKind }) {
  if (!product.productId) return null;
  return <Link href={productAdminUrl(kind, product.productId, product.isArchived)} onClick={event => event.stopPropagation()} className="flex min-h-11 flex-col justify-center break-all text-xs text-blue-700 hover:underline dark:text-blue-300">
    <span className="font-mono">{product.productId} · {product.sku}</span><span>View item & QR</span>
  </Link>;
}
