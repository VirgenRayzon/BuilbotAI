'use client';

import React from 'react';
import { Modal, Stack, Text, Title, Alert, PasswordInput, Button } from '@mantine/core';
import { Key, AlertCircle } from 'lucide-react';

interface VerifyManagerKeyModalProps {
  opened: boolean;
  onClose: () => void;
  userEmail: string | null;
  managerKey: string;
  onManagerKeyChange: (value: string) => void;
  error: string | null;
  loading: boolean;
  onSubmit: () => void;
}

export function VerifyManagerKeyModal({
  opened,
  onClose,
  userEmail,
  managerKey,
  onManagerKeyChange,
  error,
  loading,
  onSubmit,
}: VerifyManagerKeyModalProps) {
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
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
            <Key size={18} />
          </div>
          <div>
            <Title
              order={4}
              className="text-base font-bold font-headline uppercase tracking-tight text-slate-900 dark:text-slate-100"
            >
              Verify Manager Key
            </Title>
            <Text size="xs" className="text-slate-500 dark:text-slate-400">
              {userEmail}
            </Text>
          </div>
        </div>
      }
      classNames={{
        content:
          'bg-white/95 dark:bg-[#141a23]/95 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-xl rounded-xl overflow-hidden',
        header:
          'bg-white/95 dark:bg-[#141a23]/95 border-b border-slate-200/80 dark:border-white/10 p-3',
        body: '!p-3',
        close:
          'text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors',
      }}
    >
      <Stack gap="md">
        <Text size="xs" className="text-slate-600 dark:text-slate-300 leading-relaxed">
          Google authentication was successful. To complete your manager onboarding, enter your
          assigned default manager access key below.
        </Text>

        {error && (
          <Alert
            color="red"
            variant="light"
            radius="md"
            icon={<AlertCircle size={16} />}
            title="Key Verification Error"
            className="text-xs"
          >
            {error}
          </Alert>
        )}

        <div>
          <Text
            size="xs"
            fw={700}
            className="uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Default Manager Access Key
          </Text>
          <PasswordInput
            placeholder="Enter manager key"
            autoComplete="one-time-code"
            value={managerKey}
            onChange={(e) => onManagerKeyChange(e.currentTarget.value)}
            leftSection={<Key size={16} className="text-slate-400" />}
            radius="md"
            size="md"
            classNames={{
              input:
                'min-h-[44px] bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-mono focus:border-red-500',
            }}
          />
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <Button
            variant="subtle"
            color="gray"
            size="sm"
            radius="md"
            onClick={onClose}
            disabled={loading}
            className="text-xs font-semibold min-h-[44px]"
          >
            Cancel
          </Button>
          <Button
            color="red"
            size="sm"
            radius="md"
            onClick={onSubmit}
            loading={loading}
            disabled={!managerKey.trim()}
            className="text-xs font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20 min-h-[44px]"
          >
            Confirm & Complete
          </Button>
        </div>
      </Stack>
    </Modal>
  );
}

