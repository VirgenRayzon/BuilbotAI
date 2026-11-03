import { notFound } from 'next/navigation';
import { getPublicProduct, listPublicPartsCatalog } from '@/lib/server/public-products';
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

  const allParts = await listPublicPartsCatalog();
  const currentCategory = (product.category || '').trim().toLowerCase();
  const relatedParts = allParts.filter(
    (p) =>
      p.productId !== product.productId &&
      (p.category || '').trim().toLowerCase() === currentCategory &&
      p.inStock
  );

  return (
    <PublicPartPage
      product={product}
      isAdminPreview={preview === 'admin'}
      relatedParts={relatedParts}
    />
  );
}
