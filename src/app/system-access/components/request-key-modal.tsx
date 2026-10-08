"use client";

import React from "react";
import {
  Modal,
  Title,
  Text,
  Stack,
  Group,
  TextInput,
  Button,
  ThemeIcon,
  Alert,
} from "@mantine/core";
import { Key, Mail, Send, AlertCircle } from "lucide-react";

interface RequestKeyModalProps {
  opened: boolean;
  onClose: () => void;
  email: string;
  setEmail: (val: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export function RequestKeyModal({
  opened,
  onClose,
  email,
  setEmail,
  onSubmit,
  loading,
}: RequestKeyModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      radius="lg"
      centered
      overlayProps={{
        backgroundOpacity: 0.65,
        blur: 4,
      }}
      title={
        <Group gap="sm">
          <ThemeIcon size="md" radius="md" color="red" variant="light">
            <Key size={18} />
          </ThemeIcon>
          <div>
            <Title order={4} className="text-base font-bold font-headline uppercase tracking-tight text-slate-900 dark:text-slate-100">
              Request Manager Key
            </Title>
            <Text size="xs" className="text-slate-500 dark:text-slate-400">
              Send an authorization ticket to the Super Admin
            </Text>
          </div>
        </Group>
      }
      classNames={{
        content: "bg-white dark:bg-[#111722] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-2xl rounded-2xl overflow-hidden",
        header: "bg-white dark:bg-[#111722] border-b border-slate-200 dark:border-white/10 px-6 py-4",
        body: "!px-6 !pt-5 !pb-6",
        close: "text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors",
      }}
    >
      <Stack gap="md">
        <Text size="xs" className="text-slate-600 dark:text-slate-300 leading-relaxed">
          Misplaced or lost your manager access token? Provide your registered administrative email address below. A system access key request will be registered in the central audit ledger for Super Admin review.
        </Text>

        <div>
          <Text size="xs" fw={700} className="uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Email Address
          </Text>
          <TextInput
            type="email"
            placeholder="admin@buildbotai.com"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            leftSection={<Mail size={16} className="text-slate-400" />}
            radius="md"
            size="md"
            classNames={{
              input: "bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-medium focus:border-red-500",
            }}
          />
        </div>

        <Group justify="flex-end" gap="xs" mt="sm">
          <Button
            variant="subtle"
            color="gray"
            size="sm"
            radius="md"
            onClick={onClose}
            disabled={loading}
            className="text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            color="red"
            size="sm"
            radius="md"
            onClick={onSubmit}
            loading={loading}
            disabled={!email || !email.includes("@")}
            leftSection={<Send size={14} />}
            className="text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-red-600/20"
          >
            Send Request
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
