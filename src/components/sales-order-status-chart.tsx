"use client";

import React from 'react';
import { Paper, Title, Text } from '@mantine/core';
import { PieChart as PieIcon } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from 'recharts';

interface SalesOrderStatusChartProps {
  statusData: Array<{ name: string; value: number; color: string }>;
  mounted: boolean;
  isDark: boolean;
}

export function SalesOrderStatusChart({
  statusData,
  mounted,
  isDark,
}: SalesOrderStatusChartProps) {
  const totalStatusCount = statusData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <Paper
      withBorder
      radius="lg"
      p={12}
      className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between"
    >
      <div className="pb-3 border-b border-slate-200 dark:border-white/10">
        <Title
          order={3}
          className="text-xl font-headline font-bold uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2"
        >
          <PieIcon className="w-5 h-5 text-indigo-500" />
          Order Status
        </Title>
        <Text size="xs" className="text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono mt-0.5">
          Inventory lifecycle distribution
        </Text>
      </div>

      <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:items-center">
        <div className="h-[230px] min-w-0 flex-1 flex items-center justify-center relative">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={2}
                  stroke={isDark ? '#111722' : '#ffffff'}
                  animationDuration={1500}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const p = payload[0];
                      return (
                        <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#141a23]/95 backdrop-blur-xl shadow-xl text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.payload?.color }} />
                            <span className="font-bold text-slate-900 dark:text-white">{p.name}:</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {p.value} orders
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Loading chart...</div>
          )}

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold font-headline text-slate-900 dark:text-white">
              {totalStatusCount}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Total</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:min-w-[168px]">
          {statusData.map((d, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 p-2 rounded-md bg-slate-50 dark:bg-black/20 border border-slate-200/50 dark:border-white/5"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-[11px] leading-none uppercase font-semibold tracking-wide text-slate-600 dark:text-slate-400 truncate">
                  {d.name}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white ml-2">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </Paper>
  );
}
