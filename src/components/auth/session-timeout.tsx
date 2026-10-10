'use client';

import React from 'react';
import {
  Modal,
  Title,
  Text,
  Stack,
  Group,
  Button,
  ThemeIcon,
  Progress,
  Paper,
} from '@mantine/core';
import { Clock, ShieldAlert, LogOut, CheckCircle2 } from 'lucide-react';
import { useIdleTimeout } from '@/hooks/use-idle-timeout';
import { useAdminSessionGuard } from '@/hooks/use-admin-session-guard';

export function SessionTimeout() {
  // Enforces administrative tab/window close logout
  useAdminSessionGuard();

  // Core inactivity and heartbeat synchronization
  const {
    showWarning,
    secondsRemaining,
    totalWarningSeconds,
    isStaff,
    stayLoggedIn,
    logout,
  } = useIdleTimeout();

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  const progressPercent = Math.max(
    0,
    Math.min(100, (secondsRemaining / (totalWarningSeconds || 1)) * 100)
  );

  return (
    <Modal
      opened={showWarning}
      onClose={stayLoggedIn}
      radius="lg"
      centered
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      overlayProps={{
        backgroundOpacity: 0.75,
        blur: 5,
      }}
      title={
        <Group gap="sm">
          <ThemeIcon
            size="md"
            radius="md"
            color={isStaff ? 'red' : 'cyan'}
            variant="light"
          >
            {isStaff ? <ShieldAlert size={18} /> : <Clock size={18} />}
          </ThemeIcon>
          <div>
            <Title
              order={4}
              className="text-base font-bold font-headline uppercase tracking-tight text-slate-900 dark:text-slate-100"
            >
              Session Timeout Warning
            </Title>
            <Text size="xs" className="text-slate-500 dark:text-slate-400">
              Inactivity detected on this workstation
            </Text>
          </div>
        </Group>
      }
      classNames={{
        content: "bg-white/95 dark:bg-[#141a23]/95 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-xl rounded-xl overflow-hidden",
        header: "bg-white/95 dark:bg-[#141a23]/95 border-b border-slate-200/80 dark:border-white/10 p-3",
        body: "!p-3",
        close: "text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors",
      }}
    >
      <Stack gap="md">
        <Text size="xs" className="text-slate-600 dark:text-slate-300 leading-relaxed">
          {isStaff
            ? 'For security compliance, administrative sessions automatically terminate after 15 minutes of inactivity.'
            : 'To protect your account and active builds, your session will automatically expire due to inactivity.'}
        </Text>

        {/* Live Countdown Surface */}
        <Paper
          withBorder
          radius="md"
          p="md"
          className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 text-center"
        >
          <Text size="xs" fw={700} className="uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
            Automatic Logout In
          </Text>
          <div className="font-mono text-3xl font-extrabold tracking-wider text-slate-900 dark:text-white my-1">
            {formattedTime}
          </div>
          <Text size="xs" className="text-slate-400 dark:text-slate-500 mb-3">
            {secondsRemaining} seconds remaining
          </Text>

          <Progress
            value={progressPercent}
            color={progressPercent < 25 ? 'red' : isStaff ? 'red' : 'cyan'}
            size="sm"
            radius="xl"
            animated
            className="transition-all duration-300"
          />
        </Paper>

        {/* Actions */}
        <Group justify="space-between" gap="xs" mt="sm">
          <Button
            variant="subtle"
            color="gray"
            size="sm"
            radius="md"
            onClick={logout}
            leftSection={<LogOut size={14} />}
            className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-red-500"
          >
            Log Out Now
          </Button>

          <Button
            color={isStaff ? 'red' : 'cyan'}
            size="sm"
            radius="md"
            onClick={stayLoggedIn}
            leftSection={<CheckCircle2 size={15} />}
            className="text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-cyan-600/20"
          >
            Stay Signed In
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
