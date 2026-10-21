"use client";

import { useMemo, useState, type FormEvent } from 'react';
import { collection, orderBy, query } from 'firebase/firestore';
import { Alert, Button, Paper, Stack, Text, Textarea } from '@mantine/core';
import { Send } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useUserProfile } from '@/context/user-profile';
import { useToast } from '@/hooks/use-toast';
import type { ContactMessage } from '@/lib/contact-types';

function formatDate(value: unknown) {
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().toLocaleString();
  }
  return 'Just now';
}

export function ContactThread({
  inquiryId,
  isStaff,
  canReply = true,
}: {
  inquiryId: string;
  isStaff: boolean;
  canReply?: boolean;
}) {
  const firestore = useFirestore();
  const { authUser } = useUserProfile();
  const { toast } = useToast();
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const messagesQuery = useMemo(() => {
    if (!firestore || !inquiryId) return null;
    return query(collection(firestore, 'contactInquiries', inquiryId, 'messages'), orderBy('createdAt', 'asc'));
  }, [firestore, inquiryId]);
  const { data: messages, loading } = useCollection<ContactMessage>(messagesQuery);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authUser || !reply.trim()) return;
    setSending(true);
    setError('');
    try {
      const token = await authUser.getIdToken();
      const response = await fetch('/api/contact/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ inquiryId, body: reply }),
      });
      const result = await response.json() as { success?: boolean; error?: string };
      if (!response.ok || !result.success) throw new Error(result.error || 'Your reply could not be saved.');
      setReply('');
      toast({ title: 'Reply sent', description: 'Your reply was added to the BuildbotAI conversation.' });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Your reply could not be sent.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Stack gap="md">
      <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
        {loading && <Text size="sm" c="dimmed">Loading conversation…</Text>}
        {!loading && !messages?.length && <Text size="sm" c="dimmed">No messages in this conversation yet.</Text>}
        {(messages ?? []).map(message => (
          <Paper key={message.id} withBorder radius="lg" p="sm" className={message.senderType === 'staff' ? 'ml-4 border-cyan-500/30 bg-cyan-50/70 dark:bg-cyan-950/20' : 'mr-4 bg-slate-50 dark:bg-white/5'}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <Text size="sm" fw={700}>{message.senderName}</Text>
              <Text size="xs" c="dimmed">{formatDate(message.createdAt)}</Text>
            </div>
            <Text size="sm" className="whitespace-pre-wrap break-words">{message.body}</Text>
          </Paper>
        ))}
      </div>

      {canReply && (
        <form onSubmit={handleSubmit}>
          <Stack gap="sm">
            {error && <Alert color="red" variant="light" title="Reply status">{error}</Alert>}
            <Textarea
              label={isStaff ? 'Reply to customer' : 'Your reply'}
              description={isStaff ? 'Your reply is saved here. Signed-in customers can read it from their Profile contact inbox.' : 'Your reply will be saved to this BuildbotAI conversation.'}
              placeholder="Write your message…"
              value={reply}
              onChange={event => setReply(event.currentTarget.value)}
              minRows={3}
              maxLength={5000}
              required
            />
            <Button type="submit" loading={sending} disabled={!reply.trim()} leftSection={<Send size={16} />} className="self-end">
              Send Reply
            </Button>
          </Stack>
        </form>
      )}
    </Stack>
  );
}
