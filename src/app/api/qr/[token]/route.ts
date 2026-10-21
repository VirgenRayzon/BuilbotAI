import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/server-init';
import { productReference } from '@/lib/server/public-products';
import { productAdminUrl, productUrl, QR_TOKEN_PATTERN } from '@/lib/product-identity';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!QR_TOKEN_PATTERN.test(token)) return NextResponse.json({ error: 'QR code not found.' }, { status: 404 });
  const db = getAdminFirestore();
  const mapping = (await db.doc(`qrLinks/${token}`).get()).data();
  if (!mapping?.enabled) return NextResponse.json({ error: 'This QR code is unavailable.' }, { status: 404 });
  const target = await productReference(mapping.productId);
  if (!target) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  let staff = false;
  const bearer = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (bearer) {
    try {
      const user = await getAdminAuth().verifyIdToken(bearer, true);
      const profile = (await db.doc(`users/${user.uid}`).get()).data();
      staff = Boolean((user.isManager && profile?.isManager) || (user.isSuperAdmin && profile?.isSuperAdmin));
    } catch { return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 }); }
  }
  const product = await target.ref.get();
  if (!product.exists) return NextResponse.json({ error: 'Product no longer available.' }, { status: 404 });
  if (product.get('isArchived') && !staff) return NextResponse.json({ error: 'This product is no longer available.' }, { status: 410 });
  return NextResponse.json({ destination: staff ? productAdminUrl(target.kind, mapping.productId, Boolean(product.get('isArchived'))) : productUrl(target.kind, mapping.productId) }, { headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } });
}
