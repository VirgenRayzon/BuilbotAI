'use client';
import { useRef } from 'react';

/** Retain an unchanged submission's key across response-loss retries. */
export function useProductSaveOperation() {
  const saved = useRef<{ contents: string; key: string } | null>(null);
  const getOperation = (values: unknown) => {
    const contents = JSON.stringify(values);
    if (saved.current?.contents !== contents) saved.current = { contents, key: crypto.randomUUID() };
    return saved.current.key;
  };
  return { getOperation, resetOperation: () => { saved.current = null; } };
}
