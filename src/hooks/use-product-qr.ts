'use client';
import { useEffect, useState } from 'react';
import { qrUrl } from '@/lib/product-identity';

export function useProductQR(token?: string, sku?: string) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; image: string; url: string; error: string } | null>(null);
  const key = JSON.stringify([token, sku, attempt]);
  useEffect(() => {
    if (!token || !sku) return;
    let active = true;
    void (async () => {
      try {
        const url = qrUrl(token, process.env.NEXT_PUBLIC_QR_ORIGIN || undefined);
        const qr = await import('qrcode');
        const image = await qr.toDataURL(url, { width: 768, margin: 4, errorCorrectionLevel: 'M', color: { dark: '#000000ff', light: '#ffffffff' } });
        if (active) setResult({ key, image, url, error: '' });
      } catch {
        if (active) setResult({ key, image: '', url: '', error: 'Could not render QR. Please retry.' });
      }
    })();
    return () => { active = false; };
  }, [token, sku, key]);
  // Match on render, before effect cleanup: never expose another product's image.
  const current = result?.key === key ? result : null;
  return { image: current?.image || '', url: current?.url || '', error: current?.error || '', retry: () => setAttempt(value => value + 1) };
}
