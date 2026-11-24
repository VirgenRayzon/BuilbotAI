import { getAdminFirestore } from "@/firebase/server-init";
import { inventoryCategorySlug, inventoryItemsPath } from "@/lib/inventory-paths";
import { getCatalogMeta } from "@/lib/server/catalog-meta-store";

export interface StructuredPart {
    id: string;
    name: string;
    brand: string;
    model: string;
    price: number;
    stock?: number;
    isArchived?: boolean;
    imageUrl: string;
    category: string;
    socket?: string;
    ramType?: string;
    wattage?: number;
    performanceScore?: number;
    dimensions?: { width: number; height: number; depth: number };
    specifications?: Record<string, unknown>;
}

export interface InventoryCacheEntry<T> {
    data: T;
    timestamp: number;
    version: number;
}

export interface VersionedInventoryStoreOptions {
    versionReader?: () => Promise<number>;
    versionCheckWindowMs?: number;
    cacheTtlMs?: number;
}

export class VersionedInventoryStore {
    private inventoryCache = new Map<string, InventoryCacheEntry<string[]>>();
    private structuredCache = new Map<string, InventoryCacheEntry<StructuredPart[]>>();
    private currentCatalogVersion = -1;
    private lastVersionCheck = 0;
    private readonly versionCheckWindowMs: number;
    private readonly cacheTtlMs: number;
    private readonly versionReader: () => Promise<number>;

    constructor(options?: VersionedInventoryStoreOptions) {
        this.versionCheckWindowMs = options?.versionCheckWindowMs ?? 3000;
        this.cacheTtlMs = options?.cacheTtlMs ?? 5 * 60 * 1000;
        this.versionReader = options?.versionReader ?? (async () => {
            const meta = await getCatalogMeta();
            return meta.catalogVersion;
        });
    }

    public async syncCatalogVersion(): Promise<number> {
        const now = Date.now();
        if (this.currentCatalogVersion !== -1 && now - this.lastVersionCheck < this.versionCheckWindowMs) {
            return this.currentCatalogVersion;
        }
        try {
            const version = await this.versionReader();
            this.lastVersionCheck = Date.now();
            if (this.currentCatalogVersion !== -1 && version !== this.currentCatalogVersion) {
                this.inventoryCache.clear();
                this.structuredCache.clear();
            }
            this.currentCatalogVersion = version;
            return version;
        } catch {
            return this.currentCatalogVersion !== -1 ? this.currentCatalogVersion : 0;
        }
    }

    public getCachedInventory(key: string, version: number): string[] | null {
        const cached = this.inventoryCache.get(key);
        if (cached && cached.version === version && Date.now() - cached.timestamp < this.cacheTtlMs) {
            return cached.data;
        }
        return null;
    }

    public setCachedInventory(key: string, data: string[], version: number): void {
        this.inventoryCache.set(key, {
            data,
            timestamp: Date.now(),
            version,
        });
    }

    public getCachedStructured(key: string, version: number): StructuredPart[] | null {
        const cached = this.structuredCache.get(key);
        if (cached && cached.version === version && Date.now() - cached.timestamp < this.cacheTtlMs) {
            return cached.data;
        }
        return null;
    }

    public setCachedStructured(key: string, data: StructuredPart[], version: number): void {
        this.structuredCache.set(key, {
            data,
            timestamp: Date.now(),
            version,
        });
    }

    public clear(): void {
        this.inventoryCache.clear();
        this.structuredCache.clear();
        this.currentCatalogVersion = -1;
        this.lastVersionCheck = 0;
    }

    public getInventoryCacheSize(): number {
        return this.inventoryCache.size;
    }

    public getStructuredCacheSize(): number {
        return this.structuredCache.size;
    }

    public getCurrentVersion(): number {
        return this.currentCatalogVersion;
    }
}

export const defaultInventoryStore = new VersionedInventoryStore();

export function clearInventoryCache() {
    console.log("[Inventory Cache] Invalidation triggered.");
    defaultInventoryStore.clear();
}

const CATEGORY_MAP: Record<string, string> = {
    'cpu': 'CPU',
    'gpu': 'GPU',
    'graphics card': 'GPU',
    'motherboard': 'Motherboard',
    'ram': 'RAM',
    'memory': 'RAM',
    'storage': 'Storage',
    'psu': 'PSU',
    'power supply': 'PSU',
    'case': 'Case',
    'cooler': 'Cooler',
    'cpu cooler': 'Cooler',
    'monitor': 'Monitor',
    'keyboard': 'Keyboard',
    'mouse': 'Mouse',
    'headset': 'Headset'
};

export async function getInventoryFromFirestore(category: string, searchTerm?: string, limitCount: number = 50, includeImage: boolean = true): Promise<string[]> {
    const normalizedCat = category.toLowerCase();
    const cacheKey = `${normalizedCat}:${searchTerm || ''}:${limitCount}:${includeImage}`;

    try {
        const version = await defaultInventoryStore.syncCatalogVersion();
        const cached = defaultInventoryStore.getCachedInventory(cacheKey, version);
        if (cached) {
            console.log(`[Inventory Cache Hit] Key: ${cacheKey}`);
            return cached;
        }

        const db = getAdminFirestore();
        const collectionName = CATEGORY_MAP[normalizedCat] || category;

        const items = db.collection(inventoryItemsPath(collectionName));
        let query = items.where('isArchived', '==', false);

        if (searchTerm && searchTerm !== "undefined" && searchTerm.trim() !== "") {
            const terms = searchTerm.toLowerCase().split(/[\s\-_/,\(\)]+/).map(t => t.replace(/[^a-z0-9]/g, '').trim()).filter(t => t.length > 0);
            if (terms.length > 0) {
                query = query.where('searchKeywords', 'array-contains', terms[0]);
            }
        }

        const snapshot = await query.limit(searchTerm ? limitCount * 2 : limitCount).get();

        let docs = snapshot.docs;

        if (searchTerm && searchTerm !== "undefined" && searchTerm.trim() !== "") {
            const terms = searchTerm.toLowerCase().split(/[\s\-_/,\(\)]+/).map(t => t.replace(/[^a-z0-9]/g, '').trim()).filter(t => t.length > 0);
            if (terms.length > 0) {
                docs = docs.filter(doc => {
                    const data = doc.data();
                    const name = (data.name || '').toLowerCase();
                    const brand = (data.brand || '').toLowerCase();
                    const series = (data.series || '').toLowerCase();
                    const model = (data.model || '').toLowerCase();

                    return terms.every(term =>
                        name.includes(term) ||
                        brand.includes(term) ||
                        series.includes(term) ||
                        model.includes(term)
                    );
                }).slice(0, limitCount);
            }
        }

        if (docs.length === 0) {
            console.log(`[Inventory] No results found for category: ${category}${searchTerm && searchTerm !== "undefined" ? `, searchTerm: ${searchTerm}` : ''}`);
        }

        const results = docs.map(doc => {
            const data = doc.data();
            const brand = data.brand || '';
            const name = data.name || 'Unknown Part';
            const model = data.model || '';

            let displayName = name;
            if (brand && !displayName.toLowerCase().includes(brand.toLowerCase())) {
                displayName = `${brand} ${displayName}`;
            }
            if (model && !displayName.toLowerCase().includes(model.toLowerCase())) {
                displayName = `${displayName} ${model}`;
            }

            const price = typeof data.price === 'number' ? ` - Price: ₱${data.price.toLocaleString()}` : '';
            const imageUrl = includeImage && data.imageUrl ? ` - Image: ${data.imageUrl}` : '';
            return `[ID: ${doc.id}] [${category.toUpperCase()}] Name: "${displayName}"${price}${imageUrl}`;
        });

        defaultInventoryStore.setCachedInventory(cacheKey, results, version);

        return results;
    } catch (error) {
        console.error(`Error fetching Firestore inventory for ${category}:`, error);
        return [];
    }
}

export async function getStructuredInventory(category: string, searchTerm?: string, limitCount: number = 50, fresh = false): Promise<StructuredPart[]> {
    const normalizedCat = category.toLowerCase();
    const cacheKey = `${normalizedCat}:${searchTerm || ''}:${limitCount}`;

    try {
        const version = await defaultInventoryStore.syncCatalogVersion();
        const cached = !fresh ? defaultInventoryStore.getCachedStructured(cacheKey, version) : null;
        if (cached) {
            console.log(`[Structured Inventory Cache Hit] Key: ${cacheKey}`);
            return cached;
        }

        const db = getAdminFirestore();
        const collectionName = CATEGORY_MAP[normalizedCat] || category;

        const items = db.collection(inventoryItemsPath(collectionName));
        let query = items.where('isArchived', '==', false);

        if (searchTerm && searchTerm !== "undefined" && searchTerm.trim() !== "") {
            const terms = searchTerm.toLowerCase().split(/[\s\-_/,\(\)]+/).map(t => t.replace(/[^a-z0-9]/g, '').trim()).filter(t => t.length > 0);
            if (terms.length > 0) {
                query = query.where('searchKeywords', 'array-contains', terms[0]);
            }
        }

        const snapshot = await query.limit(searchTerm ? limitCount * 2 : limitCount).get();

        let docs = snapshot.docs;

        if (searchTerm && searchTerm !== "undefined" && searchTerm.trim() !== "") {
            const terms = searchTerm.toLowerCase().split(/[\s\-_/,\(\)]+/).map(t => t.replace(/[^a-z0-9]/g, '').trim()).filter(t => t.length > 0);
            if (terms.length > 0) {
                docs = docs.filter(doc => {
                    const data = doc.data();
                    const name = (data.name || '').toLowerCase();
                    const brand = (data.brand || '').toLowerCase();
                    const series = (data.series || '').toLowerCase();
                    const model = (data.model || '').toLowerCase();

                    return terms.every(term =>
                        name.includes(term) ||
                        brand.includes(term) ||
                        series.includes(term) ||
                        model.includes(term)
                    );
                }).slice(0, limitCount);
            }
        }

        const results: StructuredPart[] = docs.map(doc => {
            const data = doc.data();
            const brand = data.brand || '';
            const name = data.name || 'Unknown Part';
            const model = data.model || '';

            let displayName = name;
            if (brand && !displayName.toLowerCase().includes(brand.toLowerCase())) {
                displayName = `${brand} ${displayName}`;
            }
            if (model && !displayName.toLowerCase().includes(model.toLowerCase())) {
                displayName = `${displayName} ${model}`;
            }

            return {
                id: doc.id,
                name: displayName,
                brand: brand,
                model: model,
                price: typeof data.price === 'number' ? data.price : 0,
                stock: data.stock,
                isArchived: data.isArchived,
                imageUrl: data.imageUrl || '',
                category: inventoryCategorySlug(collectionName),
                socket: data.socket,
                ramType: data.ramType,
                wattage: data.wattage,
                performanceScore: data.performanceScore,
                dimensions: data.dimensions,
                specifications: data.specifications,
            };
        });

        defaultInventoryStore.setCachedStructured(cacheKey, results, version);

        return results;
    } catch (error) {
        console.error(`Error fetching structured Firestore inventory for ${category}:`, error);
        return [];
    }
}
