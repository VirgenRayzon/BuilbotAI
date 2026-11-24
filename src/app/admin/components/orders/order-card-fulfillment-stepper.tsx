"use client";

import React from 'react';
import { ArrowRight, CheckCircle2, Clock, Lock, XCircle } from 'lucide-react';
import { Tooltip } from '@mantine/core';
import {
  availableOrderStages,
  getOrderFulfillmentStage,
  getOrderFulfillmentStageLabel,
  requiresOrderAssembly,
} from '@/lib/order-workflow';
import type { Order, OrderFulfillmentStage } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  formatFirestoreTimestamp,
  getStockBadgeInfo,
} from './order-status-config';

interface OrderCardFulfillmentStepperProps {
  order: Order;
  onUpdateFulfillmentStage?: (orderId: string, stage: OrderFulfillmentStage) => void;
  archived?: boolean;
  isAssemblyVerified?: boolean;
}

export function OrderCardFulfillmentStepper({
  order,
  onUpdateFulfillmentStage,
  archived = false,
  isAssemblyVerified,
}: OrderCardFulfillmentStepperProps) {
  const stockBadge = getStockBadgeInfo(order);
  const stages = availableOrderStages(order);
  const currentStage = getOrderFulfillmentStage(order);
  const currentStageIdx = stages.indexOf(currentStage);

  const isCustomRig =
    requiresOrderAssembly(order) &&
    order.type !== 'prebuilt' &&
    !order.prebuiltName;

  const assemblyReady =
    !isCustomRig ||
    Boolean(isAssemblyVerified ?? order.assemblyVerificationPassed);

  const effectivePaymentMethod = order.paymentMethod ?? 'cod';
  const isOnlinePaymentPaid =
    effectivePaymentMethod === 'cod' || order.paymentStatus === 'paid';

  return (
    <div className="w-full">
      {order.status === 'cancelled' ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-800 dark:text-rose-300">
          <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">
              Order Cancelled {order.autoCancelled ? '(Expired 1-Hour Online Hold)' : ''}
            </p>
            {order.cancellationReason && <p>{order.cancellationReason}</p>}
            {order.cancelledAt && (
              <p className="opacity-80 font-mono text-[11px]">
                Cancelled on {formatFirestoreTimestamp(order.cancelledAt, true)} · {stockBadge.label}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div
          className="grid w-full gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))`,
          }}
        >
          {stages.map((stage, idx) => {
            const isCompleted = idx < currentStageIdx;
            const isCurrent = idx === currentStageIdx;
            const isNext = idx === currentStageIdx + 1;

            const label = getOrderFulfillmentStageLabel({
              ...order,
              fulfillmentStage: stage,
              status: 'pending',
            });

            let isReady = false;
            let blockedReason = '';

            if (isNext && !archived && order.status !== 'cancelled') {
              if (stage === 'assembling_testing') {
                if (!isOnlinePaymentPaid) {
                  blockedReason = 'Online payment must be confirmed before assembling.';
                } else {
                  isReady = true;
                }
              } else if (stage === 'out_for_delivery') {
                if (isCustomRig && !assemblyReady) {
                  blockedReason =
                    'Complete and pass all 4 assembly verification steps below to unlock dispatch.';
                } else if (!isOnlinePaymentPaid) {
                  blockedReason = 'Online payment must be confirmed before dispatching.';
                } else {
                  isReady = true;
                }
              } else if (stage === 'delivered') {
                if (order.paymentStatus !== 'paid') {
                  blockedReason = 'Payment must be confirmed before marking delivered.';
                } else {
                  isReady = true;
                }
              } else {
                isReady = true;
              }
            }

            const canClick = isNext && isReady && Boolean(onUpdateFulfillmentStage);

            const card = (
              <div
                key={stage}
                role={canClick ? 'button' : undefined}
                tabIndex={canClick ? 0 : undefined}
                onClick={canClick ? () => onUpdateFulfillmentStage!(order.id, stage) : undefined}
                onKeyDown={
                  canClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onUpdateFulfillmentStage!(order.id, stage);
                        }
                      }
                    : undefined
                }
                className={cn(
                  'flex min-h-11 sm:min-h-9 items-center justify-between gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors select-none',
                  canClick
                    ? 'border-cyan-500/50 bg-cyan-500/10 text-slate-900 dark:text-cyan-100 font-semibold cursor-pointer hover:border-cyan-400 hover:bg-cyan-500/20 active:scale-[0.99]'
                    : isCurrent
                      ? 'border-cyan-500/70 bg-cyan-500/15 text-slate-900 dark:text-white font-bold cursor-default'
                      : isCompleted
                        ? 'border-cyan-500/25 bg-cyan-500/5 text-slate-700 dark:text-slate-300 font-medium cursor-default'
                        : isNext
                          ? 'border-dashed border-slate-300 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.01] text-slate-400 dark:text-slate-500 cursor-not-allowed'
                          : 'border-slate-200/60 dark:border-white/5 bg-slate-50/40 dark:bg-transparent text-slate-400 dark:text-slate-600 opacity-60 cursor-not-allowed'
                )}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {isCurrent ? (
                    <span className="h-2 w-2 rounded-full bg-cyan-500 shrink-0 mx-0.5" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-cyan-600 dark:text-cyan-400" />
                  ) : isNext ? (
                    isReady ? (
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-cyan-600 dark:text-cyan-400" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                    )
                  ) : (
                    <Clock className="h-3.5 w-3.5 shrink-0 opacity-40" />
                  )}
                  <span className="truncate">{label}</span>
                </div>
              </div>
            );

            if (blockedReason) {
              return (
                <Tooltip key={stage} label={blockedReason} withArrow position="top">
                  {card}
                </Tooltip>
              );
            }

            if (canClick) {
              return (
                <Tooltip
                  key={stage}
                  label={`Click to advance order to ${label}`}
                  withArrow
                  position="top"
                >
                  {card}
                </Tooltip>
              );
            }

            return card;
          })}
        </div>
      )}
    </div>
  );
}
