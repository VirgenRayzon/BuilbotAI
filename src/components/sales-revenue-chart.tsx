"use client";

import React from 'react';
import { Paper, SegmentedControl, Title, Text } from '@mantine/core';
import { TrendingUp } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

interface SalesRevenueChartProps {
  revenueData: Array<{ name: string; revenue: number }>;
  timeRange: 'week' | 'month' | 'year';
  onTimeRangeChange: (range: 'week' | 'month' | 'year') => void;
  mounted: boolean;
  isDark: boolean;
}

const PRIMARY_COLOR = '#22d3ee';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function SalesRevenueChart({
  revenueData,
  timeRange,
  onTimeRangeChange,
  mounted,
  isDark,
}: SalesRevenueChartProps) {
  return (
    <Paper
      withBorder
      radius="lg"
      p={12}
      className="lg:col-span-2 bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col justify-between"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
        <div>
          <Title
            order={3}
            className="text-xl font-headline font-bold uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2"
          >
            <TrendingUp className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Revenue Performance
          </Title>
          <Text size="xs" className="text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono mt-0.5">
            {timeRange === 'week'
              ? 'Daily revenue tracking (Last 7 Days)'
              : timeRange === 'month'
                ? 'Daily revenue tracking (Last 30 Days)'
                : 'Monthly revenue tracking (Last 12 Months)'}
          </Text>
        </div>

        <SegmentedControl
          value={timeRange}
          onChange={(v) => {
            if (v === 'week' || v === 'month' || v === 'year') onTimeRangeChange(v);
          }}
          data={[
            { label: '7 Days', value: 'week' },
            { label: '30 Days', value: 'month' },
            { label: '12 Months', value: 'year' },
          ]}
          size="xs"
          radius="md"
          color="cyan"
          classNames={{
            root: 'bg-slate-100 dark:bg-[#141a23] border border-slate-200 dark:border-white/10 p-0.5',
            label:
              'font-headline font-bold text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-400 data-[active=true]:text-slate-900 dark:data-[active=true]:text-white',
            indicator: 'bg-white dark:bg-[#1e2634] shadow-sm',
          }}
        />
      </div>

      <div className="h-[280px] pt-4">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PRIMARY_COLOR} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={PRIMARY_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 600 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 600 }}
                tickFormatter={(val) => `₱${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
              />
              <RechartsTooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#141a23]/95 backdrop-blur-xl shadow-xl">
                        <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">
                          {label}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                          <span className="font-bold text-sm text-slate-900 dark:text-white">Revenue:</span>
                          <span className="font-mono font-bold text-sm text-cyan-600 dark:text-cyan-400">
                            {formatCurrency(payload[0].value as number)}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={PRIMARY_COLOR}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Loading chart...</div>
        )}
      </div>
    </Paper>
  );
}
