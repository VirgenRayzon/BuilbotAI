import { listPublicPartsCatalog } from '@/lib/server/public-products';
import { PublicPartsCatalog } from '@/components/public-parts-catalog';
import { listPublicCatalogPage } from '@/lib/server/public-catalog-queries';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'PC parts & accessories | BuildbotAI' };
export default async function PartsPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;
  if (process.env.NEXT_PUBLIC_PUBLIC_CATALOG_INDEXED_ENABLED === 'true') {
    const initialPage = await listPublicCatalogPage();
    return <PublicPartsCatalog products={initialPage.products} initialPage={initialPage} isAdminPreview={preview === 'admin'} />;
  }
  return <PublicPartsCatalog products={await listPublicPartsCatalog()} isAdminPreview={preview === 'admin'} />;
}
