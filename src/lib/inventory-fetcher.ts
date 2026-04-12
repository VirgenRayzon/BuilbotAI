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
export async function getInventoryFromFirestore(category: string, limitCount: number = 20): Promise<string[]> {
    const normalizedCat = category.toLowerCase();
    
    try {
        const db = getAdminFirestore();
        const collectionName = CATEGORY_MAP[normalizedCat] || category;
        const q = query(collection(db, collectionName), limit(limitCount));
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => {
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
