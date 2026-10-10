/** Read-only check for the new inventory paths and active catalog queries. */
import 'dotenv/config';
import { getAdminFirestore } from '../src/firebase/server-init';
import {
    INVENTORY_CATEGORY_SLUGS,
    inventoryCategoryLabel,
    inventoryCategoryPath,
    inventoryItemsPath,
} from '../src/lib/inventory-paths';

async function main() {
    const db = getAdminFirestore();
    const expectedProject = process.argv.find(arg => arg.startsWith('--project='))?.slice('--project='.length);
    if (!expectedProject || expectedProject !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        throw new Error('Pass --project=<active Firebase project ID> to verify the intended database.');
    }

    const results = await Promise.all(INVENTORY_CATEGORY_SLUGS.map(async slug => {
        const category = await db.doc(inventoryCategoryPath(slug)).get();
        const items = db.collection(inventoryItemsPath(slug));
        const [all, active] = await Promise.all([
            items.get(),
            items.where('isArchived', '==', false).get(),
        ]);
        if (!category.exists || category.data()?.label !== inventoryCategoryLabel(slug)) {
            throw new Error(`Missing or incorrect category metadata at ${category.ref.path}`);
        }
        if (all.docs.some(part => part.data().category !== inventoryCategoryLabel(slug))) {
            throw new Error(`Unexpected category field in ${items.path}`);
        }
        return { category: slug, total: all.size, active: active.size };
    }));
    const cpuSearch = await db.collection(inventoryItemsPath('cpu'))
        .where('isArchived', '==', false)
        .where('searchKeywords', 'array-contains', 'cpu')
        .limit(1)
        .get();
    if (cpuSearch.empty) {
        throw new Error('The active CPU search query returned no inventory item.');
    }

    console.log(JSON.stringify({
        projectId: expectedProject,
        categories: results,
        totalParts: results.reduce((total, category) => total + category.total, 0),
        cpuSearchReady: !cpuSearch.empty,
    }, null, 2));
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
