const { getAdminFirestore } = require('../src/firebase/server-init');
require('dotenv').config();

const COLLECTIONS = [
    'CPU', 'GPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Case', 'Cooler'
];

async function findBadData() {
    try {
        const db = getAdminFirestore();
        console.log("Scanning collections for missing 'model' or 'imageUrl' fields...");
        
        for (const colName of COLLECTIONS) {
            const snapshot = await db.collection(colName).get();
            let count = 0;
            snapshot.forEach(doc => {
                const data = doc.data();
                if (!data.model) {
                    console.log(`[${colName}] Document ID: ${doc.id} is MISSING 'model' field!`);
                    console.log(`    Data: ${JSON.stringify(data)}`);
                    count++;
                }
                if (!data.imageUrl) {
                    // console.log(`[${colName}] Document ID: ${doc.id} is MISSING 'imageUrl' field!`);
                }
            });
            if (count === 0) {
                // console.log(`[${colName}] All items have 'model' field.`);
            }
        }
        console.log("Scan complete.");
    } catch (e) {
        console.error("Error during scan:", e);
    }
}

findBadData();
