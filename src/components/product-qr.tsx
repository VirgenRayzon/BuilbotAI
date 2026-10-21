'use client';
import { useEffect, useState } from 'react';
import { Button, Group, Stack, Text } from '@mantine/core';
import { qrUrl } from '@/lib/product-identity';

export function ProductQR({ token, sku }: { token?: string; sku?: string }) {
  const [image, setImage] = useState('');
  const [error, setError] = useState('');
  const [attempt, retry] = useState(0);
  useEffect(() => {
    if (!token) return;
    let active = true;
    setError('');
    void import('qrcode').then(qr => qr.toDataURL(qrUrl(token, process.env.NEXT_PUBLIC_QR_ORIGIN || undefined), {
      width: 768, margin: 4, errorCorrectionLevel: 'M', color: { dark: '#000000ff', light: '#ffffffff' },
    })).then(url => { if (active) setImage(url); }).catch(() => { if (active) setError('Could not render QR. Please retry.'); });
    return () => { active = false; };
  }, [token, attempt]);
  if (!token || !sku) return <Text size="sm" c="dimmed">QR pending migration.</Text>;
  return <Stack gap="xs" align="flex-start">
    {image && <img src={image} width={192} height={192} alt={`QR for ${sku}`} className="rounded-lg bg-white" />}
    {error && <Text c="red" size="sm">{error}</Text>}
    <Group><Button component="a" href={image || undefined} download={`${sku}.png`} disabled={!image} mih={44}>Download QR</Button>
      {error && <Button variant="default" onClick={() => retry(v => v + 1)}>Retry QR</Button>}</Group>
  </Stack>;
}
