import { getAdminFirestore } from "@/firebase/server-init";

interface CacheEntry {
    data: string[];
    timestamp: number;
}

const inventoryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const structuredCache = new Map<string, { data: StructuredPart[], timestamp: number }>();

export interface StructuredPart {
    id: string;
    name: string;
    brand: string;
    model: string;
    price: number;
    imageUrl: string;
    category: string;
}

export function clearInventoryCache() {
    console.log("[Inventory Cache] Invalidation triggered.");
    inventoryCache.clear();
    structuredCache.clear();
}

/**
 * Maps frontend category keys to Firestore collection names.
 */
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

/**
 * Fetches parts exclusively from the live Firestore database collections.
 */
export async function getInventoryFromFirestore(category: string, searchTerm?: string, limitCount: number = 50): Promise<string[]> {
    const normalizedCat = category.toLowerCase();
    const cacheKey = `${normalizedCat}:${searchTerm || ''}:${limitCount}`;
    
    try {
        const cached = inventoryCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            console.log(`[Inventory Cache Hit] Key: ${cacheKey}`);
            return cached.data;
        }

        const db = getAdminFirestore();
        const collectionName = CATEGORY_MAP[normalizedCat] || category;
        
        // 1. Start with native Firestore filtering on parts collection
        let query = db.collection('parts')
                      .where('category', '==', collectionName)
                      .where('isArchived', '==', false);
        
        // Native Firestore query on searchKeywords using array-contains for the first search term
        if (searchTerm && searchTerm !== "undefined" && searchTerm.trim() !== "") {
            const terms = searchTerm.toLowerCase().split(/[\s\-_/,\(\)]+/).map(t => t.replace(/[^a-z0-9]/g, '').trim()).filter(t => t.length > 0);
            if (terms.length > 0) {
                query = query.where('searchKeywords', 'array-contains', terms[0]);
            }
        }
        
        // 2. Fetch the snapshot
        let snapshot = await query.limit(searchTerm ? limitCount * 2 : limitCount).get();
        
        // Fallback: If no results with isArchived == false, try fetching without that filter 
        if (snapshot.empty && !searchTerm) {
            snapshot = await db.collection('parts')
                         .where('category', '==', collectionName)
                         .limit(limitCount).get();
        }
        
        let docs = snapshot.docs;
 
        // 3. Manual filtering / refinement for multi-word matches
        if (searchTerm && searchTerm !== "undefined" && searchTerm.trim() !== "") {
            const terms = searchTerm.toLowerCase().split(/[\s\-_/,\(\)]+/).map(t => t.replace(/[^a-z0-9]/g, '').trim()).filter(t => t.length > 0);
            if (terms.length > 0) {
                docs = docs.filter(doc => {
                    const data = doc.data();
                    const name = (data.name || '').toLowerCase();
                    const brand = (data.brand || '').toLowerCase();
                    const series = (data.series || '').toLowerCase();
                    const model = (data.model || '').toLowerCase();
                    
                    // Verify that every search term word matches at least one field
                    return terms.every(term => 
                        name.includes(term) || 
                        brand.includes(term) || 
                        series.includes(term) ||
                        model.includes(term)
                    );
                }).slice(0, limitCount); // Trim back to requested limit
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
            // Ensure brand and model are part of the name if not already there
            if (brand && !displayName.toLowerCase().includes(brand.toLowerCase())) {
                displayName = `${brand} ${displayName}`;
            }
            if (model && !displayName.toLowerCase().includes(model.toLowerCase())) {
                displayName = `${displayName} ${model}`;
            }
            
            const price = typeof data.price === 'number' ? ` - Price: ₱${data.price.toLocaleString()}` : '';
            const imageUrl = data.imageUrl ? ` - Image: ${data.imageUrl}` : '';
            return `[ID: ${doc.id}] [${category.toUpperCase()}] Name: "${displayName}"${price}${imageUrl}`;
        });

        inventoryCache.set(cacheKey, {
            data: results,
            timestamp: Date.now()
        });

        return results;
    } catch (error) {
        console.error(`Error fetching Firestore inventory for ${category}:`, error);
        return [];
    }
}

/**
 * Fetches structured parts from Firestore collections.
 */
export async function getStructuredInventory(category: string, searchTerm?: string, limitCount: number = 50): Promise<StructuredPart[]> {
    const normalizedCat = category.toLowerCase();
    const cacheKey = `${normalizedCat}:${searchTerm || ''}:${limitCount}`;
    
    try {
        const cached = structuredCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            console.log(`[Structured Inventory Cache Hit] Key: ${cacheKey}`);
            return cached.data;
        }

        const db = getAdminFirestore();
        const collectionName = CATEGORY_MAP[normalizedCat] || category;
        
        let query = db.collection('parts')
                      .where('category', '==', collectionName)
                      .where('isArchived', '==', false);
        
        if (searchTerm && searchTerm !== "undefined" && searchTerm.trim() !== "") {
            const terms = searchTerm.toLowerCase().split(/[\s\-_/,\(\)]+/).map(t => t.replace(/[^a-z0-9]/g, '').trim()).filter(t => t.length > 0);
            if (terms.length > 0) {
                query = query.where('searchKeywords', 'array-contains', terms[0]);
            }
        }
        
        let snapshot = await query.limit(searchTerm ? limitCount * 2 : limitCount).get();
        
        if (snapshot.empty && !searchTerm) {
            snapshot = await db.collection('parts')
                         .where('category', '==', collectionName)
                         .limit(limitCount).get();
        }
        
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
                imageUrl: data.imageUrl || '',
                category: normalizedCat
            };
        });

        structuredCache.set(cacheKey, {
            data: results,
            timestamp: Date.now()
        });

        return results;
    } catch (error) {
        console.error(`Error fetching structured Firestore inventory for ${category}:`, error);
        return [];
    }
}

