/**
 * InventoryPrebuiltCard — Grid card for a prebuilt system in the admin inventory dashboard.
 * Styled to match the user-facing pre-builts page with Mantine UI primitives, identical
 * specs dropdown (Collapse + Paper), image canvas, and side-by-side admin action buttons.
 */
'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  Card,
  Text,
  Badge,
  Button,
  Group,
  Stack,
  Box,
  Collapse,
  ActionIcon,
  Paper,
} from '@mantine/core';
import { OptimizedImage } from './ui/optimized-image';
import { AddPrebuiltDialog, type AddPrebuiltFormSchema } from './add-prebuilt-dialog';
import { PrebuiltCardSpecs } from './prebuilt-card-specs';
import type { Part, PrebuiltSystem } from '@/lib/types';
import { formatCurrency, getOptimizedStorageUrl, cn } from '@/lib/utils';
import { getMissingParts } from '@/lib/prebuilt-utils';
import { useSiteSettings } from '@/context/site-settings-context';
import {
  Trash2,
  ChevronUp,
  ChevronDown,
  Archive,
  RotateCcw,
  Check,
  Edit3,
  ExternalLink,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface InventoryPrebuiltCardProps {
  system: PrebuiltSystem;
  parts: Part[];
  onDelete: (systemId: string) => void;
  onArchive: (systemId: string, isArchived: boolean) => void;
  onUpdate: (systemId: string, data: AddPrebuiltFormSchema) => Promise<void>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isSelected?: boolean;
  onToggleSelection?: (id: string) => void;
  isSelectionMode?: boolean;
  isSuperAdmin?: boolean;
  isArchiveView?: boolean;
}

export function InventoryPrebuiltCard({
  system,
  parts,
  onDelete,
  onArchive,
  onUpdate,
  isExpanded,
  onToggleExpand,
  isSelected = false,
  onToggleSelection = () => { },
  isSelectionMode = false,
  isSuperAdmin = false,
  isArchiveView = false,
}: InventoryPrebuiltCardProps) {
  const { shouldCorruptImages } = useSiteSettings();

  const missingParts = getMissingParts(system);
  const isComplete = missingParts.length === 0;

  // Resolve whether all essential components are currently in stock
  const isInStock = useMemo(() => {
    if (!isComplete || !parts || parts.length === 0) return true;
    const essentialKeys = ['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler'];
    const componentsRecord = system.components as Record<string, string | string[] | undefined>;
    for (const key of essentialKeys) {
      const partId = componentsRecord[key];
      const resolvedId = Array.isArray(partId) ? partId[0] : partId;
      if (!resolvedId) return false;
      const foundPart = parts.find((p) => p.id === resolvedId);
      if (!foundPart || foundPart.stock <= 0) return false;
    }
    return true;
  }, [system.components, isComplete, parts]);

  return (
    <div className="relative group/card-wrapper h-full">
      <Card
        withBorder
        radius="lg"
        padding={12}
        className={cn(
          "flex flex-col justify-between h-full relative group transition-all duration-300",
          "bg-white/80 dark:bg-[#141a23]/90 hover:shadow-md hover:-translate-y-1",
          "border-slate-200/80 dark:border-white/10 hover:border-cyan-500/40 dark:hover:border-cyan-500/40",
          isSelected && "border-cyan-500 border-2 shadow-cyan-500/20 bg-cyan-500/[0.03]"
        )}
        onClick={() => {
          if (isSelectionMode) {
            onToggleSelection(system.id);
          }
        }}
      >
        {/* Multi-select Checkmark (shown only when selected) */}
        {isSelected && (
          <div className="absolute top-3 left-3 z-30 p-1 rounded-md bg-cyan-600 text-white shadow-lg animate-in zoom-in-50 duration-200">
            <Check className="h-4 w-4 stroke-[3px]" />
          </div>
        )}

        {/* --- Top Content Stack --- */}
        <Stack gap="xs">
          {/* Header Row: Tier Badge on left, Stock Badge & Admin Actions on right */}
          <Group justify="space-between" align="center" wrap="nowrap">
            <Badge
              size="xs"
              variant="light"
              color={
                system.tier === "High-End" || system.tier === "Workstation"
                  ? "cyan"
                  : system.tier === "Mid-Range"
                    ? "blue"
                    : "gray"
              }
              radius="sm"
              className="font-medium uppercase tracking-wide"
            >
              {system.tier || "System"}
            </Badge>

            <Group gap={6} align="center" wrap="nowrap">
              {!isComplete ? (
                <Badge size="xs" variant="light" color="orange" radius="sm">
                  Incomplete
                </Badge>
              ) : isInStock ? (
                <Badge size="xs" variant="light" color="teal" radius="sm">
                  In Stock
                </Badge>
              ) : (
                <Badge size="xs" variant="light" color="red" radius="sm">
                  Out of Stock
                </Badge>
              )}

              {/* Archive / Restore Action */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="sm"
                    radius="md"
                    onClick={(e) => e.stopPropagation()}
                    title={isArchiveView ? "Restore" : "Archive"}
                    className="text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                  >
                    {isArchiveView ? <RotateCcw size={15} /> : <Archive size={15} />}
                  </ActionIcon>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {isArchiveView ? "Restore System?" : "Archive System?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {isArchiveView
                        ? `This will restore ${system.name} to the active showcase.`
                        : `This will move ${system.name} to the archive. It will no longer be visible to customers.`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchive(system.id, !isArchiveView);
                      }}
                      className={
                        isArchiveView
                          ? "bg-cyan-600 hover:bg-cyan-700"
                          : "bg-orange-500 hover:bg-orange-600"
                      }
                    >
                      {isArchiveView ? "Restore" : "Archive"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Super Admin Delete Action */}
              {isSuperAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      radius="md"
                      onClick={(e) => e.stopPropagation()}
                      title="Delete System"
                      className="text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={15} />
                    </ActionIcon>
                  </AlertDialogTrigger>
                  <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the prebuilt system: {system.name}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(system.id);
                        }}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </Group>
          </Group>

          {/* Clean Rounded Image Canvas */}
          <Box
            className={cn(
              "aspect-square relative -mx-3 w-auto overflow-hidden",
              "bg-white border-y border-slate-200"
            )}
          >
            <OptimizedImage
              src={getOptimizedStorageUrl(system.imageUrl, shouldCorruptImages) || "/placeholder-system.png"}
              alt={system.name}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-contain p-2"
            />
          </Box>

          {/* Title & Description below image */}
          <Stack gap={4}>
            <Text
              size="md"
              fw={700}
              lineClamp={2}
              className="leading-snug transition-colors group-hover:text-cyan-600 dark:group-hover:text-cyan-400 min-h-[2.5rem] text-slate-900 dark:text-slate-100"
              title={system.name}
            >
              {system.name}
            </Text>
            <Text
              size="xs"
              c="dimmed"
              lineClamp={2}
              className="min-h-[2rem] leading-relaxed text-slate-600 dark:text-slate-400"
            >
              {system.description}
            </Text>
          </Stack>

          {/* Collapsible Component Breakdown — Identical to user Prebuilts page */}
          <Collapse in={isExpanded}>
            <Paper
              withBorder
              radius="md"
              p="xs"
              mt="xs"
              className="bg-slate-50/70 dark:bg-white/[0.02] border-slate-200/60 dark:border-white/5"
            >
              <Text
                size="xs"
                fw={700}
                c="dimmed"
                tt="uppercase"
                className="tracking-wider mb-1.5 text-[10px]"
              >
                Component Breakdown
              </Text>
              <PrebuiltCardSpecs components={system.components} expanded={true} />
            </Paper>
          </Collapse>
        </Stack>

        {/* --- Bottom Price & Dual Action Area --- */}
        <Stack gap="xs" mt="md">
          {/* Price & Expand Chevron */}
          <Group justify="space-between" align="center">
            <Stack gap={0}>
              <Text
                size="xs"
                c="dimmed"
                tt="uppercase"
                fw={600}
                className="tracking-wider text-[10px]"
              >
                Total Price
              </Text>
              <Text
                size="lg"
                fw={700}
                className="text-slate-900 dark:text-slate-100 font-mono leading-none"
              >
                {formatCurrency(system.price)}
              </Text>
            </Stack>

            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              radius="md"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              title={isExpanded ? "Hide Specs" : "Show Specs"}
              className="text-slate-500 hover:text-cyan-500"
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </ActionIcon>
          </Group>

          {/* Side-by-side Action Buttons: Edit System & Launch Page */}
          <Group gap="xs" mt="xs" wrap="nowrap">
            <AddPrebuiltDialog
              initialData={system}
              parts={parts}
              onSave={(data) => onUpdate(system.id, data)}
            >
              <ActionIcon
                variant="light"
                color="cyan"
                size="lg"
                radius="md"
                aria-label="Edit system"
                title="Edit system"
                className="h-8 w-8 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <Edit3 size={14} />
              </ActionIcon>
            </AddPrebuiltDialog>

            <Button
              component={Link}
              href={`/pre-builts/${system.id}?from=admin`}
              variant="outline"
              color="gray"
              size="sm"
              radius="md"
              rightSection={<ExternalLink size={14} />}
              className="flex-1 font-headline font-bold text-xs uppercase tracking-wider h-8 border-slate-200 dark:border-white/10 hover:border-cyan-500/40 text-slate-700 dark:text-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              Launch Page
            </Button>
          </Group>
        </Stack>
      </Card>
    </div>
  );
}
