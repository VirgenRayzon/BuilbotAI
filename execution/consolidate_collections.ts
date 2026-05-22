import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
function initializeFirebase() {
    if (admin.apps.length > 0) return admin.firestore();

    const serviceAccount = process.env.FB_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (serviceAccount) {
        let cert;
        if (serviceAccount.trim().startsWith('{')) {
            cert = JSON.parse(serviceAccount);
        } else {
            const decoded = Buffer.from(serviceAccount, 'base64').toString('utf8');
            cert = JSON.parse(decoded);
        }
        admin.initializeApp({
            credential: admin.credential.cert(cert),
            projectId: projectId
        });
        console.log("[Migration] Initialized Firebase Admin using service account from env.");
    } else {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: projectId
        });
        console.log("[Migration] Initialized Firebase Admin using applicationDefault.");
    }
    return admin.firestore();
}

const db = initializeFirebase();

const CATEGORIES = [
    'CPU', 'GPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Case', 'Cooler', 'Monitor', 'Keyboard', 'Mouse', 'Headset'
];

function generateSearchKeywords(name: string, brand: string, category: string, model?: string, series?: string): string[] {
    const keywordsSet = new Set<string>();

    const processString = (str: string) => {
        if (!str) return;
        // Split by spaces, dashes, slashes, underscores, commas, and parentheses
        const parts = str.toLowerCase().split(/[\s\-_/,\(\)]+/);
        parts.forEach(part => {
            const cleaned = part.replace(/[^a-z0-9]/g, '').trim();
            if (cleaned.length > 0) {
                keywordsSet.add(cleaned);
            }
        });
    };

    processString(name);
    processString(brand);
    processString(category);
    if (model) processString(model);
    if (series) processString(series);

    return Array.from(keywordsSet);
}

async function runMigration() {
    console.log("Starting consolidation of 12 category collections into `/parts`...");
    
    let totalMigrated = 0;
    
    for (const category of CATEGORIES) {
        console.log(`Fetching items from category: ${category}...`);
        const snapshot = await db.collection(category).get();
        console.log(`Found ${snapshot.size} items in collection '${category}'.`);
        
        if (snapshot.empty) continue;
        
        let batch = db.batch();
        let batchCount = 0;
        
        for (const doc of snapshot.docs) {
            const data = doc.data();
            
            // Generate search keywords
            const keywords = generateSearchKeywords(
                data.name || '',
                data.brand || '',
                category,
                data.model,
                data.series
            );
            
            const partRef = db.collection('parts').doc(doc.id);
            
            batch.set(partRef, {
                ...data,
                category: category, // Ensure category is stored in the consolidated document
                searchKeywords: keywords,
                isArchived: data.isArchived || false
            });
            
            batchCount++;
            totalMigrated++;
            
            if (batchCount >= 400) {
                await batch.commit();
                console.log(`Committed batch of ${batchCount} items for ${category}.`);
                batch = db.batch();
                batchCount = 0;
            }
        }
        
        if (batchCount > 0) {
            await batch.commit();
            console.log(`Committed remaining ${batchCount} items for ${category}.`);
        }
    }
    
    console.log(`Consolidation complete! Successfully migrated ${totalMigrated} items to /parts.`);
}

runMigration()
    .then(() => process.exit(0))
    .catch(err => {
        console.error("Migration failed:", err);
        process.exit(1);
    });
