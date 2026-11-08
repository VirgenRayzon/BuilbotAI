'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Check,
  ChevronDown,
  Package,
  Wrench,
} from 'lucide-react';
import { Badge, Collapse } from '@mantine/core';
import type { Order, OrderItem, Part } from '@/lib/types';
import { cn, formatCurrency, getOptimizedStorageUrl } from '@/lib/utils';
import { formatFirestoreTimestamp, getStockBadgeInfo } from '@/app/admin/components/orders/order-status-config';
import {
  getOrderPlacedSummary,
  useCustomerRigAssembly,
} from '@/hooks/use-customer-rig-assembly';
import { resolveOrderItemImageUrl } from '@/lib/order-image-resolver';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { getOrderFulfillmentStage } from '@/lib/order-workflow';
import {
  getVisibleQcNotes,
  orderHasBuildOrPrebuilt,
} from '@/lib/customer-order-activity';

interface CustomerOrderActivityProps {
  order: Order;
  catalogParts?: Part[] | null;
  className?: string;
}

export function CustomerOrderActivity({
  order,
  catalogParts,
  className,
}: CustomerOrderActivityProps) {
  const [showPickingDetails, setShowPickingDetails] = useState(false);
  const [selectedRigIndex, setSelectedRigIndex] = useState(0);

  const { rigs, activeRig, verification, loading } = useCustomerRigAssembly(
    order,
    order ? undefined : undefined
  );

  const currentRig = rigs[selectedRigIndex] || activeRig;

  const currentStage = getOrderFulfillmentStage(order);
  const isCancelled = order.status === 'cancelled';
  const isStorePickup = order.shippingMethod === 'store_pickup';

  const pickingItems = verification?.picking?.items || [];
  const pickedCount = pickingItems.filter((i) => i.picked).length;
  const isPickingComplete =
    verification?.picking?.completed ||
    (pickingItems.length > 0 && pickedCount === pickingItems.length) ||
    currentStage === 'out_for_delivery' ||
    currentStage === 'delivered' ||
    order.assemblyVerificationPassed === true;

  const isAssemblyComplete =
    verification?.assembly?.completed ||
    currentStage === 'out_for_delivery' ||
    currentStage === 'delivered' ||
    order.assemblyVerificationPassed === true;

  const isTestingPassed =
    (verification?.testing?.completed && verification?.testing?.passed === true) ||
    currentStage === 'out_for_delivery' ||
    currentStage === 'delivered' ||
    order.assemblyVerificationPassed === true;

  const isTestingFailed =
    verification?.testing?.completed && verification?.testing?.passed === false;

  const isQcPassed =
    (verification?.qc?.completed && verification?.qc?.passed === true) ||
    currentStage === 'out_for_delivery' ||
    currentStage === 'delivered' ||
    order.assemblyVerificationPassed === true;

  const isQcFailed =
    verification?.qc?.completed && verification?.qc?.passed === false;

  const isStage3Active = currentStage === 'assembling_testing' || order.status === 'building';
  const isStage3Completed =
    currentStage === 'out_for_delivery' ||
    currentStage === 'delivered' ||
    order.status === 'finished building' ||
    order.assemblyVerificationPassed === true;

  const isStage4Active = currentStage === 'out_for_delivery';
  const isStage4Completed = currentStage === 'delivered';
  const isStage5Completed = currentStage === 'delivered';

  const hasBuildOrPrebuilt = orderHasBuildOrPrebuilt(order);
  const deliveryStepNumber = hasBuildOrPrebuilt ? 4 : 3;
  const deliveredStepNumber = hasBuildOrPrebuilt ? 5 : 4;

  const orderSummary = getOrderPlacedSummary(order);
  const stockBadge = getStockBadgeInfo(order);
  const qcNotes = getVisibleQcNotes(verification?.qc?.notes);

  return (
    <div
      data-testid="customer-order-activity"
      className={cn(
        'w-full text-slate-900 dark:text-slate-100',
        className
      )}
    >
      <div className="flex items-center pb-2 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-2">
          <h3 className="font-headline font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 tracking-tight">
            Order Activity
          </h3>
          {currentRig && rigs.length > 1 && (
            <div className="flex items-center gap-1 ml-2">
              {rigs.map((r, idx) => (
                <button
                  key={r.rigId}
                  type="button"
                  onClick={() => setSelectedRigIndex(idx)}
                  className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-bold transition-colors',
                    selectedRigIndex === idx
                      ? 'border border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-500/40 dark:bg-cyan-500/20 dark:text-cyan-300'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  )}
                >
                  {r.rigName}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

        <div className="pt-2 space-y-4">
          <div className="relative pl-7 space-y-4">
            <div className="absolute left-[11px] top-2.5 bottom-2.5 w-[2px] bg-slate-300 dark:bg-slate-800" />

            <div className="relative space-y-1">
              <span
                data-testid="completed-order-stage-marker"
                className="absolute -left-7 top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-cyan-400 bg-cyan-50 font-mono text-xs font-bold text-cyan-700 dark:border-cyan-500 dark:bg-cyan-950 dark:text-cyan-300"
              >
                1
              </span>
              <div className="space-y-0.5">
                <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  Order placed
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {formatFirestoreTimestamp(order.createdAt, true)}
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300 pt-0.5">
                  {orderSummary}
                </p>
              </div>
            </div>

            <div className="relative space-y-1">
              <span
                data-testid="completed-order-stage-marker"
                className="absolute -left-7 top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-cyan-400 bg-cyan-50 font-mono text-xs font-bold text-cyan-700 dark:border-cyan-500 dark:bg-cyan-950 dark:text-cyan-300"
              >
                2
              </span>
              <div className="space-y-1.5">
                <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  Stock reserved
                </p>
                <div>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
                      stockBadge.restored
                        ? 'border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        : 'border border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-[#06241a] dark:text-emerald-400'
                    )}
                  >
                    {stockBadge.restored ? stockBadge.label : 'Inventory reserved'}
                  </span>
                </div>
              </div>
            </div>

            {hasBuildOrPrebuilt && (
              <div className="relative space-y-2.5">
                <span
                  data-testid="completed-order-stage-marker"
                  className={cn(
                    'absolute -left-7 top-0.5 flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs font-bold',
                    isStage3Active || isStage3Completed
                      ? 'border border-cyan-400 bg-cyan-50 text-cyan-700 dark:border-cyan-500 dark:bg-cyan-950 dark:text-cyan-300'
                      : 'border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                  )}
                >
                  3
                </span>
              <div className="space-y-1">
                <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  Moved to Assembling & Testing
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {isStage3Completed
                    ? 'Completed — verified & bench tested'
                    : isStage3Active
                      ? 'Current stage — timestamp to be recorded'
                      : 'Upcoming stage — queued for technician assembly'}
                </p>
              </div>

              <div data-testid="customer-assembly-workflow" className="mt-2 divide-y divide-slate-200/80 dark:divide-white/10">
                <div className="py-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        data-testid="completed-assembly-step-marker"
                        className={cn(
                          'flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full border text-xs font-bold shrink-0',
                          isPickingComplete
                            ? 'border-teal-400 bg-teal-50 text-teal-700 dark:border-teal-500 dark:bg-teal-950 dark:text-teal-300'
                            : 'border-slate-300 bg-slate-200 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                        )}
                      >
                        1
                      </span>
                      <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">
                        Component Picking
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          'px-2.5 py-0.5 text-xs font-bold rounded-md uppercase font-mono tracking-wide',
                          isPickingComplete
                            ? 'border border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-500/40 dark:bg-teal-500/20 dark:text-teal-300'
                            : pickedCount > 0
                              ? 'border border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-500/40 dark:bg-cyan-500/20 dark:text-cyan-300'
                              : 'border border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400'
                        )}
                      >
                        {pickingItems.length > 0
                          ? `${isPickingComplete ? pickingItems.length : pickedCount} / ${pickingItems.length} PICKED`
                          : isPickingComplete
                            ? '8 / 8 PICKED'
                            : 'PENDING'}
                      </span>

                      {pickingItems.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowPickingDetails((prev) => !prev)}
                          aria-label={showPickingDetails ? 'Hide picking items' : 'View picking items'}
                          className="text-xs text-slate-500 hover:text-slate-900 p-1 transition-colors dark:text-slate-400 dark:hover:text-slate-200"
                        >
                          <ChevronDown
                            size={14}
                            className={cn(
                              'transition-transform duration-200',
                              showPickingDetails && 'rotate-180 text-teal-400'
                            )}
                          />
                        </button>
                      )}
                    </div>
                  </div>

                  {pickingItems.length > 0 && (
                    <Collapse in={showPickingDetails}>
                      <div className="mt-2.5 pt-2 border-t border-slate-200/80 divide-y divide-slate-200/70 overflow-hidden dark:border-white/10 dark:divide-white/5">
                        {pickingItems.map((pickItem) => {
                          const orderItem = currentRig?.items.find(
                            (it) => it.lineId === pickItem.lineId || it.id === pickItem.partId || it.productId === pickItem.partId
                          );
                          const rawImg = orderItem
                            ? resolveOrderItemImageUrl(orderItem, order.items || [], catalogParts)
                            : null;
                          const resolvedImg = rawImg ? getOptimizedStorageUrl(rawImg) || rawImg : null;

                          return (
                            <div
                              key={pickItem.lineId}
                              className="p-2 sm:p-2.5 flex items-center justify-between text-xs gap-2"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={cn(
                                    'h-4 w-4 rounded-full flex items-center justify-center shrink-0 border',
                                    pickItem.picked || isPickingComplete
                                      ? 'bg-teal-500 text-black border-teal-400'
                                      : 'border-slate-400 bg-slate-100 text-transparent dark:border-slate-600 dark:bg-slate-800'
                                  )}
                                >
                                  <Check size={10} className="stroke-[3]" />
                                </div>

                                {resolvedImg && (
                                  <div className="relative h-8 w-8 shrink-0 rounded overflow-hidden border border-slate-700 bg-white">
                                    <OptimizedImage
                                      src={resolvedImg}
                                      alt={pickItem.name}
                                      fill
                                      sizes="32px"
                                      className="object-contain p-0.5"
                                    />
                                  </div>
                                )}

                                <div className="flex flex-col min-w-0">
                                  <span className="text-[10px] text-teal-400 uppercase font-bold tracking-wider">
                                    {pickItem.category}
                                  </span>
                                  <span className="truncate text-slate-800 font-medium dark:text-slate-200">
                                    {pickItem.name}
                                  </span>
                                </div>
                              </div>

                              <span
                                className={cn(
                                  'text-[10px] font-bold font-mono px-1.5 py-0.5 rounded shrink-0',
                                  pickItem.picked || isPickingComplete
                                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-500'
                                )}
                              >
                                {pickItem.picked || isPickingComplete ? 'PICKED' : 'PENDING'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </Collapse>
                  )}
                </div>

                <div className="py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        data-testid="completed-assembly-step-marker"
                        className={cn(
                          'flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full border text-xs font-bold shrink-0',
                          isAssemblyComplete
                            ? 'border-teal-400 bg-teal-50 text-teal-700 dark:border-teal-500 dark:bg-teal-950 dark:text-teal-300'
                            : 'border-slate-300 bg-slate-200 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                        )}
                      >
                        2
                      </span>
                      <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">
                        Physical Assembly
                      </span>
                    </div>

                    <span
                      className={cn(
                        'px-2.5 py-0.5 text-xs font-bold rounded-md uppercase tracking-wide shrink-0',
                        isAssemblyComplete
                          ? 'border border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-500/40 dark:bg-teal-500/20 dark:text-teal-300'
                          : isPickingComplete
                            ? 'border border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-500/40 dark:bg-cyan-500/20 dark:text-cyan-300'
                            : 'border border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400'
                      )}
                    >
                      {isAssemblyComplete
                        ? 'COMPLETED'
                        : isPickingComplete
                          ? 'IN PROGRESS'
                          : 'PENDING'}
                    </span>
                  </div>

                  {verification?.assembly?.notes && (
                    <p className="text-[11px] text-teal-700 italic mt-1.5 pl-7 sm:pl-8 dark:text-teal-300/80">
                      Technician note: {verification.assembly.notes}
                    </p>
                  )}
                </div>

                <div className="py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        data-testid="completed-assembly-step-marker"
                        className={cn(
                          'flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full border text-xs font-bold shrink-0',
                          isTestingPassed
                            ? 'border-teal-400 bg-teal-50 text-teal-700 dark:border-teal-500 dark:bg-teal-950 dark:text-teal-300'
                            : isTestingFailed
                              ? 'border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-500 dark:bg-rose-950 dark:text-rose-300'
                              : 'border-slate-300 bg-slate-200 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                        )}
                      >
                        3
                      </span>
                      <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">
                        Hardware Bench Testing (POST, BIOS, MemTest, Stress)
                      </span>
                    </div>

                    <span
                      className={cn(
                        'px-2.5 py-0.5 text-xs font-bold rounded-md uppercase tracking-wide shrink-0',
                        isTestingPassed
                          ? 'border border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-500/40 dark:bg-teal-500/20 dark:text-teal-300'
                          : isTestingFailed
                            ? 'border border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/20 dark:text-rose-300'
                            : isAssemblyComplete
                              ? 'border border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-500/40 dark:bg-cyan-500/20 dark:text-cyan-300'
                              : 'border border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400'
                      )}
                    >
                      {isTestingPassed
                        ? 'PASSED'
                        : isTestingFailed
                          ? 'FAILED'
                          : isAssemblyComplete
                            ? 'IN PROGRESS'
                            : 'PENDING'}
                    </span>
                  </div>

                  {verification?.testing?.notes && (
                    <p className="text-[11px] text-teal-700 italic mt-1.5 pl-7 sm:pl-8 dark:text-teal-300/80">
                      Bench results: {verification.testing.notes}
                    </p>
                  )}
                </div>

                <div className="py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        data-testid="completed-assembly-step-marker"
                        className={cn(
                          'flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full border text-xs font-bold shrink-0',
                          isQcPassed
                            ? 'border-teal-400 bg-teal-50 text-teal-700 dark:border-teal-500 dark:bg-teal-950 dark:text-teal-300'
                            : isQcFailed
                              ? 'border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-500 dark:bg-rose-950 dark:text-rose-300'
                              : 'border-slate-300 bg-slate-200 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                        )}
                      >
                        4
                      </span>
                      <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">
                        Final Quality Control (Cables, Aesthetics, Packaging)
                      </span>
                    </div>

                    <span
                      className={cn(
                        'px-2.5 py-0.5 text-xs font-bold rounded-md uppercase tracking-wide shrink-0',
                        isQcPassed
                          ? 'border border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-500/40 dark:bg-teal-500/20 dark:text-teal-300'
                          : isQcFailed
                            ? 'border border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/20 dark:text-rose-300'
                            : isTestingPassed
                              ? 'border border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-500/40 dark:bg-cyan-500/20 dark:text-cyan-300'
                              : 'border border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400'
                      )}
                    >
                      {isQcPassed
                        ? 'PASSED'
                        : isQcFailed
                          ? 'FAILED'
                          : isTestingPassed
                            ? 'IN PROGRESS'
                            : 'PENDING'}
                    </span>
                  </div>
                </div>

                {qcNotes && (
                  <div className="py-2.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span className="text-slate-500 italic dark:text-slate-400">
                      QC notes: {qcNotes}
                    </span>
                  </div>
                )}
              </div>
            </div>
            )}

            {(!isCancelled || isStage4Active || isStage4Completed) && (
              <div className="relative space-y-1">
                <span
                  data-testid="completed-order-stage-marker"
                  className={cn(
                    'absolute -left-7 top-0.5 flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs font-bold',
                    isStage4Active || isStage4Completed
                      ? 'border border-cyan-400 bg-cyan-50 text-cyan-700 dark:border-cyan-500 dark:bg-cyan-950 dark:text-cyan-300'
                      : 'border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                  )}
                >
                  {deliveryStepNumber}
                </span>
                <div className="space-y-1">
                  <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    {isStorePickup ? 'Ready for Store Pickup' : 'Out for Delivery'}
                  </p>
                  <div>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
                        isStage4Active || isStage4Completed
                          ? 'border border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-500/40 dark:bg-cyan-950/60 dark:text-cyan-400'
                          : 'border border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400'
                      )}
                    >
                      {isStage4Active || isStage4Completed
                        ? (isStorePickup ? 'Ready for Collection' : 'In Transit with Courier')
                        : (isStorePickup ? 'Pending Pickup Preparation' : 'Pending Courier Dispatch')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {isStage4Active || isStage4Completed
                      ? (isStorePickup
                          ? 'Your order is packaged and available for collection at Netcodex Center — Cubao.'
                          : 'Dispatched with courier. Actual delivery is in transit.')
                      : (isStorePickup
                          ? 'Upcoming stage — package will be prepared for collection at Netcodex Center — Cubao.'
                          : 'Upcoming stage — package queued for courier pickup and dispatch.')}
                  </p>
                </div>
              </div>
            )}

            {(!isCancelled || isStage5Completed) && (
              <div className="relative space-y-1">
                <span
                  data-testid="delivered-stage-marker"
                  className={cn(
                    'absolute -left-7 top-0.5 flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs font-bold',
                    isStage5Completed
                      ? 'border border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                  )}
                >
                  {deliveredStepNumber}
                </span>
                <div className="space-y-1">
                  <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    Delivered
                  </p>
                  <div>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
                        isStage5Completed
                          ? 'border border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-[#06241a] dark:text-emerald-400'
                          : 'border border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400'
                      )}
                    >
                      {isStage5Completed ? 'Completed' : 'Pending Delivery'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {isStage5Completed
                      ? 'Order fulfilled and delivered successfully.'
                      : 'Upcoming stage — final handover and parcel receipt verification.'}
                  </p>
                </div>
              </div>
            )}

            {isCancelled && (
              <div className="relative space-y-1">
                <span className="absolute -left-7 top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-rose-400 bg-rose-50 font-mono text-xs font-bold text-rose-700 dark:border-rose-500 dark:bg-rose-950 dark:text-rose-300">
                  ✕
                </span>
                <div className="space-y-1">
                  <p className="font-bold text-sm sm:text-base text-rose-700 dark:text-rose-300">
                    Order Cancelled
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {order.cancellationReason || 'Order was cancelled by customer request or policy expiration.'}
                  </p>
                  {order.cancelledAt && (
                    <p className="text-xs text-slate-500 font-mono">
                      Cancelled on {formatFirestoreTimestamp(order.cancelledAt, true)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 dark:border-slate-800/80 dark:text-slate-400 italic">
            {hasBuildOrPrebuilt
              ? 'Real-time fulfillment timeline; timestamps and technician assembly milestones update automatically.'
              : 'Real-time fulfillment timeline; timestamps update automatically.'}
          </div>
        </div>
    </div>
  );
}
