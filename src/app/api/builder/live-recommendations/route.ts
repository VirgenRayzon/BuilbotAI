import { getAdminAuth, getAdminFirestore } from '@/firebase/server-init';
import { inventoryItemPath, inventoryItemsPath } from '@/lib/inventory-paths';
import { CORE_RECOMMENDATION_CATEGORIES, componentFromPart, getBudgetProjection, isSafeRecommendation,
  type BuilderSelection } from '@/lib/live-build-recommendations';
import {
  liveRecommendationRequestSchema,
  type LiveRecommendationRequest,
  type LiveRecommendationResponse,
} from '@/lib/live-build-recommendation-schema';
import { syncIntegratedGraphics } from '@/lib/integrated-graphics';
import type { Part } from '@/lib/types';

export const runtime = 'nodejs';

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

function catalogPart(category: Part['category'], id: string, data: FirebaseFirestore.DocumentData): Part {
  const specifications = Object.fromEntries(Object.entries(data.specifications || {})
    .filter((entry): entry is [string, string | number] =>
      typeof entry[1] === 'string' || typeof entry[1] === 'number'));
  return {
    id, category, name: String(data.name || ''), brand: String(data.brand || ''),
    price: Number(data.price) || 0, stock: Number(data.stock) || 0,
    imageUrl: String(data.imageUrl || ''), specifications,
    wattage: typeof data.wattage === 'number' ? data.wattage : undefined,
    performanceScore: typeof data.performanceScore === 'number' ? data.performanceScore : undefined,
    performanceTier: typeof data.performanceTier === 'number' ? data.performanceTier : undefined,
    socket: typeof data.socket === 'string' ? data.socket : undefined,
    ramType: typeof data.ramType === 'string' ? data.ramType : undefined,
    dimensions: data.dimensions,
    packageType: data.packageType === 'BOX' || data.packageType === 'TRAY' ? data.packageType : undefined,
    isArchived: data.isArchived === true,
  };
}

async function liveParts(input: LiveRecommendationRequest) {
  const db = getAdminFirestore();
  const references = [...input.selected, ...input.candidates];
  const unique = new Map(references.map(part => [inventoryItemPath(part.category, part.id), part]));
  const paths = [...unique.keys()];
  const snapshots = paths.length ? await db.getAll(...paths.map(path => db.doc(path))) : [];
  const byPath = new Map(snapshots.filter(snapshot => snapshot.exists).map(snapshot => [
    snapshot.ref.path,
    catalogPart(unique.get(snapshot.ref.path)!.category, snapshot.id, snapshot.data()!),
  ]));
  const build: BuilderSelection = { CPU: null, GPU: null, Motherboard: null, RAM: [], Storage: [], PSU: null,
    Cooler: null, Case: null, Monitor: null, Keyboard: null, Mouse: null, Headset: null };
  const counts = new Map<string, number>();
  for (const selected of input.selected) {
    const path = inventoryItemPath(selected.category, selected.id);
    const part = byPath.get(path);
    if (!part || part.isArchived || part.stock <= 0) return null;
    const count = (counts.get(path) || 0) + 1;
    if (count > part.stock) return null;
    counts.set(path, count);
    const component = componentFromPart(part);
    if (selected.category === 'RAM' || selected.category === 'Storage') {
      (build[selected.category] as typeof component[]).push(component);
    } else {
      build[selected.category] = component;
    }
  }
  const withGraphics = syncIntegratedGraphics(build);
  const cpu = withGraphics.CPU;
  const cpuCatalog = !Array.isArray(cpu) && cpu ? byPath.get(inventoryItemPath('CPU', cpu.id)) : undefined;
  if (input.includedCooler && cpuCatalog?.packageType === 'BOX') {
    withGraphics.Cooler = {
      id: 'included-stock-cooler', model: 'Bundled CPU cooler', price: 0, description: 'Bundled cooler.',
      image: '', imageHint: 'included cooler', icon: () => null, wattage: 0,
      specifications: { Type: 'Air (Stock)' },
    };
  }
  return { build: withGraphics, byPath };
}

async function completionInventory(build: BuilderSelection, knownParts: Part[]): Promise<Part[]> {
  const missing = CORE_RECOMMENDATION_CATEGORIES.filter(category => {
    const value = build[category];
    return Array.isArray(value) ? value.length === 0 : !value;
  });
  const db = getAdminFirestore();
  const snapshots = await Promise.all(missing.map(category => db.collection(inventoryItemsPath(category)).get()));
  const inventory = snapshots.flatMap((snapshot, index) => snapshot.docs.map(document =>
    catalogPart(missing[index], document.id, document.data())));
  const existing = new Set(inventory.map(part => `${part.category}:${part.id}`));
  return [...inventory, ...knownParts.filter(part => !existing.has(`${part.category}:${part.id}`))];
}

export async function POST(request: Request): Promise<Response> {
  try {
    const token = request.headers.get('authorization')?.match(/^Bearer (\S+)$/)?.[1];
    if (!token) return json({ error: 'Sign in to get build recommendations.' }, 401);
    let uid: string;
    try {
      uid = (await getAdminAuth().verifyIdToken(token, true)).uid;
    } catch {
      return json({ error: 'Your sign-in session has expired.' }, 401);
    }
    const db = getAdminFirestore();
    const profile = await db.collection('users').doc(uid).get();
    if (!profile.exists) return json({ error: 'Account profile is unavailable.' }, 403);
    const settings = await db.collection('siteSettings').doc('main').get();
    if (settings.data()?.isLiveBuilderRecommendationsEnabled !== true) {
      return json({ error: 'Live builder recommendations are disabled.' }, 503);
    }
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid recommendation request.' }, 400);
    }
    const parsed = liveRecommendationRequestSchema.safeParse(body);
    if (!parsed.success) return json({ error: 'Invalid recommendation request.' }, 400);
    const input = parsed.data;
    const current = await liveParts(input);
    if (!current) return json({ error: 'A selected part is no longer available. Refresh the build before applying a recommendation.' }, 409);

    const inventory = input.budget
      ? await completionInventory(current.build, [...current.byPath.values()])
      : [];
    const projection = input.budget ? getBudgetProjection(inventory, current.build) : null;

    const suggestions = input.candidates.flatMap(candidate => {
      const part = current.byPath.get(inventoryItemPath(candidate.category, candidate.id));
      if (!part || !isSafeRecommendation(part, current.build, input.budget)) return [];
      let projectedCompleteTotal: number | undefined;
      if (input.budget) {
        const value = current.build[part.category];
        const trial: BuilderSelection = {
          ...current.build,
          [part.category]: part.category === 'RAM' || part.category === 'Storage'
            ? [...(Array.isArray(value) ? value : value ? [value] : []), componentFromPart(part)]
            : componentFromPart(part),
        };
        const complete = getBudgetProjection(inventory, trial).minimumCompleteTotal;
        if (complete === null || complete > input.budget) return [];
        projectedCompleteTotal = complete;
      }
      const selected = current.build[part.category];
      const action = !Array.isArray(selected) && selected ? 'replace' as const : 'add' as const;
      return [{ id: part.id, category: part.category, name: part.name, price: part.price,
        stock: part.stock, action, role: candidate.role, projectedCompleteTotal,
        reason: input.budget
          ? action === 'replace'
            ? 'Lower-cost replacement that leaves room for required parts.'
            : 'Leaves room for the remaining required parts at current catalog prices.'
          : 'Compatible with your selected parts and in stock.' }];
    }).slice(0, input.mode === 'verify' ? 1 : 2);
    return json({ projection, suggestions } satisfies LiveRecommendationResponse);
  } catch (error) {
    console.error('[Live Build Recommendations] Request failed:', error);
    return json({ error: 'Could not update recommendations. Please try again.' }, 500);
  }
}
