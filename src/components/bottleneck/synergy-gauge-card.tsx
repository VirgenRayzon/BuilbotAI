"use client";

import React from "react";
import { Paper, Badge, Text, Group } from "@mantine/core";
import { motion } from "framer-motion";
import type { ComponentData, Resolution } from "@/lib/types";
import { calculateSynergyScore } from "@/lib/bottleneck";
import { cn } from "@/lib/utils";

interface SynergyGaugeCardProps {
  build: Record<string, ComponentData | ComponentData[] | null>;
  resolution: Resolution;
  compact?: boolean;
}

export function SynergyGaugeCard({ build, resolution, compact = false }: SynergyGaugeCardProps) {
  const result = calculateSynergyScore(build, resolution);

  const getStatusBadgeColor = (status: string, score: number) => {
    if (status === "Incomplete") return "red";
    if (score >= 80) return "teal";
    if (score >= 65) return "cyan";
    if (score >= 40) return "yellow";
    return "red";
  };

  return (
    <Paper
      radius="md"
      p={compact ? "xs" : "sm"}
      withBorder
      className="bg-slate-50/80 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 shadow-xs"
    >
      <Group justify="space-between" align="center" className={compact ? "mb-1.5" : "mb-2.5"}>
        <Text size="xs" fw={800} className="tracking-wider uppercase text-slate-800 dark:text-slate-200">
          Hardware Synergy
        </Text>
        <Badge
          color={getStatusBadgeColor(result.status, result.score)}
          variant={result.status === "Incomplete" ? "light" : "filled"}
          size="sm"
          radius="md"
          fw={700}
          className={cn(
            "tracking-wider text-[10px] uppercase font-bold",
            result.status === "Incomplete" &&
            "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30"
          )}
        >
          {result.status}
        </Badge>
      </Group>

      {/* Animated Progress Bar */}
      <div className="relative h-5 bg-slate-200/90 dark:bg-slate-800/90 rounded-full overflow-hidden border border-slate-300/80 dark:border-white/10 shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(result.score, 0)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 rounded-full"
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[11px] font-black tracking-wider font-mono text-slate-900 dark:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
            {result.score}
            <span className="text-[10px] font-medium opacity-80">/100</span>
          </span>
        </div>
      </div>
    </Paper>
  );
}
