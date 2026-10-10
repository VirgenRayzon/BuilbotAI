"use client";

import { useState } from "react";
import { Badge, Button, Group, Modal, Paper, ScrollArea, Text, ThemeIcon, Title } from "@mantine/core";
import { AlertTriangle, ShieldCheck, Sparkles } from "lucide-react";
import type { ComponentData } from "@/lib/types";
import { formatCurrency, cn } from "@/lib/utils";

const reviewCategories = ["Motherboard", "CPU", "GPU", "RAM", "Storage", "PSU", "Cooler", "Case", "Monitor", "Keyboard", "Mouse", "Headset"];

const UNIFIED_MODAL_CLASSNAMES = {
  content: "bg-white/95 dark:bg-[#141a23]/95 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-xl rounded-xl overflow-hidden",
  header: "bg-white/95 dark:bg-[#141a23]/95 border-b border-slate-200/80 dark:border-white/10 p-3",
  body: "!p-3",
  close: "text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors",
};

interface BuildActionFooterProps {
  build: Record<string, ComponentData | ComponentData[] | null>;
  totalPrice: number;
  selectedParts: number;
  missingCategories: string[];
  isManagerMode: boolean;
  isAiPending: boolean;
  isCheckingOut: boolean;
  analysis?: unknown;
  onCategorySelect?: (category: string) => void;
  onAnalyze: () => void;
  onReserve: (onSuccess: () => void) => void;
  onAddPrebuilt: () => void;
}

export function BuildActionFooter({
  build, totalPrice, selectedParts, missingCategories, isManagerMode,
  isAiPending, isCheckingOut, analysis,
  onCategorySelect, onAnalyze, onReserve, onAddPrebuilt,
}: BuildActionFooterProps) {
  const [reserveOpen, setReserveOpen] = useState(false);
  const complete = missingCategories.length === 0;

  return (
    <div className="p-3 space-y-2.5">
      {!complete && (
        <Paper
          withBorder
          radius="md"
          p={12}
          className="bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/25 shadow-xs"
        >
          <Group gap="xs" align="center" className="mb-1">
            <ThemeIcon size="sm" radius="sm" color="yellow" variant="light">
              <AlertTriangle size={14} />
            </ThemeIcon>
            <Text size="xs" fw={700} className="font-headline uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Incomplete Configuration
            </Text>
          </Group>
          <Text size="xs" className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Complete the remaining {missingCategories.length} core {missingCategories.length === 1 ? "part" : "parts"} before {isManagerMode ? "saving this prebuilt" : "reserving"}:
          </Text>
          <Group gap="xs" mt="xs" wrap="wrap">
            {missingCategories.map((category) => (
              <Badge
                key={category}
                component="button"
                onClick={() => onCategorySelect?.(category)}
                variant="light"
                color="yellow"
                size="sm"
                radius="sm"
                className="cursor-pointer hover:scale-105 active:scale-95 transition-transform font-semibold normal-case"
              >
                + {category}
              </Badge>
            ))}
          </Group>
        </Paper>
      )}

      {isManagerMode ? (
        <Button
          fullWidth
          size="md"
          radius="md"
          color="cyan"
          leftSection={<Sparkles size={17} />}
          disabled={!complete || isAiPending}
          loading={isAiPending}
          onClick={onAddPrebuilt}
          className="font-headline font-bold text-xs uppercase tracking-wider shadow-sm shadow-cyan-500/20"
        >
          Add New Prebuilt
        </Button>
      ) : (
        <>
          <Button
            fullWidth
            size="md"
            radius="md"
            color="teal"
            leftSection={<ShieldCheck size={18} />}
            disabled={!complete}
            onClick={() => setReserveOpen(true)}
            className={cn(
              "font-headline font-bold text-xs uppercase tracking-wider transition-all duration-200",
              complete
                ? "shadow-md shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99]"
                : "opacity-60 cursor-not-allowed"
            )}
          >
            Reserve Build
          </Button>
          <Button
            fullWidth
            size="md"
            radius="md"
            variant="light"
            color="cyan"
            leftSection={<Sparkles size={17} />}
            disabled={!complete}
            onClick={onAnalyze}
            className={cn(
              "font-headline font-bold text-xs uppercase tracking-wider border border-cyan-500/30 dark:border-cyan-400/20 transition-all duration-200",
              complete
                ? "hover:border-cyan-500/50 hover:scale-[1.01] active:scale-[0.99] shadow-xs"
                : "opacity-60 cursor-not-allowed"
            )}
          >
            {analysis ? "Refresh Analysis" : "Analyze Build"}
          </Button>
        </>
      )}

      {/* Confirm Reservation Modal */}
      <Modal
        opened={reserveOpen}
        onClose={() => setReserveOpen(false)}
        size="lg"
        radius="lg"
        centered
        overlayProps={{ backgroundOpacity: 0.65, blur: 5 }}
        title={
          <Group gap="sm">
            <ThemeIcon size="lg" color="teal" variant="light" radius="md" className="shadow-xs">
              <ShieldCheck size={20} />
            </ThemeIcon>
            <div>
              <Title order={4} className="font-headline text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                Confirm Reservation
              </Title>
              <Text size="xs" c="dimmed">
                Review your hardware setup before locking in your reservation.
              </Text>
            </div>
          </Group>
        }
        classNames={UNIFIED_MODAL_CLASSNAMES}
      >
        <div className="space-y-4">
          {/* Scrollable Parts List with Mantine themed scrollbar */}
          <Paper withBorder radius="md" className="overflow-hidden border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01]">
            <div className="px-4 py-2.5 bg-slate-100/70 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 flex justify-between items-center text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span>Component</span>
              <span>Price</span>
            </div>
            <ScrollArea.Autosize mah={260} type="auto" offsetScrollbars scrollbarSize={6} className="divide-y divide-slate-100 dark:divide-white/5">
              {reviewCategories.flatMap((category) => {
                const value = build[category];
                const parts = Array.isArray(value) ? value : value ? [value] : [];
                return parts.map((part, index) => (
                  <div
                    key={`${category}-${index}`}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-slate-100/60 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Badge size="xs" variant="light" color="cyan" radius="sm" fw={700} className="shrink-0 uppercase text-[9px] font-mono tracking-wider">
                        {category}
                      </Badge>
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                        {part.model}
                      </span>
                    </div>
                    <span className="shrink-0 font-mono text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {formatCurrency(part.price || 0)}
                    </span>
                  </div>
                ));
              })}
            </ScrollArea.Autosize>
          </Paper>

          {/* Pricing & Reservation Summary */}
          <Paper withBorder radius="md" p="md" className="bg-slate-50/80 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 shadow-xs">
            <Group justify="space-between" align="center">
              <div>
                <Text size="xs" fw={700} className="font-headline uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Reservation Value
                </Text>
                <Text size="xs" c="dimmed">
                  {selectedParts} parts verified for reservation
                </Text>
              </div>
              <Text fw={900} className="font-headline text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatCurrency(totalPrice)}
              </Text>
            </Group>
          </Paper>

          <Text size="xs" c="dimmed" className="leading-relaxed">
            Reservations hold selected inventory for pickup or store checkout. No immediate online charge is processed until verified at the counter.
          </Text>

          <Group justify="flex-end" gap="sm" mt="md" pt="sm" className="border-t border-slate-100 dark:border-white/5">
            <Button
              variant="default"
              size="sm"
              radius="md"
              onClick={() => setReserveOpen(false)}
              className="font-medium text-xs border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-all active:scale-[0.98]"
            >
              Cancel
            </Button>
            <Button
              color="teal"
              size="sm"
              radius="md"
              loading={isCheckingOut}
              leftSection={<ShieldCheck size={16} />}
              onClick={() => onReserve(() => setReserveOpen(false))}
              className="font-headline font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              Confirm Reservation
            </Button>
          </Group>
        </div>
      </Modal>
    </div>
  );
}


