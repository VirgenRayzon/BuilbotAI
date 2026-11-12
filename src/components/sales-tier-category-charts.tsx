"use client";

import React from 'react';
import { Paper, Title, Text } from '@mantine/core';
import { Package, BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';

interface SalesTierCategoryChartsProps {
  prebuiltTierData: Array<{ name: string; value: number; color: string }>;
  categoryData: Array<{ name: string; value: number }>;
  mounted: boolean;
  isDark: boolean;
}

const COLORS = {
  primary: '#22d3ee',
  chart: ['#22d3ee', '#818cf8', '#10b981', '#fbbf24', '#f472b6', '#a78bfa'],
};

export function SalesTierCategoryCharts({
  prebuiltTierData,
  categoryData,
  mounted,
  isDark,
}: SalesTierCategoryChartsProps) {
  const totalPrebuiltCount = prebuiltTierData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Paper
        withBorder
        radius="lg"
        p={12}
        className="lg:order-2 bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between"
      >
        <div className="pb-3 border-b border-slate-200 dark:border-white/10">
          <Title
            order={3}
            className="text-xl font-headline font-bold uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2"
          >
            <Package className="w-5 h-5 text-emerald-500" />
            Build Types & Tiers
          </Title>
          <Text size="xs" className="text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono mt-0.5">
            Custom rigs vs prebuilt distribution
          </Text>
        </div>

        <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:items-center">
          <div className="h-[230px] min-w-0 flex-1 flex items-center justify-center relative">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={prebuiltTierData}
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
                    {prebuiltTierData.map((entry, index) => (
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
                                {p.value} units
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
                {totalPrebuiltCount}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Total</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:min-w-[168px]">
            {prebuiltTierData.map((d, i) => (
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

      <Paper
        withBorder
        radius="lg"
        p={12}
        className="lg:order-1 lg:col-span-2 bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between"
      >
        <div className="pb-3 border-b border-slate-200 dark:border-white/10">
          <Title
            order={3}
            className="text-xl font-headline font-bold uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2"
          >
            <BarChart3 className="w-5 h-5 text-cyan-500" />
            Units Sold by Category
          </Title>
          <Text size="xs" className="text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono mt-0.5">
            Top performing component segments
          </Text>
        </div>

        <div className="h-[280px] pt-4">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 20, right: 30 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDark ? '#e2e8f0' : '#1e293b', fontSize: 11, fontWeight: 700 }}
                  width={90}
                />
                <RechartsTooltip
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#141a23]/95 backdrop-blur-xl shadow-xl text-xs">
                          <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">
                            {label}
                          </p>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: payload[0].color || COLORS.primary }}
                            />
                            <span className="font-bold text-slate-900 dark:text-white">Units Sold:</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {payload[0].value} units
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" fill={COLORS.primary} radius={[0, 6, 6, 0]} barSize={20} animationDuration={1500}>
                  {categoryData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS.chart[index % COLORS.chart.length]}
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Loading chart...</div>
          )}
        </div>
      </Paper>
    </div>
  );
}
