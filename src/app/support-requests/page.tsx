"use client";

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, limit, orderBy, query, where } from 'firebase/firestore';
import { Badge, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { MailQuestion } from 'lucide-react';
import { RouteGuard } from '@/components/auth/route-guard';
import { ContactThread } from '@/components/contact/contact-thread';
import { useUserProfile } from '@/context/user-profile';
import { useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { ContactInquiry } from '@/lib/contact-types';

function SupportRequestsPage() {
  const firestore = useFirestore();
  const { authUser } = useUserProfile();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState(searchParams.get('inquiry') ?? '');

  useEffect(() => {
    const inquiryId = searchParams.get('inquiry');
    if (inquiryId) setSelectedId(inquiryId);
  }, [searchParams]);

  const inquiriesQuery = useMemo(() => {
    if (!firestore || !authUser) return null;
    return query(
      collection(firestore, 'contactInquiries'),
      where('userId', '==', authUser.uid),
      orderBy('lastMessageAt', 'desc'),
      limit(50)
    );
  }, [firestore, authUser]);
  const { data: inquiries, loading } = useCollection<ContactInquiry>(inquiriesQuery);
  const selectedInquiry = inquiries?.find(inquiry => inquiry.id === selectedId) ?? null;

  return (
    <RouteGuard requiredPermission="isRegisteredUser" fallbackPath="/signin">
      <main className="min-h-screen bg-slate-50 px-3 py-8 text-slate-900 dark:bg-[#0c0f14] dark:text-slate-100 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Group gap="sm" mb="lg"><MailQuestion className="text-cyan-500" /><div><Title order={1} size="h2">Support Requests</Title><Text size="sm" c="dimmed">View and continue conversations with BuildbotAI support. Replies and updates stay in the app.</Text></div></Group>
          <div className="grid gap-4 lg:grid-cols-[minmax(260px,0.75fr)_minmax(0,1.4fr)]">
            <Paper withBorder radius="lg" p="sm" className="border-slate-200 bg-white dark:border-white/10 dark:bg-[#111722]">
              <Text fw={700} mb="sm">Your conversations</Text>
              <Stack gap="xs">
                {loading && <Text size="sm" c="dimmed">Loading your requests…</Text>}
                {!loading && !inquiries?.length && <Text size="sm" c="dimmed">You don’t have any support requests yet.</Text>}
                {(inquiries ?? []).map(inquiry => (
                  <button key={inquiry.id} type="button" onClick={() => setSelectedId(inquiry.id)} className={`rounded-lg border p-3 text-left ${selectedId === inquiry.id ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30' : 'border-slate-200 hover:border-cyan-500/50 dark:border-white/10'}`}>
                    <Group justify="space-between" gap="xs"><Text size="sm" fw={700} lineClamp={1}>{inquiry.subject}</Text><Badge size="xs" variant="light" color={inquiry.status === 'open' ? 'cyan' : 'gray'}>{inquiry.status}</Badge></Group>
                    <Text size="xs" c="dimmed" mt={5} lineClamp={2}>{inquiry.lastMessagePreview}</Text>
                  </button>
                ))}
              </Stack>
            </Paper>
            <Paper withBorder radius="lg" p={{ base: 'sm', sm: 'md' }} className="min-h-[480px] border-slate-200 bg-white dark:border-white/10 dark:bg-[#111722]">
              {selectedInquiry ? (
                <Stack gap="md"><div><Group gap="xs"><Title order={2} size="h4">{selectedInquiry.subject}</Title><Badge variant="light">{selectedInquiry.status}</Badge></Group><Text size="sm" c="dimmed" mt={4}>This conversation and its updates are available only in BuildbotAI.</Text></div><ContactThread inquiryId={selectedInquiry.id} isStaff={false} /></Stack>
              ) : <div className="flex min-h-[440px] flex-col items-center justify-center text-center"><MailQuestion size={36} className="mb-3 text-cyan-500" /><Text fw={700}>Select a support request</Text><Text size="sm" c="dimmed" mt={4}>Your conversation will appear here.</Text></div>}
            </Paper>
          </div>
        </div>
      </main>
    </RouteGuard>
  );
}

export default SupportRequestsPage;
