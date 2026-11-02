import { NextResponse } from 'next/server';
import { listPublicPartsCatalog } from '@/lib/server/public-products';
import type { Part } from '@/lib/types';

const ACCESSORY_CATEGORIES = ['Monitor', 'Keyboard', 'Mouse', 'Headset'] as const satisfies readonly Part['category'][];

export async function GET() {
  try {
    const products = await listPublicPartsCatalog();
    const accessories = ACCESSORY_CATEGORIES.flatMap(category => products
      .filter(product => product.category === category && Number.isFinite(product.price) && product.price > 0)
      .sort((a, b) => Number(b.inStock) - Number(a.inStock) || b.price - a.price || a.productId.localeCompare(b.productId))
      .slice(0, 3)
      .map(({ productId, name, brand, price, imageUrl, inStock }) => ({ productId, name, category, brand, price, imageUrl, inStock }))
    );
    return NextResponse.json(accessories, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[featured-accessories] Could not load catalog accessories:', error);
    return NextResponse.json({ error: 'Accessories are unavailable.' }, { status: 503 });
  }
}
