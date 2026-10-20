"use client";

import { Alert, Badge, Button, Group, Paper, SegmentedControl, Stack, Text, Title } from "@mantine/core";
import { Inbox, MailCheck, MessageCircle, MessagesSquare, RefreshCw } from "lucide-react";
import { ContactThread } from "@/components/contact/contact-thread";
import { CompactInfo } from "@/components/ui/compact-info";
import type { ContactInquiry } from "@/lib/contact-types";
import { CONTACT_EMAIL_ENABLED } from "@/lib/contact-config";
import { useContactInbox, type ContactInboxFilter } from "../hooks/use-contact-inbox";

function formatDate(value: unknown) {
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === "object" && value !== null && "toDate" in value && typeof value.toDate === "function") return value.toDate().toLocaleString();
  return "Just now";
}

function InquiryButton({ inquiry, selected, unread, onSelect }: { inquiry: ContactInquiry; selected: boolean; unread: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} aria-pressed={selected} className={`min-h-11 w-full rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${selected ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30" : "border-slate-200 hover:border-cyan-500/50 dark:border-white/10 dark:hover:border-cyan-500/40"}`}>
      <div className="flex items-start justify-between gap-2">
        <Text size="sm" fw={unread ? 800 : 600} lineClamp={1}>{inquiry.subject}</Text>
        {unread && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-500" aria-label="Unread inquiry" />}
      </div>
      <Text size="xs" c="dimmed" mt={4}>{inquiry.fullName} · {inquiry.email}</Text>
      <Text size="xs" mt={6} lineClamp={2}>{inquiry.lastMessagePreview}</Text>
      <Text size="xs" c="dimmed" mt={6}>{formatDate(inquiry.lastMessageAt)}</Text>
    </button>
  );
}

export function ContactInboxTab() {
  const inbox = useContactInbox();

  return (
    <div className="space-y-4 sm:space-y-6">
      <Paper withBorder radius="lg" p={12} shadow="sm" className="border-slate-200 bg-white dark:border-white/10 dark:bg-[#111722]">
        <Group justify="space-between" align="center" wrap="wrap">
          <Title order={3} className="flex items-center gap-2.5 font-headline text-xl font-bold text-slate-900 dark:text-white">
            <MessageCircle className="h-5 w-5 text-cyan-600 dark:text-cyan-400" /><span>Contact Inbox</span>
            <CompactInfo message="Review support requests and continue conversations with signed-in customers." />
          </Title>
          {CONTACT_EMAIL_ENABLED && inbox.profile?.isSuperAdmin && (
            <Group gap="xs">
              <Button variant="light" leftSection={<MailCheck size={16} />} loading={inbox.gmailBusy} onClick={() => void inbox.runGmailAction("/api/contact/gmail/oauth/start")}>Authorize Gmail</Button>
              <Button variant="default" leftSection={<RefreshCw size={16} />} loading={inbox.gmailBusy} onClick={() => void inbox.runGmailAction("/api/contact/gmail/renew")}>Renew Gmail Watch</Button>
            </Group>
          )}
        </Group>
      </Paper>

      <Alert color="blue" variant="light" title="In-app support">Signed-in customers can read and reply through Support Requests. Guest inquiries are submit-only and visible to staff.</Alert>
      {inbox.error && <Alert color="red" variant="light" title="Could not complete action">{inbox.error}</Alert>}

      <div className="grid gap-4 xl:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.5fr)]">
        <Paper withBorder radius="lg" p={12} shadow="sm" className="border-slate-200 bg-white dark:border-white/10 dark:bg-[#111722]">
          <Group justify="space-between" mb="sm"><Group gap="xs"><Inbox size={18} /><Text fw={700}>Inquiries</Text></Group><Badge variant="light">{inbox.visibleInquiries.length}</Badge></Group>
          <SegmentedControl fullWidth value={inbox.filter} onChange={(value) => inbox.setFilter(value as ContactInboxFilter)} data={[{ label: "Open", value: "open" }, { label: "Resolved", value: "resolved" }, { label: "All", value: "all" }]} mb="sm" />
          <div className="max-h-[62vh] space-y-2 overflow-y-auto">
            {inbox.loading && <Text size="sm" c="dimmed" p="sm">Loading inquiries…</Text>}
            {!inbox.loading && !inbox.visibleInquiries.length && <Text size="sm" c="dimmed" p="sm">No inquiries in this view.</Text>}
            {inbox.visibleInquiries.map((inquiry) => <InquiryButton key={inquiry.id} inquiry={inquiry} selected={inbox.selectedId === inquiry.id} unread={Boolean(inbox.profile && !inquiry.readBy?.includes(inbox.profile.id))} onSelect={() => void inbox.selectInquiry(inquiry)} />)}
          </div>
        </Paper>

        <Paper withBorder radius="lg" p={12} shadow="sm" className="min-h-[480px] border-slate-200 bg-white dark:border-white/10 dark:bg-[#111722]">
          {!inbox.selectedInquiry ? (
            <div className="flex min-h-[450px] flex-col items-center justify-center px-4 text-center">
              <MessagesSquare size={36} className="mb-3 text-cyan-500" /><Text fw={700}>Choose an inquiry</Text><Text size="sm" c="dimmed" mt={4}>The complete conversation will appear here.</Text>
            </div>
          ) : (
            <Stack gap="md">
              <Group justify="space-between" align="flex-start" wrap="wrap">
                <div className="min-w-0">
                  <Group gap="xs"><Title order={4}>{inbox.selectedInquiry.subject}</Title><Badge color={inbox.selectedInquiry.status === "open" ? "cyan" : "gray"} variant="light">{inbox.selectedInquiry.status}</Badge></Group>
                  <Text size="sm" c="dimmed" mt={5}>{inbox.selectedInquiry.fullName} · {inbox.selectedInquiry.email}</Text>
                  <Text size="xs" c="dimmed" mt={3}>Received {formatDate(inbox.selectedInquiry.createdAt)} · {inbox.selectedInquiry.userId ? "BuildbotAI account" : "Guest"}</Text>
                </div>
                <Button className="min-h-11" variant="light" color={inbox.selectedInquiry.status === "open" ? "gray" : "cyan"} loading={inbox.updating} onClick={() => void inbox.updateStatus()}>{inbox.selectedInquiry.status === "open" ? "Mark Resolved" : "Reopen"}</Button>
              </Group>
              {!inbox.selectedInquiry.userId && <Alert color="yellow" variant="light" title="Guest inquiry">This guest cannot view replies in BuildbotAI. Ask them to sign in and submit a new request for an ongoing conversation.</Alert>}
              <ContactThread inquiryId={inbox.selectedInquiry.id} isStaff canReply={Boolean(inbox.selectedInquiry.userId)} />
            </Stack>
          )}
        </Paper>
      </div>
    </div>
  );
}
