/** Read-only client SDK check for public catalog paths after rules deployment. */
import 'dotenv/config';
import { deleteApp, initializeApp } from 'firebase/app';
import { collection, doc, getDoc, getDocs, getFirestore, limit, query, terminate } from 'firebase/firestore';

async function main() {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId || process.argv[2] !== `--project=${projectId}`) {
        throw new Error('Pass --project=<active Firebase project ID> to verify the intended database.');
    }
    const app = initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });
    const db = getFirestore(app);
    try {
        const [category, inventory, prebuilts, about] = await Promise.all([
            getDoc(doc(db, 'inventory', 'cpu')),
            getDocs(query(collection(db, 'inventory', 'cpu', 'items'), limit(1))),
            getDocs(query(collection(db, 'prebuiltSystems'), limit(1))),
            getDoc(doc(db, 'siteContent', 'about')),
        ]);
        if (!category.exists() || inventory.empty || prebuilts.empty) {
            throw new Error('A public catalog path returned no expected data.');
        }
        console.log(JSON.stringify({
            projectId,
            inventoryCategoryReadable: category.exists(),
            inventoryItemReadable: !inventory.empty,
            prebuiltReadable: !prebuilts.empty,
            aboutContentReadable: about.exists(),
        }, null, 2));
    } finally {
        await terminate(db);
        await deleteApp(app);
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
