"use client";

import React from "react";
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  TextInput,
  PasswordInput,
  Button,
  ThemeIcon,
  Badge,
} from "@mantine/core";
import { User as UserIcon, Mail, Key, Shield, Check, X, Edit3, Loader2 } from "lucide-react";

interface AccountDetailsProps {
  profile: any;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  name: string;
  setName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  isSaving: boolean;
  handleSaveProfile: () => void;
  superAdminKey: string;
  setSuperAdminKey: (val: string) => void;
  originalSuperAdminKey: string;
  isSavingKey: boolean;
  handleSaveSuperAdminKey: () => void;
}

export function AccountDetails({
  profile,
  isEditing,
  setIsEditing,
  name,
  setName,
  email,
  setEmail,
  isSaving,
  handleSaveProfile,
  superAdminKey,
  setSuperAdminKey,
  originalSuperAdminKey,
  isSavingKey,
  handleSaveSuperAdminKey,
}: AccountDetailsProps) {
  return (
    <Paper
      withBorder
      radius="lg"
      p={12}
      className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm transition-all"
    >
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <ThemeIcon size="md" radius="md" color="cyan" variant="light">
              <UserIcon size={18} />
            </ThemeIcon>
            <div>
              <Title order={4} className="text-base font-bold font-headline text-slate-900 dark:text-slate-100">
                Profile & Credentials
              </Title>
              <Text size="xs" className="text-slate-600 dark:text-slate-400">
                Personal identity and authentication info
              </Text>
            </div>
          </Group>

          <Button
            size="xs"
            variant={isEditing ? "subtle" : "light"}
            color={isEditing ? "gray" : "cyan"}
            onClick={() => setIsEditing(!isEditing)}
            leftSection={isEditing ? <X size={14} /> : <Edit3 size={14} />}
            className="font-bold uppercase tracking-wider text-[11px]"
          >
            {isEditing ? "Cancel" : "Edit"}
          </Button>
        </Group>

        <Stack gap="sm">
          {/* Full Name */}
          <div>
            <Text size="xs" fw={700} className="uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </Text>
            <TextInput
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              disabled={!isEditing}
              leftSection={<UserIcon size={16} className="text-slate-500 dark:text-slate-400" />}
              placeholder="Your full name"
              radius="md"
              classNames={{
                input:
                  "bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-medium disabled:opacity-80 disabled:cursor-not-allowed",
              }}
            />
          </div>

          {/* Email */}
          <div>
            <Text size="xs" fw={700} className="uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Contact Email
            </Text>
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              disabled={!isEditing}
              leftSection={<Mail size={16} className="text-slate-500 dark:text-slate-400" />}
              placeholder="name@example.com"
              radius="md"
              classNames={{
                input:
                  "bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-medium disabled:opacity-80 disabled:cursor-not-allowed",
              }}
            />
          </div>

          {/* Super Admin Key (Privileged Only) */}
          {profile?.isSuperAdmin && (
            <div className="pt-2 border-t border-slate-200 dark:border-white/10">
              <Group justify="space-between" mb={4}>
                <Text size="xs" fw={700} className="uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Key size={14} className="text-cyan-600 dark:text-cyan-400" /> Super Admin Key
                </Text>
                <Badge size="xs" color="indigo" variant="light" className="font-bold">
                  PRIVILEGED
                </Badge>
              </Group>
              <Group gap="xs" wrap="nowrap">
                <PasswordInput
                  value={superAdminKey}
                  onChange={(e) => setSuperAdminKey(e.currentTarget.value)}
                  disabled={!isEditing}
                  placeholder="Master key token"
                  radius="md"
                  className="flex-1"
                  classNames={{
                    input:
                      "bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-mono text-xs",
                  }}
                />
                {isEditing && (
                  <Button
                    size="sm"
                    color="indigo"
                    radius="md"
                    onClick={handleSaveSuperAdminKey}
                    disabled={isSavingKey || superAdminKey === originalSuperAdminKey}
                    loading={isSavingKey}
                    className="font-bold text-xs"
                  >
                    Save Key
                  </Button>
                )}
              </Group>
            </div>
          )}

          {isEditing && (
            <Button
              color="cyan"
              radius="md"
              fullWidth
              mt="xs"
              onClick={handleSaveProfile}
              loading={isSaving}
              leftSection={<Check size={16} />}
              className="font-bold uppercase tracking-wider text-xs shadow-md shadow-cyan-500/10"
            >
              Save Profile Changes
            </Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
