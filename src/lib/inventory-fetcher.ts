import { getAdminFirestore } from "@/firebase/server-init";

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
    
    try {
        const db = getAdminFirestore();
        const collectionName = CATEGORY_MAP[normalizedCat] || category;
        
        // 1. Start with native Firestore filtering
        let query = db.collection(collectionName)
                      .where('isArchived', '==', false);
        
        // 2. Fetch the snapshot
        // Note: Firestore doesn't support native partial string search without an external indexer (like Algolia),
        // but we can limit and then filter in memory for small-medium collections.
        // We'll increase the limit slightly if a search term is present to ensure enough candidates.
        let snapshot = await query.limit(searchTerm ? limitCount * 2 : limitCount).get();
        
        // Fallback: If no results with isArchived == false, try fetching without that filter 
        // (some items might be missing the isArchived field entirely)
        if (snapshot.empty && !searchTerm) {
            snapshot = await db.collection(collectionName).limit(limitCount).get();
        }
        
        let docs = snapshot.docs;

        // 3. Manual filtering if searchTerm is provided
        if (searchTerm && searchTerm !== "undefined") {
            const term = searchTerm.toLowerCase();
            docs = docs.filter(doc => {
                const data = doc.data();
                const name = (data.name || '').toLowerCase();
                const brand = (data.brand || '').toLowerCase();
                const series = (data.series || '').toLowerCase();
                const model = (data.model || '').toLowerCase();
                // Check all relevant fields for the search term
                return name.includes(term) || 
                       brand.includes(term) || 
                       series.includes(term) ||
                       model.includes(term);
            }).slice(0, limitCount); // Trim back to requested limit
        }
        
        if (docs.length === 0) {
            console.log(`[Inventory] No results found for category: ${category}${searchTerm && searchTerm !== "undefined" ? `, searchTerm: ${searchTerm}` : ''}`);
        }

        return docs.map(doc => {
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
    } catch (error) {
        console.error(`Error fetching Firestore inventory for ${category}:`, error);
        return [];
    }
}

