'use client';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Container, Loader, Paper, Stack, Text, Title } from '@mantine/core';
import { useUserProfile } from '@/context/user-profile';

export default function QRPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { authUser, profile, loading } = useUserProfile();
  const router = useRouter();
  const [error, setError] = useState('');
  useEffect(() => {
    if (loading) return;
    if (authUser && (profile?.isManager || profile?.isSuperAdmin) && sessionStorage.getItem('buildbot_admin_session_active') !== authUser.uid) {
      router.replace(`/system-access?returnTo=${encodeURIComponent(`/q/${token}`)}`);
      return;
    }
    const controller = new AbortController();
    void (async () => {
      try {
        const headers: Record<string, string> = {};
        if (authUser) headers.Authorization = `Bearer ${await authUser.getIdToken()}`;
        const response = await fetch(`/api/qr/${encodeURIComponent(token)}`, { headers, cache: 'no-store', signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not open this QR code.');
        if (typeof data.destination !== 'string' || !/^\/(admin\?|parts\/PRD-|pre-builts\/PRD-)/.test(data.destination)) throw new Error('Invalid QR destination.');
        router.replace(data.destination);
      } catch (err) { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Could not open this QR code.'); }
    })();
    return () => controller.abort();
  }, [loading, authUser, profile, token, router]);
  return <Container size="sm" py="xl"><Paper withBorder radius="lg" p="lg"><Stack align="center">
    {error ? <><Title order={1} size="h3">QR unavailable</Title><Text>{error}</Text><Button component={Link} href="/parts">Browse products</Button></> : <><Loader/><Text>Opening product…</Text></>}
  </Stack></Paper></Container>;
}
