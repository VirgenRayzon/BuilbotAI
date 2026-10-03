"use client";

import React from "react";
import { Paper, Title, Text, Group, Stack, Badge, SimpleGrid, ThemeIcon } from "@mantine/core";
import { Shield, Mail, Calendar, Package, Truck, Sparkles, CheckCircle, Cpu } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ProfileHeroProps {
  profile: any;
  authUser: any;
  stats: {
    totalBuilds: number;
    activeBuilds: number;
    totalValue: number;
  };
}

export function ProfileHero({ profile, authUser, stats }: ProfileHeroProps) {
  const initial =
    profile?.name?.substring(0, 1).toUpperCase() ||
    authUser?.email?.substring(0, 1).toUpperCase() ||
    "U";

  const joinDate = authUser?.metadata?.creationTime
    ? new Date(authUser.metadata.creationTime).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : "Member";

  return (
    <div className="w-full bg-slate-100/70 dark:bg-[#0e131d]/90 border-b border-slate-200 dark:border-white/10 py-10 mb-8 backdrop-blur-md transition-colors duration-300">
      <div className="w-full max-w-[1800px] mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* User Identity Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left w-full lg:w-auto">
            <div className="relative">
              <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-cyan-600 via-sky-600 to-indigo-700 flex items-center justify-center text-3xl font-bold font-headline text-white shadow-xl shadow-cyan-500/20 ring-4 ring-white dark:ring-slate-900">
                {initial}
              </div>
              {profile?.isSuperAdmin && (
                <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white border-2 border-white dark:border-slate-900 rounded-lg p-1.5 shadow-md">
                  <Shield size={16} />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <Title order={1} className="text-3xl sm:text-4xl font-headline font-bold text-slate-900 dark:text-white tracking-tight">
                  {profile?.name || authUser?.displayName || "PC Builder"}
                </Title>

                {profile?.isSuperAdmin && (
                  <Badge
                    size="lg"
                    variant="filled"
                    color="indigo"
                    className="font-bold uppercase tracking-wider text-[11px]"
                  >
                    Super Admin
                  </Badge>
                )}
                {profile?.isManager && !profile?.isSuperAdmin && (
                  <Badge
                    size="lg"
                    variant="filled"
                    color="orange"
                    className="font-bold uppercase tracking-wider text-[11px]"
                  >
                    Manager
                  </Badge>
                )}
                {!profile?.isSuperAdmin && !profile?.isManager && (
                  <Badge
                    size="lg"
                    variant="light"
                    color="cyan"
                    className="font-bold uppercase tracking-wider text-[11px]"
                  >
                    Verified Builder
                  </Badge>
                )}
              </div>

              {/* Email & Joined info with high contrast */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-slate-700 dark:text-slate-300 text-sm font-medium">
                <span className="flex items-center gap-1.5">
                  <Mail size={15} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span className="truncate max-w-[240px] sm:max-w-none">{authUser?.email}</span>
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-600" />
                <span className="flex items-center gap-1.5">
                  <Calendar size={15} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span>Joined {joinDate}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          {(!profile?.isManager && !profile?.isSuperAdmin) && (
            <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full lg:w-auto">
              {/* Total Builds */}
              <Paper
                withBorder
                radius="lg"
                p="md"
                className="bg-white/80 dark:bg-[#121824]/90 border-slate-200 dark:border-white/10 shadow-sm min-w-[110px] sm:min-w-[130px] text-center sm:text-left"
              >
                <Group justify="space-between" mb={4}>
                  <Text size="xs" fw={700} className="uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Builds
                  </Text>
                  <ThemeIcon size="xs" radius="xl" color="cyan" variant="light">
                    <Package size={12} />
                  </ThemeIcon>
                </Group>
                <Text className="text-2xl font-headline font-bold text-slate-900 dark:text-white">
                  {stats.totalBuilds}
                </Text>
              </Paper>

              {/* Active Orders */}
              <Paper
                withBorder
                radius="lg"
                p="md"
                className="bg-white/80 dark:bg-[#121824]/90 border-slate-200 dark:border-white/10 shadow-sm min-w-[110px] sm:min-w-[130px] text-center sm:text-left"
              >
                <Group justify="space-between" mb={4}>
                  <Text size="xs" fw={700} className="uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Active
                  </Text>
                  <ThemeIcon size="xs" radius="xl" color="blue" variant="light">
                    <Truck size={12} />
                  </ThemeIcon>
                </Group>
                <Text className="text-2xl font-headline font-bold text-cyan-600 dark:text-cyan-400">
                  {stats.activeBuilds}
                </Text>
              </Paper>

              {/* Investment Value */}
              <Paper
                withBorder
                radius="lg"
                p="md"
                className="bg-white/80 dark:bg-[#121824]/90 border-slate-200 dark:border-white/10 shadow-sm min-w-[120px] sm:min-w-[150px] text-center sm:text-left"
              >
                <Group justify="space-between" mb={4}>
                  <Text size="xs" fw={700} className="uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Rig Value
                  </Text>
                  <ThemeIcon size="xs" radius="xl" color="teal" variant="light">
                    <Cpu size={12} />
                  </ThemeIcon>
                </Group>
                <Text className="text-xl sm:text-2xl font-headline font-bold text-emerald-600 dark:text-emerald-400 truncate">
                  {formatCurrency(stats.totalValue)}
                </Text>
              </Paper>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
