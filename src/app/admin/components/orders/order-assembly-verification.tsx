"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Wrench,
} from 'lucide-react';
import {
  Badge,
  Button,
  Checkbox,
  Collapse,
  Group,
  Paper,
  Text,
  TextInput,
} from '@mantine/core';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { resolveOrderItemImageUrl } from '@/lib/order-image-resolver';
import { getOrderItemLineId, type RigVerificationStatus } from '@/lib/order-assembly';
import type { Order, OrderItem, Part } from '@/lib/types';
import { useOrderAssembly } from '../../hooks/use-order-assembly';
import { cn, formatCurrency, getOptimizedStorageUrl } from '@/lib/utils';

interface OrderAssemblyVerificationProps {
  order: Order;
  rigId: string;
  rigName: string;
  items: OrderItem[];
  isArchived?: boolean;
  catalogParts?: Part[] | null;
  onStatusChange?: (status: RigVerificationStatus) => void;
}

export function OrderAssemblyVerification({
  order,
  rigId,
  rigName,
  items,
  isArchived = false,
  catalogParts,
  onStatusChange,
}: OrderAssemblyVerificationProps) {
  const isDelivered =
    order.fulfillmentStage === 'delivered' || order.status === 'finished building';
  const isCancelled = order.status === 'cancelled';
  const readOnly = isArchived || isCancelled || isDelivered;

  const { verification, loading, saving, error, updateStep } = useOrderAssembly(
    order.id,
    rigId,
    rigName,
    items,
    true
  );

  const [showPickingDetails, setShowPickingDetails] = useState(true);
  const [assemblyNotes, setAssemblyNotes] = useState('');
  const [testingNotes, setTestingNotes] = useState('');
  const [qcNotes, setQcNotes] = useState('');

  const itemByLineId = useMemo(() => {
    const map = new Map<string, OrderItem>();
    items.forEach((it, idx) => {
      const lid = it.lineId || getOrderItemLineId(it, idx, rigId);
      map.set(lid, it);
    });
    return map;
  }, [items, rigId]);

  useEffect(() => {
    if (verification?.assembly?.notes && !assemblyNotes) {
      setAssemblyNotes(verification.assembly.notes);
    }
    if (verification?.testing?.notes && !testingNotes) {
      setTestingNotes(verification.testing.notes);
    }
    if (verification?.qc?.notes && !qcNotes) {
      setQcNotes(verification.qc.notes);
    }
  }, [
    verification?.assembly?.notes,
    verification?.testing?.notes,
    verification?.qc?.notes,
    assemblyNotes,
    testingNotes,
    qcNotes,
  ]);

  useEffect(() => {
    if (verification?.status) {
      onStatusChange?.(verification.status);
    }
  }, [verification?.status, onStatusChange]);

  const handleTogglePickItem = useCallback(
    async (lineId: string, currentVal: boolean) => {
      if (readOnly || !verification) return;
      const currentPicked = verification.picking.items
        .filter((it) => it.picked)
        .map((it) => it.lineId);
      const nextPicked = currentVal
        ? currentPicked.filter((id) => id !== lineId)
        : [...currentPicked, lineId];

      await updateStep('picking', { pickedLineIds: nextPicked });
    },
    [readOnly, verification, updateStep]
  );

  const handleToggleAllPickItems = useCallback(
    async (pickAll: boolean) => {
      if (readOnly || !verification) return;
      const allIds = verification.picking.items.map((it) => it.lineId);
      await updateStep('picking', {
        pickedLineIds: pickAll ? allIds : [],
      });
    },
    [readOnly, verification, updateStep]
  );

  if (loading && !verification) {
    return (
      <Paper withBorder radius="md" p="sm" className="space-y-2 bg-slate-50/50 dark:bg-white/[0.02]">
        <Text size="xs" c="dimmed">
          Loading custom rig verification records...
        </Text>
      </Paper>
    );
  }

  if (!verification) return null;

  const totalParts = verification.picking.items.length;
  const pickedCount = verification.picking.items.filter((i) => i.picked).length;
  const isPickingComplete = verification.picking.completed;
  const isAssemblyComplete = verification.assembly.completed;
  const isTestingPassed = verification.testing.completed && verification.testing.passed;
  const isTestingFailed = verification.testing.completed && verification.testing.passed === false;
  const isQcPassed = verification.qc.completed && verification.qc.passed;
  const isQcFailed = verification.qc.completed && verification.qc.passed === false;

  const isAllPassed = verification.status === 'passed';

  return (
    <div className="space-y-3 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 dark:border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <Text fw={700} size="sm" className="font-headline text-slate-800 dark:text-slate-200">
            Rig Assembly Verification & Testing
          </Text>
          {rigName && (
            <Badge size="xs" variant="outline" color="cyan">
              {rigName}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isAllPassed ? (
            <Badge size="xs" color="teal" variant="light" leftSection={<CheckCircle2 className="h-3 w-3" />}>
              ASSEMBLY PASSED
            </Badge>
          ) : verification.status === 'failed' ? (
            <Badge size="xs" color="red" variant="light" leftSection={<AlertCircle className="h-3 w-3" />}>
              VERIFICATION FAILED
            </Badge>
          ) : (
            <Badge size="xs" color="gray" variant="light">
              IN PROGRESS
            </Badge>
          )}
        </div>
      </div>

      {error && (
        <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-900/50">
          {error}
        </div>
      )}

      <div data-testid="assembly-workflow" className="divide-y divide-slate-200/80 text-xs dark:divide-white/10">
        <div className="py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 dark:bg-white/10 font-mono text-[10px] font-bold">
                1
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Component Picking
              </span>
            </div>

            <Group gap="xs">
              <Badge data-testid="assembly-step-status" size="xs" variant="light" color={isPickingComplete ? 'teal' : 'gray'}>
                {pickedCount} / {totalParts} Picked
              </Badge>
              {!readOnly && (
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color="cyan"
                  onClick={() => handleToggleAllPickItems(!isPickingComplete)}
                >
                  {isPickingComplete ? 'Unpick All' : 'Pick All Components'}
                </Button>
              )}
              <Button
                size="compact-xs"
                variant="subtle"
                color="gray"
                rightSection={
                  <ChevronDown
                    className={cn('h-3.5 w-3.5 transition-transform duration-200', showPickingDetails && 'rotate-180')}
                  />
                }
                onClick={() => setShowPickingDetails((prev) => !prev)}
              >
                {showPickingDetails ? 'Hide details' : 'Expand picking details'}
              </Button>
            </Group>
          </div>

          <Collapse in={showPickingDetails}>
            <div className="mt-2.5 bg-slate-50/50 dark:bg-white/[0.01] overflow-hidden">
              <div className="divide-y divide-slate-200/70 dark:divide-white/5">
                {verification.picking.items.map((pickItem) => {
                  const orderItem =
                    itemByLineId.get(pickItem.lineId) ||
                    items.find(
                      (it) => (it.productId || it.id) === pickItem.partId
                    );
                  const qty =
                    orderItem?.quantity && orderItem.quantity > 0
                      ? orderItem.quantity
                      : 1;
                  const lineTotal = orderItem
                    ? (orderItem.lineTotal ?? orderItem.price * qty)
                    : null;
                  const rawImg = orderItem
                    ? resolveOrderItemImageUrl(
                        orderItem,
                        order.items || [],
                        catalogParts
                      )
                    : null;
                  const resolvedImg = rawImg
                    ? getOptimizedStorageUrl(rawImg) || rawImg
                    : null;

                  return (
                    <div
                      key={pickItem.lineId}
                      className="p-2.5 sm:p-3 px-3.5 sm:px-4 flex justify-between items-center text-sm transition-colors gap-3 hover:bg-slate-100/60 dark:hover:bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Checkbox
                          size="xs"
                          disabled={readOnly || saving}
                          checked={pickItem.picked}
                          onChange={() =>
                            handleTogglePickItem(pickItem.lineId, pickItem.picked)
                          }
                          aria-label={`Pick ${pickItem.name}`}
                        />

                        {resolvedImg ? (
                          <div data-testid="assembly-product-image" className="relative h-11 w-11 sm:h-12 sm:w-12 shrink-0 overflow-hidden bg-white dark:bg-[#0e131d]">
                            <OptimizedImage
                              src={resolvedImg}
                              alt={pickItem.name}
                              fill
                              sizes="48px"
                              className="object-contain p-1"
                            />
                          </div>
                        ) : null}

                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">
                            {pickItem.category || (orderItem as any)?.category || 'Component'}
                          </span>
                          <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate max-w-[200px] sm:max-w-md lg:max-w-lg">
                            {pickItem.name}
                            {qty > 1 && (
                              <span className="ml-1.5 text-xs font-mono text-cyan-600 dark:text-cyan-400">
                                ×{qty}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {lineTotal !== null && (
                        <span className="font-mono font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 shrink-0">
                          {formatCurrency(lineTotal)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Collapse>
        </div>

        <div
          className={cn(
            'py-2.5',
            !isPickingComplete && 'opacity-60'
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 dark:bg-white/10 font-mono text-[10px] font-bold">
                2
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Physical Assembly
              </span>
            </div>

            <Group gap="xs">
              <Badge data-testid="assembly-step-status" size="xs" variant="light" color={isAssemblyComplete ? 'teal' : 'gray'}>
                {isAssemblyComplete ? 'Completed' : 'Pending'}
              </Badge>
              {!readOnly && (
                <Checkbox
                  size="xs"
                  disabled={!isPickingComplete || saving}
                  checked={isAssemblyComplete}
                  onChange={(e) =>
                    void updateStep('assembly', {
                      completed: e.currentTarget.checked,
                      notes: assemblyNotes || verification.assembly.notes || undefined,
                    })
                  }
                  label="Assembly Finished"
                />
              )}
            </Group>
          </div>

          {verification.assembly.notes && (
            <Text size="xs" c="dimmed" mt={4} className="italic">
              Note: {verification.assembly.notes}
            </Text>
          )}

          {!readOnly && isPickingComplete && !isAssemblyComplete && (
            <Group mt="xs" gap="xs">
              <TextInput
                size="xs"
                placeholder="Assembly notes (e.g. cable routing, cooler paste)..."
                value={assemblyNotes}
                onChange={(e) => setAssemblyNotes(e.currentTarget.value)}
                className="flex-1"
              />
              <Button
                size="xs"
                color="cyan"
                loading={saving}
                onClick={() =>
                  void updateStep('assembly', {
                    completed: true,
                    notes: assemblyNotes || undefined,
                  })
                }
              >
                Mark Assembled
              </Button>
            </Group>
          )}
        </div>

        <div
          className={cn(
            'py-2.5',
            !isAssemblyComplete && 'opacity-60'
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 dark:bg-white/10 font-mono text-[10px] font-bold">
                3
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Hardware Bench Testing (POST, BIOS, MemTest, Stress)
              </span>
            </div>

            <Group gap="xs">
              <Badge
                data-testid="assembly-step-status"
                size="xs"
                variant="light"
                color={isTestingPassed ? 'teal' : isTestingFailed ? 'red' : 'gray'}
              >
                {isTestingPassed ? 'Passed' : isTestingFailed ? 'Failed' : 'Pending'}
              </Badge>
              {!readOnly && (
                <Checkbox
                  size="xs"
                  disabled={!isAssemblyComplete || saving}
                  checked={isTestingPassed}
                  onChange={(e) =>
                    void updateStep('testing', {
                      passed: e.currentTarget.checked,
                      completed: e.currentTarget.checked,
                      notes: testingNotes || verification.testing.notes || undefined,
                    })
                  }
                  label="Testing Passed"
                />
              )}
            </Group>
          </div>

          {verification.testing.notes && (
            <Text size="xs" c="dimmed" mt={4} className="italic">
              Bench test notes: {verification.testing.notes}
            </Text>
          )}

          {!readOnly && isAssemblyComplete && !isTestingPassed && (
            <Group mt="xs" gap="xs">
              <TextInput
                size="xs"
                placeholder="Testing notes (e.g. BIOS version, memory speed, temperatures)..."
                value={testingNotes}
                onChange={(e) => setTestingNotes(e.currentTarget.value)}
                className="flex-1"
              />
              <Button
                size="xs"
                color="teal"
                loading={saving}
                onClick={() =>
                  void updateStep('testing', {
                    passed: true,
                    completed: true,
                    notes: testingNotes || undefined,
                  })
                }
              >
                Pass Testing
              </Button>
              <Button
                size="xs"
                color="red"
                variant="light"
                loading={saving}
                onClick={() =>
                  void updateStep('testing', {
                    passed: false,
                    completed: true,
                    notes: testingNotes || undefined,
                  })
                }
              >
                Fail Testing
              </Button>
            </Group>
          )}
        </div>

        <div
          className={cn(
            'py-2.5',
            !isTestingPassed && 'opacity-60'
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 dark:bg-white/10 font-mono text-[10px] font-bold">
                4
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Final Quality Control (Cables, Aesthetics, Packaging)
              </span>
            </div>

            <Group gap="xs">
              <Badge
                data-testid="assembly-step-status"
                size="xs"
                variant="light"
                color={isQcPassed ? 'teal' : isQcFailed ? 'red' : 'gray'}
              >
                {isQcPassed ? 'QC Passed' : isQcFailed ? 'QC Failed' : 'Pending'}
              </Badge>
              {!readOnly && (
                <Checkbox
                  size="xs"
                  disabled={!isTestingPassed || saving}
                  checked={isQcPassed}
                  onChange={(e) =>
                    void updateStep('qc', {
                      passed: e.currentTarget.checked,
                      completed: e.currentTarget.checked,
                      notes: qcNotes || verification.qc.notes || undefined,
                    })
                  }
                  label="QC Passed"
                />
              )}
            </Group>
          </div>

          {verification.qc.notes && (
            <Text size="xs" c="dimmed" mt={4} className="italic">
              QC Inspector notes: {verification.qc.notes}
            </Text>
          )}

          {!readOnly && isTestingPassed && !isQcPassed && (
            <Group mt="xs" gap="xs">
              <TextInput
                size="xs"
                placeholder="QC inspection checklist notes..."
                value={qcNotes}
                onChange={(e) => setQcNotes(e.currentTarget.value)}
                className="flex-1"
              />
              <Button
                size="xs"
                color="teal"
                loading={saving}
                onClick={() =>
                  void updateStep('qc', {
                    passed: true,
                    completed: true,
                    notes: qcNotes || undefined,
                  })
                }
              >
                Pass QC
              </Button>
              <Button
                size="xs"
                color="red"
                variant="light"
                loading={saving}
                onClick={() =>
                  void updateStep('qc', {
                    passed: false,
                    completed: true,
                    notes: qcNotes || undefined,
                  })
                }
              >
                Fail QC
              </Button>
            </Group>
          )}
        </div>
      </div>
    </div>
  );
}
