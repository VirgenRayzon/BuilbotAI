'use client';
import { use } from 'react';
import Link from 'next/link';
import { Button, Container, Group, Loader, Paper, Stack, Text, Title } from '@mantine/core';
import { useQRResolver } from '@/hooks/use-qr-resolver';

export default function QRPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { failure, recovering, retry, signInAgain } = useQRResolver(token);
  return <Container size="sm" py="xl"><Paper withBorder radius="lg" p="lg"><Stack align="center">
    {failure ? <><Title order={1} size="h3">QR unavailable</Title><Text role="alert">{failure.message}</Text><Group justify="center">
      {failure.code === 'AUTH_EXPIRED' && <Button onClick={signInAgain} loading={recovering} mih={44}>Sign in again</Button>}
      {['SERVICE_UNAVAILABLE', 'RATE_LIMITED'].includes(failure.code) && <Button onClick={retry} mih={44}>Retry</Button>}
      <Button component={Link} href="/parts" variant="default" mih={44}>Browse products</Button>
    </Group></> : <><Loader/><Text role="status">Opening product…</Text></>}
  </Stack></Paper></Container>;
}
