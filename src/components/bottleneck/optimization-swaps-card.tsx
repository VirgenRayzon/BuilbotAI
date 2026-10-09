"use client";

import React from "react";
import { Paper, Text, Group, ThemeIcon, Button } from "@mantine/core";
import { Sparkles, ArrowRight, Zap } from "lucide-react";

interface OptimizationSwapsCardProps {
  analysis?: any;
  onApplySuggestion?: (category: string, partId: string) => void;
}

export function OptimizationSwapsCard({
  analysis,
  onApplySuggestion,
}: OptimizationSwapsCardProps) {
  if (!analysis?.suggestions || analysis.suggestions.length === 0) {
    return null;
  }

  return (
    <Paper
      radius="md"
      p="sm"
      withBorder
      className="bg-cyan-50/50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-500/30 shadow-xs space-y-2.5"
    >
      <Group gap={6} align="center">
        <ThemeIcon size="xs" variant="transparent" color="cyan">
          <Sparkles size={14} className="text-cyan-600 dark:text-cyan-400" />
        </ThemeIcon>
        <Text size="xs" fw={800} className="text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">
          Suggested Optimizations
        </Text>
      </Group>

      <div className="space-y-2">
        {analysis.suggestions.map((suggestion: any, idx: number) => (
          <Paper
            key={idx}
            radius="sm"
            p="xs"
            withBorder
            className="bg-white/90 dark:bg-slate-900/70 border-cyan-500/20 shadow-xs"
          >
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 line-through truncate max-w-[120px]">
                    {suggestion.originalComponent}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                  <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400 truncate max-w-[140px]">
                    {suggestion.suggestedComponent}
                  </span>
                </div>
                {suggestion.suggestedPartId && onApplySuggestion && (
                  <Button
                    size="compact-xs"
                    variant="light"
                    color="cyan"
                    radius="md"
                    className="text-[10px] font-bold uppercase"
                    leftSection={<Zap size={11} />}
                    onClick={() => onApplySuggestion("", suggestion.suggestedPartId)}
                  >
                    Swap
                  </Button>
                )}
              </div>
              <Text size="11px" className="text-slate-600 dark:text-slate-300 italic leading-snug">
                "{suggestion.reason}"
              </Text>
            </div>
          </Paper>
        ))}
      </div>
    </Paper>
  );
}
