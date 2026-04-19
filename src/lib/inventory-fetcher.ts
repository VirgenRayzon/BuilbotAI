import { getAdminFirestore } from "@/firebase/server-init";

/**
 * Maps frontend category keys to Firestore collection names.
 */
const CATEGORY_MAP: Record<string, string> = {
    'cpu': 'CPU',
    'gpu': 'GPU',
    'motherboard': 'Motherboard',
    'ram': 'RAM',
    'storage': 'Storage',
    'psu': 'PSU',
    'case': 'Case',
    'cooler': 'Cooler',
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
        
        // Use Admin SDK query syntax
        let query = db.collection(collectionName).limit(limitCount);
        const snapshot = await query.get();
        
        let docs = snapshot.docs;

        // Filter out archived items
        docs = docs.filter(doc => !doc.data().isArchived);

        // Manual filtering if searchTerm is provided
        if (searchTerm) {
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
            });
        }
        
        if (docs.length === 0) {
            console.log(`[Inventory] No results found for category: ${category}, searchTerm: ${searchTerm}`);
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
