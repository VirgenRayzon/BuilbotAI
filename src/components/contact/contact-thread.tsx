"use client";

import { useMemo, useState, useRef, useEffect, type FormEvent } from 'react';
import { collection, orderBy, query } from 'firebase/firestore';
import { Alert, Button, Stack, Text, Textarea } from '@mantine/core';
import { Send } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useUserProfile } from '@/context/user-profile';
import { useToast } from '@/hooks/use-toast';
import type { ContactMessage } from '@/lib/contact-types';
import { cn } from '@/lib/utils';

function formatDate(value: unknown) {
  if (value instanceof Date) return value.toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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
  const bottomRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useMemo(() => {
    if (!firestore || !inquiryId) return null;
    return query(collection(firestore, 'contactInquiries', inquiryId, 'messages'), orderBy('createdAt', 'asc'));
  }, [firestore, inquiryId]);
  const { data: messages, loading } = useCollection<ContactMessage>(messagesQuery);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages?.length]);

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
      <div className="flex flex-col gap-3 max-h-[55vh] overflow-y-auto px-1 py-1">
        {loading && <Text size="sm" c="dimmed">Loading conversation…</Text>}
        {!loading && !messages?.length && <Text size="sm" c="dimmed">No messages in this conversation yet.</Text>}
        {(messages ?? []).map(message => {
          const isOutgoing = (authUser?.uid && message.senderId === authUser.uid) ||
            (isStaff ? message.senderType === 'staff' : message.senderType === 'customer');

          return (
            <div
              key={message.id}
              className={cn(
                "flex flex-col w-fit max-w-[85%] sm:max-w-[50%] rounded-2xl px-3.5 py-2.5 shadow-sm transition-all",
                isOutgoing
                  ? "self-end ml-auto bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-xs"
                  : "self-start mr-auto bg-slate-100 dark:bg-[#161d2a] text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-white/10 rounded-bl-xs"
              )}
            >
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={cn(
                    "text-xs font-bold leading-none",
                    isOutgoing ? "text-cyan-100" : "text-slate-700 dark:text-slate-200"
                  )}
                >
                  {isOutgoing ? "You" : message.senderName}
                </span>
                {!isOutgoing && message.senderType === 'staff' && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 px-1.5 py-0.5 rounded-full border border-cyan-500/30">
                    Support
                  </span>
                )}
                <span
                  className={cn(
                    "text-[10px]",
                    isOutgoing ? "text-cyan-200/70" : "text-slate-400 dark:text-slate-500"
                  )}
                >
                  {formatDate(message.createdAt)}
                </span>
              </div>
              <p
                className={cn(
                  "text-sm whitespace-pre-wrap break-words leading-relaxed m-0 font-normal",
                  isOutgoing ? "text-white" : "text-slate-800 dark:text-slate-200"
                )}
              >
                {message.body}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
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
