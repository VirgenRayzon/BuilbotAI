import { getAdminFirestore } from "@/firebase/server-init";
import { collection, getDocs, limit, query } from "firebase/firestore";

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
export async function getInventoryFromFirestore(category: string, searchTerm?: string, limitCount: number = 30): Promise<string[]> {
    const normalizedCat = category.toLowerCase();
    
    try {
        const db = getAdminFirestore();
        const collectionName = CATEGORY_MAP[normalizedCat] || category;
        const q = query(collection(db, collectionName), limit(limitCount));
        const snapshot = await getDocs(q);
        
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
                return name.includes(term) || brand.includes(term) || series.includes(term);
            });
        }
        
        return docs.map(doc => {
            const data = doc.data();
            const brand = data.brand || '';
            const name = data.name || 'Unknown Part';
            
            let displayName = name;
            if (brand && name.toLowerCase().startsWith(brand.toLowerCase())) {
                // Already prefixed
            } else if (brand) {
                displayName = `${brand} ${name}`;
            }
            
            const price = typeof data.price === 'number' ? ` - Price: ₱${data.price.toLocaleString()}` : '';
            const imageUrl = data.image ? ` - Image: "${data.image}"` : '';
            return `[ID: ${doc.id}] [${category.toUpperCase()}] Name: "${displayName}"${price}${imageUrl}`;
        });
    } catch (error) {
        console.error(`Error fetching Firestore inventory for ${category}:`, error);
        return [];
    }
}
