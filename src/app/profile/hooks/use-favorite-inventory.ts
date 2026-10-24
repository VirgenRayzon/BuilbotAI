'use client';

import { useMemo } from 'react';
import { collection } from 'firebase/firestore';
import { useCollection, useFirestore } from '@/firebase';
import type { Part } from '@/lib/types';

const categories = ['CPU', 'GPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Case', 'Cooler', 'Monitor', 'Keyboard', 'Mouse', 'Headset'] as const;

/** Keep the existing favorite stock sources, with a fixed Hook order on startup. */
export function useFavoriteInventory() {
  const firestore = useFirestore();
  const refs = useMemo(() => categories.map(category => firestore ? collection(firestore, category) : null), [firestore]);
  const results = [
    useCollection<Part>(refs[0]),
    useCollection<Part>(refs[1]),
    useCollection<Part>(refs[2]),
    useCollection<Part>(refs[3]),
    useCollection<Part>(refs[4]),
    useCollection<Part>(refs[5]),
    useCollection<Part>(refs[6]),
    useCollection<Part>(refs[7]),
    useCollection<Part>(refs[8]),
    useCollection<Part>(refs[9]),
    useCollection<Part>(refs[10]),
    useCollection<Part>(refs[11]),
  ];

  return results.flatMap((result, index) => (result.data ?? []).map(part => ({ ...part, category: categories[index] })));
}
