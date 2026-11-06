import { notFound } from 'next/navigation';
import { getPublicProduct, listRelatedPublicParts } from '@/lib/server/public-products';
import { PublicPartPage } from '@/components/public-part-page';

export const dynamic = 'force-dynamic';

export default async function PartPage({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { productId } = await params;
  const { preview } = await searchParams;
  const product = await getPublicProduct(productId, 'part');
  if (!product) notFound();

  const relatedParts = await listRelatedPublicParts(product.category, product.productId);

  return (
    <PublicPartPage
      product={product}
      isAdminPreview={preview === 'admin'}
      relatedParts={relatedParts}
    />
  );
}
