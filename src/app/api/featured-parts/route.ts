import { NextResponse } from 'next/server';
import { listPublicPartsCatalog } from '@/lib/server/public-products';

export async function GET() {
  try {
    const products = (await listPublicPartsCatalog())
      .filter(product => Number.isFinite(product.price) && product.price > 0)
      .sort((a, b) => b.price - a.price || a.productId.localeCompare(b.productId))
      .slice(0, 12)
      .map(({ productId, name, category, brand, price, imageUrl, inStock }) => ({
        productId, name, category, brand, price, imageUrl, inStock,
      }));

    return NextResponse.json(products, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[featured-parts] Could not load catalog products:', error);
    return NextResponse.json({ error: 'Featured products are unavailable.' }, { status: 503 });
  }
}
