"use client";

import React, { useMemo } from 'react';
import { Paper, Badge, ThemeIcon, Title, Text, Stack } from '@mantine/core';
import { motion } from 'framer-motion';
import {
  Activity,
  Box,
  Cpu,
  Grid,
  HardDrive,
  Headphones,
  Keyboard,
  Layers,
  Monitor,
  Package,
  Wind,
  Zap,
} from 'lucide-react';
import type { Part } from '@/lib/types';
import { getPopularityCategories } from '@/lib/popularity';
import { cn } from '@/lib/utils';

interface SalesPopularityViewProps {
  parts: Part[];
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getCategoryIcon(cat: string) {
  const lower = cat.toLowerCase();
  if (lower.includes('cpu')) return <Cpu className="w-4 h-4 text-cyan-500" />;
  if (lower.includes('gpu')) return <Cpu className="w-4 h-4 text-purple-500" />;
  if (lower.includes('ram') || lower.includes('memory')) return <Layers className="w-4 h-4 text-emerald-500" />;
  if (lower.includes('motherboard')) return <Grid className="w-4 h-4 text-pink-500" />;
  if (lower.includes('psu') || lower.includes('power')) return <Zap className="w-4 h-4 text-amber-500" />;
  if (lower.includes('storage') || lower.includes('ssd') || lower.includes('hdd')) return <HardDrive className="w-4 h-4 text-blue-500" />;
  if (lower.includes('case')) return <Box className="w-4 h-4 text-indigo-500" />;
  if (lower.includes('cooler') || lower.includes('fan')) return <Wind className="w-4 h-4 text-teal-500" />;
  if (lower.includes('monitor')) return <Monitor className="w-4 h-4 text-rose-500" />;
  if (lower.includes('keyboard')) return <Keyboard className="w-4 h-4 text-orange-500" />;
  if (lower.includes('mouse')) return <Zap className="w-4 h-4 text-violet-500" />;
  if (lower.includes('headset') || lower.includes('headphones')) return <Headphones className="w-4 h-4 text-green-500" />;
  return <Package className="w-4 h-4 text-slate-400" />;
}

export function SalesPopularityView({ parts }: SalesPopularityViewProps) {
  const popularityCategories = useMemo(() => getPopularityCategories(parts || []), [parts]);

  if (popularityCategories.length === 0) {
    return (
      <Paper
        withBorder
        radius="lg"
        p={12}
        className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 text-center py-16"
      >
        <Stack align="center" gap="md" className="max-w-md mx-auto">
          <ThemeIcon size={56} radius="xl" color="gray" variant="light">
            <Activity className="h-7 w-7 text-slate-400" />
          </ThemeIcon>
          <div className="space-y-1">
            <Title order={3} className="text-lg font-headline font-bold text-slate-900 dark:text-white">
              No Popularity Data
            </Title>
            <Text size="xs" className="text-slate-600 dark:text-slate-400">
              No component parts have been registered yet.
            </Text>
          </div>
        </Stack>
      </Paper>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {popularityCategories.map(({ category, parts: topParts, maxPopularity }) => (
        <motion.div
          key={category}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Paper
            withBorder
            radius="lg"
            className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm overflow-hidden h-full flex flex-col justify-between hover:border-cyan-500/40 transition-colors"
          >
            <div>
              <div className="p-3 border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-black/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(category)}
                  <span className="font-headline font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                    {category}
                  </span>
                </div>
                <Badge size="xs" variant="light" color="cyan" className="font-bold uppercase tracking-wider">
                  {topParts.length} Tracked
                </Badge>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-white/5">
                {topParts.map((item, index) => {
                  const pop = item.popularity ?? 0;
                  const relativeStrength = maxPopularity > 0 ? (pop / maxPopularity) * 100 : 0;

                  return (
                    <div
                      key={item.id}
                      className="p-3 flex flex-col hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group/item"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border transition-all duration-300 group-hover/item:scale-105',
                            index === 0
                              ? 'bg-amber-500/15 text-amber-500 border-amber-500/40 font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                              : index === 1
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 font-bold'
                                : index === 2
                                  ? 'bg-orange-500/15 text-orange-500 border-orange-500/30 font-bold'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/5'
                          )}
                        >
                          #{index + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs truncate leading-tight text-slate-900 dark:text-white group-hover/item:text-cyan-600 dark:group-hover/item:text-cyan-400 transition-colors">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">
                              {item.brand || 'Standard'}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(item.price)}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                              {pop}
                            </span>
                            <Activity className="w-3.5 h-3.5 text-cyan-500" />
                          </div>
                          <p className="text-[8px] text-slate-500 uppercase tracking-tighter">Orders</p>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[8px] text-slate-400 uppercase font-mono tracking-tighter">
                          Relative Demand
                        </span>
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-black/40 rounded-full overflow-hidden relative">
                          <motion.div
                            className={cn(
                              'h-full rounded-full',
                              index === 0
                                ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                                : index === 1
                                  ? 'bg-gradient-to-r from-slate-400 to-slate-200'
                                  : index === 2
                                    ? 'bg-gradient-to-r from-orange-500 to-orange-300'
                                    : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${relativeStrength}%` }}
                            transition={{ duration: 0.8, delay: index * 0.08 }}
                          />
                        </div>
                        <span className="text-[8px] font-mono text-slate-500 dark:text-slate-400 font-bold shrink-0">
                          {Math.round(relativeStrength)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Paper>
        </motion.div>
      ))}
    </div>
  );
}
