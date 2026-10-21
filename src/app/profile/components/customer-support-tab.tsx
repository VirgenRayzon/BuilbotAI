"use client";

import { useState } from "react";
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { MailQuestion, MessagesSquare, Plus, Trash2 } from "lucide-react";
import { ContactThread } from "@/components/contact/contact-thread";
import { CompactInfo } from "@/components/ui/compact-info";
import { useUserProfile } from "@/context/user-profile";
import { useToast } from "@/hooks/use-toast";
import type { ContactInquiry } from "@/lib/contact-types";
import { useCustomerSupport } from "../hooks/use-customer-support";
import { ComposeInquiryModal } from "./compose-inquiry-modal";

export function CustomerSupportTab() {
  const inbox = useCustomerSupport();
  const { authUser } = useUserProfile();
  const { toast } = useToast();

  const [composeOpen, setComposeOpen] = useState(false);
  const [inquiryToDelete, setInquiryToDelete] = useState<ContactInquiry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleConfirmDelete = async () => {
    if (!inquiryToDelete || !authUser) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const token = await authUser.getIdToken();
      const response = await fetch("/api/contact/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inquiryId: inquiryToDelete.id }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to delete conversation.");
      }
      toast({
        title: "Conversation deleted",
        description: "The conversation was permanently removed.",
      });
      if (inbox.selectedId === inquiryToDelete.id) {
        inbox.selectInquiry("");
      }
      setInquiryToDelete(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete conversation."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Paper withBorder radius="lg" p={12} shadow="sm" className="border-slate-200 bg-white dark:border-white/10 dark:bg-[#111722]">
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Title order={3} className="flex items-center gap-2.5 font-headline text-xl font-bold text-slate-900 dark:text-white">
            <MailQuestion className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            <span>Contact Inbox</span>
            <CompactInfo message="View your support requests and continue conversations with the BuildbotAI team." />
          </Title>
          <Button
            color="cyan"
            leftSection={<Plus size={16} />}
            onClick={() => setComposeOpen(true)}
          >
            New Inquiry
          </Button>
        </Group>
      </Paper>

      {inbox.error && <Alert color="red" variant="light" title="Could not load conversations">Please refresh and try again.</Alert>}

      <div className="grid gap-4 xl:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.5fr)]">
        <Paper withBorder radius="lg" p={12} shadow="sm" className="border-slate-200 bg-white dark:border-white/10 dark:bg-[#111722]">
          <Group justify="space-between" mb="sm">
            <Group gap="xs">
              <Text fw={700}>Your conversations</Text>
              <Badge variant="light">{inbox.inquiries.length}</Badge>
            </Group>
            <Button
              size="xs"
              variant="light"
              color="cyan"
              leftSection={<Plus size={14} />}
              onClick={() => setComposeOpen(true)}
            >
              Compose
            </Button>
          </Group>
          <Stack gap="xs" className="max-h-[62vh] overflow-y-auto">
            {inbox.loading && <Text size="sm" c="dimmed">Loading your requests…</Text>}
            {!inbox.loading && !inbox.error && !inbox.inquiries.length && (
              <div className="py-6 text-center space-y-3">
                <Text size="sm" c="dimmed">You don’t have any support requests yet.</Text>
                <Button
                  size="xs"
                  variant="light"
                  color="cyan"
                  leftSection={<Plus size={14} />}
                  onClick={() => setComposeOpen(true)}
                >
                  Start a Conversation
                </Button>
              </div>
            )}
            {inbox.inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className={`group relative flex items-center rounded-lg border transition-colors ${
                  inbox.selectedId === inquiry.id
                    ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30"
                    : "border-slate-200 hover:border-cyan-500/50 dark:border-white/10"
                }`}
              >
                <button
                  type="button"
                  aria-pressed={inbox.selectedId === inquiry.id}
                  onClick={() => inbox.selectInquiry(inquiry.id)}
                  className="min-h-11 flex-1 p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-lg min-w-0"
                >
                  <Group justify="space-between" gap="xs" wrap="nowrap" pr="xs">
                    <Text size="sm" fw={700} lineClamp={1}>{inquiry.subject}</Text>
                    <Badge size="xs" variant="light" color={inquiry.status === "open" ? "cyan" : "gray"}>{inquiry.status}</Badge>
                  </Group>
                  <Text size="xs" c="dimmed" mt={5} lineClamp={2}>{inquiry.lastMessagePreview}</Text>
                </button>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="sm"
                  className="mr-2.5 opacity-60 hover:opacity-100 hover:bg-red-500/10 transition-all shrink-0"
                  title="Delete conversation"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInquiryToDelete(inquiry);
                  }}
                >
                  <Trash2 size={15} />
                </ActionIcon>
              </div>
            ))}
          </Stack>
        </Paper>

        <Paper withBorder radius="lg" p={12} shadow="sm" className="min-h-[480px] border-slate-200 bg-white dark:border-white/10 dark:bg-[#111722]">
          {inbox.selectedInquiry ? (
            <Stack gap="md">
              <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
                <div>
                  <Group gap="xs">
                    <Title order={4}>{inbox.selectedInquiry.subject}</Title>
                    <Badge variant="light" color={inbox.selectedInquiry.status === "open" ? "cyan" : "gray"}>
                      {inbox.selectedInquiry.status}
                    </Badge>
                  </Group>
                  <Text size="sm" c="dimmed" mt={4}>
                    This conversation and its updates are available only in BuildbotAI.
                  </Text>
                </div>
                <Button
                  variant="subtle"
                  color="red"
                  size="xs"
                  leftSection={<Trash2 size={15} />}
                  onClick={() => setInquiryToDelete(inbox.selectedInquiry)}
                >
                  Delete Conversation
                </Button>
              </Group>
              <ContactThread inquiryId={inbox.selectedInquiry.id} isStaff={false} />
            </Stack>
          ) : (
            <div className="flex min-h-[450px] flex-col items-center justify-center px-4 text-center">
              <MessagesSquare size={36} className="mb-3 text-cyan-500" />
              <Text fw={700}>Choose a conversation</Text>
              <Text size="sm" c="dimmed" mt={4}>Your messages with the support team will appear here.</Text>
              <Button
                mt="md"
                variant="light"
                color="cyan"
                leftSection={<Plus size={15} />}
                onClick={() => setComposeOpen(true)}
              >
                New Inquiry
              </Button>
            </div>
          )}
        </Paper>
      </div>

      <ComposeInquiryModal
        opened={composeOpen}
        onClose={() => setComposeOpen(false)}
        onInquiryCreated={(inquiryId) => inbox.selectInquiry(inquiryId)}
      />

      <Modal
        opened={Boolean(inquiryToDelete)}
        onClose={() => !deleting && setInquiryToDelete(null)}
        title={
          <Group gap="xs">
            <Trash2 className="h-5 w-5 text-red-500" />
            <Text fw={700} size="md">
              Delete Conversation?
            </Text>
          </Group>
        }
        centered
        radius="lg"
        size="sm"
        classNames={{
          header: "p-4 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#111722]",
          body: "!p-4 !pt-4 bg-white dark:bg-[#111722]",
        }}
      >
        <Stack gap="md" className="pt-2">
          <Text size="sm" c="dimmed" className="leading-relaxed">
            Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-200">“{inquiryToDelete?.subject}”</strong>? This will permanently remove this conversation and all its messages. This action cannot be undone.
          </Text>

          {deleteError && (
            <Alert color="red" variant="light" title="Deletion failed">
              {deleteError}
            </Alert>
          )}

          <Group justify="flex-end" gap="sm">
            <Button
              variant="subtle"
              color="gray"
              disabled={deleting}
              onClick={() => setInquiryToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              color="red"
              loading={deleting}
              leftSection={<Trash2 size={15} />}
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
