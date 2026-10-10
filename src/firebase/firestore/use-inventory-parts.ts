'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, type Firestore, type FirestoreError } from 'firebase/firestore';
import { INVENTORY_CATEGORY_SLUGS, inventoryItemsPath } from '@/lib/inventory-paths';
import type { Part } from '@/lib/types';

export function useInventoryParts(firestore: Firestore | null | undefined) {
    const [data, setData] = useState<Part[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<FirestoreError | null>(null);

    useEffect(() => {
        if (!firestore) {
            setData([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        const categoryParts = new Map<string, Part[]>();
        const pending = new Set<string>(INVENTORY_CATEGORY_SLUGS);

        const unsubscribers = INVENTORY_CATEGORY_SLUGS.map(slug => onSnapshot(
            collection(firestore, inventoryItemsPath(slug)),
            snapshot => {
                categoryParts.set(slug, snapshot.docs.map(part => ({
                    ...part.data(),
                    id: part.id,
                } as Part)));
                pending.delete(slug);
                setData(INVENTORY_CATEGORY_SLUGS.flatMap(category => categoryParts.get(category) || []));
                if (pending.size === 0) setLoading(false);
            },
            snapshotError => {
                console.error(`Inventory listener failed for ${slug}:`, snapshotError);
                setError(snapshotError);
                pending.delete(slug);
                if (pending.size === 0) setLoading(false);
            }
        ));

        return () => unsubscribers.forEach(unsubscribe => unsubscribe());
    }, [firestore]);

    return { data, loading, error };
}
