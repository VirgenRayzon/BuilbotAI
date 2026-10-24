"use client";

import { useEffect, useState } from 'react';
import { getCachedInventory } from '@/app/actions';
import type { Part } from '@/lib/types';

/**
 * Hook to fetch all PC components from Firestore (cached server-side) and combine them.
 */
export function useInventoryQuery(initialParts?: Part[]) {
    const [allParts, setAllParts] = useState<Part[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (initialParts !== undefined) return;
        let active = true;
        async function fetchCatalog() {
            try {
                setLoading(true);
                const data = await getCachedInventory();
                if (active) {
                    setAllParts(data);
                }
            } catch (error) {
                console.error("Failed to load inventory catalog from server:", error);
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }
        fetchCatalog();
        return () => {
            active = false;
        };
    }, [initialParts]);

    return { allParts: initialParts ?? allParts, loading: initialParts === undefined && loading };
}
