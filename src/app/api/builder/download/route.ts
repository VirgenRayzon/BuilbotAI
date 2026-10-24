import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminAuth, getAdminFirestore, getAdminStorage } from '@/firebase/server-init';
import { inventoryItemPath } from '@/lib/inventory-paths';
import { BUILD_PDF_CATEGORIES, BUILD_PDF_REQUIRED } from '@/lib/build-pdf-categories';
import { createBuildPdf, type BuildPdfPart } from '@/lib/build-pdf';

export const runtime = 'nodejs';

const requestSchema = z.object({
  parts: z.array(z.object({
    category: z.enum(BUILD_PDF_CATEGORIES),
    id: z.string().min(1).max(128).regex(/^[^/]+$/),
  })).min(8).max(40),
});

async function getCoverImage(url: string): Promise<Uint8Array> {
  if (url === '/placeholders/components/cooler.jpg') {
    return readFile(path.join(process.cwd(), 'public', 'placeholders', 'components', 'cooler.jpg'));
  }

  const parsed = new URL(url);
  const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const allowedBuckets = new Set([`${project}.firebasestorage.app`, `${project}.appspot.com`]);
  let bucket: string;
  let objectPath: string;
  if (parsed.protocol === 'https:' && parsed.hostname === 'firebasestorage.googleapis.com') {
    const match = parsed.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
    if (!match) throw new Error('Unsupported cover image URL.');
    bucket = match[1];
    objectPath = decodeURIComponent(match[2]);
  } else if (parsed.protocol === 'https:' && parsed.hostname === 'storage.googleapis.com') {
    const match = parsed.pathname.match(/^\/([^/]+)\/(.+)$/);
    if (!match) throw new Error('Unsupported cover image URL.');
    bucket = match[1];
    objectPath = decodeURIComponent(match[2]);
  } else {
    throw new Error('The catalog cover image must be stored in Buildbot AI Storage.');
  }
  if (!project || !allowedBuckets.has(bucket) || !objectPath.startsWith('parts/')) {
    throw new Error('Cover image is outside the product image library.');
  }
  const file = getAdminStorage().bucket(bucket).file(objectPath);
  const [metadata] = await file.getMetadata();
  if (Number(metadata.size) > 5 * 1024 * 1024) throw new Error('Cover image exceeds 5 MB.');
  const [bytes] = await file.download();
  if (!bytes.length || bytes.length > 5 * 1024 * 1024) throw new Error('Cover image is invalid.');
  return bytes;
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
    if (!token) return NextResponse.json({ error: 'Sign in to download your build.' }, { status: 401 });
    const decoded = await getAdminAuth().verifyIdToken(token);
    const profile = await getAdminFirestore().collection('users').doc(decoded.uid).get();
    const user = profile.data();
    const profileRole = typeof user?.role === 'string' ? user.role.toLowerCase() : '';
    if (!user || decoded.isManager === true || decoded.isSuperAdmin === true || decoded.isAdmin === true ||
      user.isManager === true || user.isSuperAdmin === true || user.isAdmin === true ||
      ['manager', 'superadmin', 'super_admin', 'admin'].includes(profileRole)) {
      return NextResponse.json({ error: 'This download is available to customer accounts only.' }, { status: 403 });
    }

    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid build selection.' }, { status: 400 });
    const selected = parsed.data.parts;
    if (BUILD_PDF_REQUIRED.some(category => !selected.some(part => part.category === category))) {
      return NextResponse.json({ error: 'Select all eight core parts before downloading your build.' }, { status: 400 });
    }
    const singletonCategories = BUILD_PDF_CATEGORIES.filter(category => category !== 'RAM' && category !== 'Storage');
    if (singletonCategories.some(category => selected.filter(part => part.category === category).length > 1)) {
      return NextResponse.json({ error: 'Invalid build selection.' }, { status: 400 });
    }

    const cpuSelection = selected.find(part => part.category === 'CPU');
    const cpuSnapshot = cpuSelection ? await getAdminFirestore().doc(inventoryItemPath('CPU', cpuSelection.id)).get() : null;
    const cpuData = cpuSnapshot?.data();
    const parts = await Promise.all(selected.map(async ({ category, id }): Promise<BuildPdfPart> => {
      if (category === 'Cooler' && id === 'included-stock-cooler' && cpuData?.packageType === 'BOX') {
        const brand = String(cpuData.brand || '').toLowerCase();
        return {
          category, name: brand.includes('intel') ? 'Intel Laminar RM1 CPU Cooler' : 'AMD Wraith MAX CPU Cooler with RGB LED',
          price: 0, description: 'Bundled cooler.', specifications: { Type: 'Air (Stock)' },
          imageBytes: await getCoverImage('/placeholders/components/cooler.jpg'),
          wattage: 0,
        };
      }
      const snapshot = await getAdminFirestore().doc(inventoryItemPath(category, id)).get();
      const data = snapshot.data();
      if (!data || data.isArchived === true) throw new Error(`A selected ${category} is no longer in the catalog.`);
      const imageUrl = typeof data.imageUrl === 'string' ? data.imageUrl : '';
      if (!imageUrl) throw new Error(`${data.name || category} has no cover image.`);
      return {
        category,
        name: String(data.name || id),
        price: Number(data.price) || 0,
        description: typeof data.description === 'string' ? data.description : '',
        specifications: data.specifications && typeof data.specifications === 'object' ? data.specifications : {},
        imageBytes: await getCoverImage(imageUrl),
        wattage: typeof data.wattage === 'number' ? data.wattage : undefined,
      };
    }));
    const pdf = await createBuildPdf(parts);
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="buildbot-ai-your-build.pdf"',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('[Build PDF] Download failed:', error);
    return NextResponse.json({ error: 'Could not create your build PDF. Check that the selected parts have cover images, then try again.' }, { status: 500 });
  }
}
