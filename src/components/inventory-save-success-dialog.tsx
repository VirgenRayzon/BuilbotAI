"use client";

import { Button, Group, Modal, Stack, Text, ThemeIcon } from "@mantine/core";
import { ExternalLink, PackageCheck, Zap } from "lucide-react";

interface InventorySaveSuccessDialogProps {
  itemType: "component" | "system";
  name: string;
  seconds: number;
  url?: string;
  onClose: () => void;
}

export function InventorySaveSuccessDialog({
  itemType,
  name,
  seconds,
  url,
  onClose,
}: InventorySaveSuccessDialogProps) {
  const title = itemType === "component" ? "Component added" : "System added";
  const viewLabel = itemType === "component" ? "View item" : "View system";

  return (
    <Modal
      opened
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon size="md" color="cyan" variant="light" radius="md">
            <PackageCheck size={16} />
          </ThemeIcon>
          <Text fw={700} className="font-headline text-base uppercase tracking-tight text-slate-900 dark:text-white">
            {title}
          </Text>
        </Group>
      }
      centered
      radius="lg"
      size="sm"
      overlayProps={{ backgroundOpacity: 0.65, blur: 5 }}
      classNames={{
        content: "overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 text-slate-900 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-[#141a23]/95 dark:text-slate-100",
        header: "border-b border-slate-200/80 bg-white/95 p-3 dark:border-white/10 dark:bg-[#141a23]/95",
        body: "!p-3",
        close: "text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-white",
      }}
    >
      <Stack gap="md" className="pt-1">
        <Text size="sm" className="leading-relaxed text-slate-600 dark:text-slate-300">
          <Text component="span" inherit fw={700} className="text-slate-800 dark:text-slate-100">
            {name}
          </Text>{" "}
          was successfully added to the inventory.
        </Text>

        <Group justify="space-between" gap="xs" wrap="nowrap">
          <Text size="xs" fw={600} className="text-slate-500 dark:text-slate-400">
            Save completed
          </Text>
          <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Zap className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" aria-hidden="true" />
            <span>{seconds.toFixed(1)}s turnaround</span>
          </div>
        </Group>

        <Group justify="flex-end" gap="xs" pt="xs">
          {url && (
            <Button
              variant="default"
              size="sm"
              radius="md"
              className="border-slate-200 hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/5"
              onClick={() => window.location.assign(url)}
            >
              {viewLabel}
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          )}
          <Button size="sm" radius="md" color="cyan" className="text-xs font-bold uppercase tracking-wider" onClick={onClose}>
            Done
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
