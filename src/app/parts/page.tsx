import { listPublicPartsCatalog } from '@/lib/server/public-products';
import { PublicPartsCatalog } from '@/components/public-parts-catalog';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'PC parts & accessories | BuildbotAI' };
export default async function PartsPage() {
  return <PublicPartsCatalog products={await listPublicPartsCatalog()} />;
}
