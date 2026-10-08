"use client";

import React from "react";
import { Badge, Group, Progress, Text, ThemeIcon } from "@mantine/core";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface PowerMeterProps {
  value: number;
  max: number;
  className?: string;
}

export function PowerMeter({ value, max, className }: PowerMeterProps) {
  const hasPsu = max > 0;
  const maxToUse = hasPsu ? max : 0;
  const percentage = hasPsu ? Math.min((value / maxToUse) * 100, 100) : (value > 0 ? 100 : 0);

  const getStatus = () => {
    if (!hasPsu && value > 0) return { label: "Missing PSU", color: "red" as const };
    if (percentage > 90) return { label: "Critical Load", color: "red" as const };
    if (percentage > 70) return { label: "High Load", color: "yellow" as const };
    return { label: "Optimal", color: "teal" as const };
  };

  const status = getStatus();
  const progressColor = !hasPsu && value > 0 ? "red" : percentage > 90 ? "red" : percentage > 70 ? "yellow" : "cyan";

  return (
    <div className={cn("space-y-2.5 mb-3", className)}>
      <Group justify="space-between" align="baseline">
        <Group gap={6} align="center">
          <ThemeIcon size={20} radius="sm" variant="light" color={status.color}>
            <Zap size={12} />
          </ThemeIcon>
          <Text size="xs" fw={800} className="font-headline uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300">
            Power Load
          </Text>
        </Group>
        <Text fw={700} className="font-headline tabular-nums text-slate-900 dark:text-white text-base">
          {value}W
          <span className="text-slate-400 dark:text-slate-500 font-mono text-xs font-normal ml-1.5">
            / {maxToUse}W
          </span>
        </Text>
      </Group>

      <Progress
        value={percentage}
        color={progressColor}
        size="sm"
        radius="xl"
        className="bg-slate-100 dark:bg-white/10"
        animated={percentage > 90}
      />

      <Group justify="space-between" align="center" className="pt-0.5">
        <Badge
          size="xs"
          variant="light"
          color={status.color}
          radius="sm"
          fw={700}
          className="uppercase tracking-wider font-mono text-[10px]"
        >
          {status.label}
        </Badge>
        <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
          {Math.round(percentage)}%
        </span>
      </Group>
    </div>
  );
}
