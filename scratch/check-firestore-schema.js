const { getAdminFirestore } = require('../src/firebase/server-init');
// FIREBASE_SERVICE_ACCOUNT should be set in environment variables

async function checkSample() {
    try {
        const db = getAdminFirestore();
        const snapshot = await db.collection('Motherboard').limit(1).get();
        if (snapshot.empty) {
            console.log("No motherboards found.");
            return;
        }
        const data = snapshot.docs[0].data();
        console.log("Sample Motherboard Data:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

checkSample();
