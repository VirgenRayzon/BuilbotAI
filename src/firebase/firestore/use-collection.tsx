
'use client';
import {
  Query,
  onSnapshot,
  FirestoreError,
  QuerySnapshot,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

export interface UseCollectionOptions {
  // Define any options here if needed in the future
}

export function useCollection<T>(
  query: Query | null,
  options?: UseCollectionOptions
) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!query) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot) => {
        const result: T[] = [];
        snapshot.forEach((doc) => {
          result.push({ id: doc.id, ...doc.data() } as T);
        });
        setData(result);
        setLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        console.error('Error in useCollection:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]); // Refetch on query change

  return { data, loading, error };
}
