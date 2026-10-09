"use client";

import React from "react";
import { Paper, Badge, Text, Group, ThemeIcon, Stack } from "@mantine/core";
import { Gauge, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ComponentData, Resolution } from "@/lib/types";
import { calculateBottleneck } from "@/lib/bottleneck";
import { cn } from "@/lib/utils";

interface BottleneckStatusCardProps {
  build: Record<string, ComponentData | ComponentData[] | null>;
  resolution: Resolution;
  compact?: boolean;
}

export function BottleneckStatusCard({ build, resolution, compact = false }: BottleneckStatusCardProps) {
  const result = calculateBottleneck(build, resolution);

  if (result.status === "Incomplete") {
    return (
      <Paper
        radius="md"
        p={compact ? "xs" : "sm"}
        withBorder
        className="bg-slate-50/80 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 shadow-xs"
      >
        <Group gap="xs" align="center">
          <ThemeIcon size="sm" variant="light" color="gray" radius="md">
            <Info size={14} className="text-slate-500 dark:text-slate-400" />
          </ThemeIcon>
          <Text size="xs" fw={500} className="text-slate-600 dark:text-slate-300">
            Add both a CPU and GPU to analyze bottleneck and balance.
          </Text>
        </Group>
      </Paper>
    );
  }

  const isBalanced = result.status === "Balanced";
  const isSevere = result.status.includes("Severe");
  const statusColor = isSevere ? "red" : isBalanced ? "teal" : "yellow";

  const cpu = build["CPU"] as ComponentData | null;
  const gpu = build["GPU"] as ComponentData | null;

  return (
    <Paper
      radius="md"
      p={compact ? "xs" : "sm"}
      withBorder
      className={cn(
        "transition-all relative overflow-hidden shadow-xs",
        isBalanced && "bg-teal-500/5 border-teal-500/30 dark:bg-teal-950/20 dark:border-teal-500/30",
        !isBalanced && !isSevere && "bg-amber-500/5 border-amber-500/30 dark:bg-amber-950/20 dark:border-amber-500/30",
        isSevere && "bg-red-500/5 border-red-500/30 dark:bg-red-950/20 dark:border-red-500/30"
      )}
    >
      <Stack gap={compact ? 4 : 6}>
        <Group justify="space-between" align="center">
          <Group gap={6} align="center">
            <ThemeIcon size="sm" radius="md" variant="light" color={statusColor}>
              {isBalanced ? <CheckCircle2 size={14} /> : isSevere ? <AlertTriangle size={14} /> : <Gauge size={14} />}
            </ThemeIcon>
            <Text
              size="xs"
              fw={800}
              className={cn(
                "tracking-wider uppercase",
                isSevere && "text-red-700 dark:text-red-400",
                isBalanced && "text-teal-700 dark:text-teal-300",
                !isBalanced && !isSevere && "text-amber-700 dark:text-amber-300"
              )}
            >
              {result.status}
            </Text>
          </Group>
          <Badge size="xs" radius="sm" color={statusColor} variant="light" fw={700}>
            {isBalanced ? "Optimal Pairing" : "Mismatch Alert"}
          </Badge>
        </Group>

        {cpu && gpu && (
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
            <span className="truncate">{cpu.model}</span>
            <span className="opacity-50">⚡</span>
            <span className="truncate">{gpu.model}</span>
          </div>
        )}

        <Text size="xs" fw={500} className="text-slate-700 dark:text-slate-300 leading-relaxed">
          {result.message}
        </Text>
      </Stack>
    </Paper>
  );
}
