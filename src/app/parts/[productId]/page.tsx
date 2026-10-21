import { notFound } from 'next/navigation';
import { getPublicProduct } from '@/lib/server/public-products';
import { PublicPartPage } from '@/components/public-part-page';
export const dynamic = 'force-dynamic';
export default async function PartPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const product = await getPublicProduct(productId, 'part');
  if (!product) notFound();
  return <PublicPartPage product={product}/>;
}
