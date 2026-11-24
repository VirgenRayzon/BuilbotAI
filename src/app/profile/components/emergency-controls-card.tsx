"use client";

import React from "react";
import { Paper, Title, Text, Group, Stack, Badge, Switch, Alert, ThemeIcon } from "@mantine/core";
import { ServerCrash, PlugZap, BrainCircuit, ShieldAlert, AlertTriangle, WandSparkles } from "lucide-react";

interface EmergencyControlsCardProps {
  emergency: {
    isMaintenanceMode: boolean;
    handleToggleMaintenance: () => void;
    isStorageKillSwitch: boolean;
    handleToggleStorageKillSwitch: () => void;
    isAiKillSwitch: boolean;
    handleToggleAiKillSwitch: () => void;
    isLiveBuilderRecommendationsEnabled: boolean;
    handleToggleLiveBuilderRecommendations: () => void;
  };
}

export function EmergencyControlsCard({ emergency }: EmergencyControlsCardProps) {
  const isAnyActive =
    emergency.isMaintenanceMode ||
    emergency.isStorageKillSwitch ||
    emergency.isAiKillSwitch;

  return (
    <Paper
      withBorder
      radius="lg"
      p={12}
      className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm transition-all duration-300"
    >
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <ThemeIcon
              size="md"
              radius="md"
              color={isAnyActive ? "red" : "gray"}
              variant={isAnyActive ? "filled" : "light"}
            >
              <ShieldAlert size={18} />
            </ThemeIcon>
            <div>
              <Title order={4} className="text-base font-bold font-headline text-slate-900 dark:text-slate-100">
                System Safeguards
              </Title>
              <Text size="xs" className="text-slate-600 dark:text-slate-400">
                Emergency kill switches & platform controls
              </Text>
            </div>
          </Group>

          <Badge
            color={isAnyActive ? "red" : "teal"}
            variant="filled"
            size="sm"
            className="uppercase tracking-wider font-bold"
          >
            {isAnyActive ? "ALERT ACTIVE" : "ALL SYSTEMS OK"}
          </Badge>
        </Group>

        {isAnyActive && (
          <Alert
            color="red"
            variant="light"
            radius="md"
            icon={<AlertTriangle size={16} />}
            title="Active Operational Constraints"
            className="border border-red-500/30 text-xs"
          >
            One or more emergency overrides are currently engaged. Normal client operations may be restricted.
          </Alert>
        )}

        <Stack gap="sm">
          <Paper
            p="sm"
            radius="lg"
            withBorder
            className={`transition-colors ${
              emergency.isMaintenanceMode
                ? "bg-red-50/80 dark:bg-red-950/20 border-red-300 dark:border-red-500/30"
                : "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-white/5"
            }`}
          >
            <Group justify="space-between" wrap="nowrap">
              <Group gap="sm" wrap="nowrap">
                <ThemeIcon
                  size="sm"
                  radius="md"
                  color={emergency.isMaintenanceMode ? "red" : "gray"}
                  variant={emergency.isMaintenanceMode ? "filled" : "light"}
                >
                  <ServerCrash size={14} />
                </ThemeIcon>
                <div>
                  <Text size="sm" fw={700} className="text-slate-900 dark:text-slate-100">
                    Maintenance Mode
                  </Text>
                  <Text size="xs" className="text-slate-600 dark:text-slate-400">
                    Lock public access to builders and shopping
                  </Text>
                </div>
              </Group>
              <Switch
                checked={emergency.isMaintenanceMode}
                onChange={emergency.handleToggleMaintenance}
                color="red"
                size="md"
                aria-label="Toggle Maintenance Mode"
              />
            </Group>
          </Paper>

          <Paper
            p="sm"
            radius="lg"
            withBorder
            className={`transition-colors ${
              emergency.isStorageKillSwitch
                ? "bg-amber-50/80 dark:bg-amber-950/20 border-amber-300 dark:border-amber-500/30"
                : "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-white/5"
            }`}
          >
            <Group justify="space-between" wrap="nowrap">
              <Group gap="sm" wrap="nowrap">
                <ThemeIcon
                  size="sm"
                  radius="md"
                  color={emergency.isStorageKillSwitch ? "orange" : "gray"}
                  variant={emergency.isStorageKillSwitch ? "filled" : "light"}
                >
                  <PlugZap size={14} />
                </ThemeIcon>
                <div>
                  <Text size="sm" fw={700} className="text-slate-900 dark:text-slate-100">
                    Chaos Mode (Storage)
                  </Text>
                  <Text size="xs" className="text-slate-600 dark:text-slate-400">
                    Simulate storage fallback & CDN outages
                  </Text>
                </div>
              </Group>
              <Switch
                checked={emergency.isStorageKillSwitch}
                onChange={emergency.handleToggleStorageKillSwitch}
                color="orange"
                size="md"
                aria-label="Toggle Storage Kill Switch"
              />
            </Group>
          </Paper>

          <Paper
            p="sm"
            radius="lg"
            withBorder
            className={`transition-colors ${
              emergency.isAiKillSwitch
                ? "bg-rose-50/80 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/30"
                : "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-white/5"
            }`}
          >
            <Group justify="space-between" wrap="nowrap">
              <Group gap="sm" wrap="nowrap">
                <ThemeIcon
                  size="sm"
                  radius="md"
                  color={emergency.isAiKillSwitch ? "rose" : "gray"}
                  variant={emergency.isAiKillSwitch ? "filled" : "light"}
                >
                  <BrainCircuit size={14} />
                </ThemeIcon>
                <div>
                  <Text size="sm" fw={700} className="text-slate-900 dark:text-slate-100">
                    AI Kill Switch
                  </Text>
                  <Text size="xs" className="text-slate-600 dark:text-slate-400">
                    Halt Genkit advisor & bot inferencing
                  </Text>
                </div>
              </Group>
              <Switch
                checked={emergency.isAiKillSwitch}
                onChange={emergency.handleToggleAiKillSwitch}
                color="red"
                size="md"
                aria-label="Toggle AI Kill Switch"
              />
            </Group>
          </Paper>

          <Paper
            p="sm"
            radius="lg"
            withBorder
            className={`transition-colors ${
              emergency.isLiveBuilderRecommendationsEnabled
                ? "bg-yellow-50/80 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-500/30"
                : "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-white/5"
            }`}
          >
            <Group justify="space-between" wrap="nowrap">
              <Group gap="sm" wrap="nowrap">
                <ThemeIcon
                  size="sm"
                  radius="md"
                  color={emergency.isLiveBuilderRecommendationsEnabled ? "yellow" : "gray"}
                  variant={emergency.isLiveBuilderRecommendationsEnabled ? "filled" : "light"}
                >
                  <WandSparkles size={14} />
                </ThemeIcon>
                <div>
                  <Group gap={6} align="center">
                    <Text size="sm" fw={700} className="text-slate-900 dark:text-slate-100">
                      Live Builder Recommendations
                    </Text>
                    <Badge size="xs" variant="light" color="yellow" radius="sm" className="uppercase text-[9px] font-bold">
                      Preview
                    </Badge>
                  </Group>
                  <Text size="xs" className="text-slate-600 dark:text-slate-400">
                    Highlight a best match and best value catalog part in both builders
                  </Text>
                </div>
              </Group>
              <Switch
                checked={emergency.isLiveBuilderRecommendationsEnabled}
                onChange={emergency.handleToggleLiveBuilderRecommendations}
                color="yellow"
                size="md"
                aria-label="Toggle Live Builder Recommendations"
              />
            </Group>
          </Paper>
        </Stack>
      </Stack>
    </Paper>
  );
}
