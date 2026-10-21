import { notFound } from 'next/navigation';
import LegacyPrebuiltProductPage from './legacy-prebuilt-product';
import { PRODUCT_ID_PATTERN } from '@/lib/product-identity';
import { productReference } from '@/lib/server/public-products';
export const dynamic = 'force-dynamic';
export default async function PrebuiltPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[\w-]{1,128}$/.test(id)) notFound();

  if (PRODUCT_ID_PATTERN.test(id)) {
    const target = await productReference(id, 'prebuilt');
    if (!target) notFound();
    return <LegacyPrebuiltProductPage params={Promise.resolve({ id: target.ref.id })}/>;
  }

  return <LegacyPrebuiltProductPage params={Promise.resolve({ id })}/>;
}
