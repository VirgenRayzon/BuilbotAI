"use client";

import { Alert, Badge, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { MailQuestion, MessagesSquare } from "lucide-react";
import { ContactThread } from "@/components/contact/contact-thread";
import { CompactInfo } from "@/components/ui/compact-info";
import { useCustomerSupport } from "../hooks/use-customer-support";

export function CustomerSupportTab() {
  const inbox = useCustomerSupport();

  return (
    <div className="space-y-4 sm:space-y-6">
      <Paper withBorder radius="lg" p={12} shadow="sm" className="border-slate-200 bg-white dark:border-white/10 dark:bg-[#111722]">
        <Title order={3} className="flex items-center gap-2.5 font-headline text-xl font-bold text-slate-900 dark:text-white">
          <MailQuestion className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          <span>Contact Inbox</span>
          <CompactInfo message="View your support requests and continue conversations with the BuildbotAI team." />
        </Title>
      </Paper>

      {inbox.error && <Alert color="red" variant="light" title="Could not load conversations">Please refresh and try again.</Alert>}

      <div className="grid gap-4 xl:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.5fr)]">
        <Paper withBorder radius="lg" p={12} shadow="sm" className="border-slate-200 bg-white dark:border-white/10 dark:bg-[#111722]">
          <Group justify="space-between" mb="sm"><Text fw={700}>Your conversations</Text><Badge variant="light">{inbox.inquiries.length}</Badge></Group>
          <Stack gap="xs" className="max-h-[62vh] overflow-y-auto">
            {inbox.loading && <Text size="sm" c="dimmed">Loading your requests…</Text>}
            {!inbox.loading && !inbox.error && !inbox.inquiries.length && <Text size="sm" c="dimmed">You don’t have any support requests yet.</Text>}
            {inbox.inquiries.map((inquiry) => (
              <button
                key={inquiry.id}
                type="button"
                aria-pressed={inbox.selectedId === inquiry.id}
                onClick={() => inbox.selectInquiry(inquiry.id)}
                className={`min-h-11 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${inbox.selectedId === inquiry.id ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30" : "border-slate-200 hover:border-cyan-500/50 dark:border-white/10"}`}
              >
                <Group justify="space-between" gap="xs" wrap="nowrap">
                  <Text size="sm" fw={700} lineClamp={1}>{inquiry.subject}</Text>
                  <Badge size="xs" variant="light" color={inquiry.status === "open" ? "cyan" : "gray"}>{inquiry.status}</Badge>
                </Group>
                <Text size="xs" c="dimmed" mt={5} lineClamp={2}>{inquiry.lastMessagePreview}</Text>
              </button>
            ))}
          </Stack>
        </Paper>

        <Paper withBorder radius="lg" p={12} shadow="sm" className="min-h-[480px] border-slate-200 bg-white dark:border-white/10 dark:bg-[#111722]">
          {inbox.selectedInquiry ? (
            <Stack gap="md">
              <div>
                <Group gap="xs"><Title order={4}>{inbox.selectedInquiry.subject}</Title><Badge variant="light">{inbox.selectedInquiry.status}</Badge></Group>
                <Text size="sm" c="dimmed" mt={4}>This conversation and its updates are available only in BuildbotAI.</Text>
              </div>
              <ContactThread inquiryId={inbox.selectedInquiry.id} isStaff={false} />
            </Stack>
          ) : (
            <div className="flex min-h-[450px] flex-col items-center justify-center px-4 text-center">
              <MessagesSquare size={36} className="mb-3 text-cyan-500" />
              <Text fw={700}>Choose a conversation</Text>
              <Text size="sm" c="dimmed" mt={4}>Your messages with the support team will appear here.</Text>
            </div>
          )}
        </Paper>
      </div>
    </div>
  );
}
