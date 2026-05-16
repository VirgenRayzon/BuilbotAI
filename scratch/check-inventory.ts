import { getAdminFirestore } from "../src/firebase/server-init";

async function checkInventory() {
    const db = getAdminFirestore();
    const categories = ['CPU', 'GPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Case', 'Cooler'];
    
    console.log("Checking Firestore Inventory...");
    for (const cat of categories) {
        try {
            // Check uppercase
            const snapshot = await db.collection(cat).limit(1).get();
            // Check lowercase
            const snapshotLower = await db.collection(cat.toLowerCase()).limit(1).get();
            
            console.log(`${cat}: UppercaseDocs=${snapshot.size}, LowercaseDocs=${snapshotLower.size}`);
            
            if (snapshot.size > 0) {
                const data = snapshot.docs[0].data();
                console.log(`   Sample from ${cat}: isArchived=${data.isArchived}`);
            }
        } catch (e) {
            console.error(`Error checking ${cat}:`, e);
        }
    }
}

checkInventory();
