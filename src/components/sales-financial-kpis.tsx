"use client";

import React from 'react';
import {
  Activity,
  ArrowDownRight,
  CreditCard,
  DollarSign,
  Package,
  RotateCcw,
} from 'lucide-react';
import { Badge, Paper, Text, ThemeIcon } from '@mantine/core';
import { motion } from 'framer-motion';
import type { OrderFinancialSummary } from '@/lib/order-workflow';
import { formatCurrency } from '@/lib/utils';

interface SalesFinancialKpisProps {
  financials: OrderFinancialSummary;
  aov: number;
  cancellationRate: number;
}

export function SalesFinancialKpis({
  financials,
  aov,
  cancellationRate,
}: SalesFinancialKpisProps) {
  const cards = [
    {
      title: 'Placed Order Value',
      value: formatCurrency(financials.placedOrderValue),
      subtitle: `${financials.activeOrderCount} active orders`,
      color: 'blue',
      icon: <Package className="w-5 h-5 text-blue-500 dark:text-blue-400" />,
      delay: 0,
    },
    {
      title: 'Collected Payments',
      value: formatCurrency(financials.collectedPayments),
      subtitle: `${financials.paidOrderCount} paid orders`,
      color: 'cyan',
      icon: <CreditCard className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
      delay: 0.08,
    },
    {
      title: 'Refunds Issued',
      value: formatCurrency(financials.refundsIssued),
      subtitle: 'Recorded payouts & gateway refunds',
      color: 'orange',
      icon: <RotateCcw className="w-5 h-5 text-orange-500 dark:text-orange-400" />,
      delay: 0.16,
    },
    {
      title: 'Net Sales',
      value: formatCurrency(financials.netSales),
      subtitle: 'Collected payments minus refunds',
      color: 'teal',
      icon: <DollarSign className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />,
      delay: 0.24,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: card.delay }}
          >
            <Paper
              withBorder
              radius="lg"
              p={{ base: 'md', sm: 'lg' }}
              className="border-slate-200 bg-white/85 shadow-sm transition-all hover:shadow-md dark:border-white/10 dark:bg-[#111722]"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <ThemeIcon size={40} radius="md" color={card.color} variant="light">
                  {card.icon}
                </ThemeIcon>
                <Badge size="xs" variant="light" color={card.color}>
                  {card.subtitle}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  {card.title}
                </p>
                <h3 className="font-headline text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {card.value}
                </h3>
              </div>
            </Paper>
          </motion.div>
        ))}
      </div>

      <Paper
        withBorder
        radius="lg"
        className="border-slate-200 bg-white/85 p-3 shadow-sm dark:border-white/10 dark:bg-[#111722]"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-md border border-slate-200/70 bg-slate-50/80 p-3 dark:border-white/5 dark:bg-white/[0.02]">
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <Package className="h-4 w-4 text-blue-500" />
              All-Time Orders
            </span>
            <Text fw={700} className="font-mono text-sm text-slate-900 dark:text-slate-100">
              {financials.totalOrderCount} ({financials.cancelledOrderCount} cancelled)
            </Text>
          </div>

          <div className="flex items-center justify-between rounded-md border border-slate-200/70 bg-slate-50/80 p-3 dark:border-white/5 dark:bg-white/[0.02]">
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <Activity className="h-4 w-4 text-purple-500" />
              Avg. Net Paid Order
            </span>
            <Text fw={700} className="font-mono text-sm text-slate-900 dark:text-slate-100">
              {formatCurrency(aov)}
            </Text>
          </div>

          <div className="flex items-center justify-between rounded-md border border-slate-200/70 bg-slate-50/80 p-3 dark:border-white/5 dark:bg-white/[0.02]">
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <ArrowDownRight className="h-4 w-4 text-rose-500" />
              Cancellation Rate
            </span>
            <Text fw={700} className="font-mono text-sm text-slate-900 dark:text-slate-100">
              {cancellationRate.toFixed(1)}%
            </Text>
          </div>
        </div>
      </Paper>
    </div>
  );
}
