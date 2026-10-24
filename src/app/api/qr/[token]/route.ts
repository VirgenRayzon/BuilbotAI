import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminFirestore } from '@/firebase/server-init';
import { productReference } from '@/lib/server/public-products';
import { productAdminUrl, productStockAdminUrl, productUrl, PRODUCT_ID_PATTERN, QR_TOKEN_PATTERN } from '@/lib/product-identity';
import { qrIdentity } from '@/lib/server/qr-auth';
import { qrFailure, QRRequestError, QR_RESPONSE_HEADERS } from '@/lib/qr-response';

export const dynamic = 'force-dynamic';
const mappingSchema = z.object({ productId: z.string().regex(PRODUCT_ID_PATTERN), enabled: z.boolean() });

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    if (!QR_TOKEN_PATTERN.test(token)) throw new QRRequestError('INVALID_QR', 'QR code not found.', 404);
    const { staff } = await qrIdentity(request.headers.get('authorization'));
    const snapshot = await getAdminFirestore().doc(`qrLinks/${token}`).get();
    if (!snapshot.exists) throw new QRRequestError('UNAVAILABLE', 'This QR code is unavailable.', 404);
    const mapping = mappingSchema.parse(snapshot.data());
    if (!mapping.enabled) throw new QRRequestError('UNAVAILABLE', 'This QR code is unavailable.', 404);
    const target = await productReference(mapping.productId);
    if (!target) throw new QRRequestError('UNAVAILABLE', 'Product not found.', 404);
    const product = await target.ref.get();
    if (!product.exists) throw new QRRequestError('UNAVAILABLE', 'Product no longer available.', 404);
    if (product.get('productId') !== mapping.productId || product.get('qrToken') !== token) throw new Error('Inconsistent QR mapping');
    if (product.get('isArchived') && !staff) throw new QRRequestError('UNAVAILABLE', 'This product is no longer available.', 410);
    const isArchived = Boolean(product.get('isArchived'));
    const staffDestination = target.kind === 'part' && !isArchived
      ? productStockAdminUrl(mapping.productId)
      : productAdminUrl(target.kind, mapping.productId, isArchived);
    return NextResponse.json({ destination: staff ? staffDestination : productUrl(target.kind, mapping.productId) }, { headers: QR_RESPONSE_HEADERS });
  } catch (error) { return qrFailure(error); }
}
