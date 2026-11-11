"use client";

import React from "react";
import {
  Paper,
  Title,
  Text,
  Badge,
  Button,
  Avatar,
} from "@mantine/core";
import type { UserProfile, Order } from "@/lib/types";

interface MantineProfileViewProps {
  profile: UserProfile | null;
  authUser: any;
  onNavigateToSettings: () => void;
  reservations?: Order[];
  favorites?: any[];
  stats?: {
    totalBuilds: number;
    activeBuilds: number;
    totalValue: number;
  };
}

export function MantineProfileView({
  profile,
  authUser,
  onNavigateToSettings,
}: MantineProfileViewProps) {
  const isSuperAdmin = Boolean(profile?.isSuperAdmin);
  const isManager = Boolean(profile?.isManager && !profile?.isSuperAdmin);

  const displayName = profile?.name || authUser?.displayName || "Buildbot Explorer";
  const email = profile?.email || authUser?.email || "user@buildbotai.com";
  const bio =
    profile?.bio ||
    "Hardware and PC building enthusiast. Experienced in custom system configuration, cooling loops, and high-performance gaming rigs.";

  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">

      <div className="w-full">
        <div className="w-full">
          <Paper
            withBorder
            radius="lg"
            p={12}
            className="w-full bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm text-center flex flex-col items-center"
          >
            <Text size="xs" fw={700} mb="lg" className="uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Profile details
            </Text>

            <Avatar
              src={profile?.photoURL || authUser?.photoURL}
              size={170}
              radius="2xl"
              color="blue"
              mx="auto"
              mb="lg"
              className="border-4 border-white dark:border-slate-800 shadow-xl ring-2 ring-blue-500/20"
            >
              {initials}
            </Avatar>

            <Title order={3} ta="center" className="text-xl font-bold font-headline text-slate-900 dark:text-slate-100">
              {displayName}
            </Title>

            <Text size="sm" ta="center" mt={4} mb="sm" className="text-slate-500 dark:text-slate-400">
              {email}
            </Text>

            <Badge
              size="md"
              variant="light"
              color={isSuperAdmin ? "indigo" : isManager ? "orange" : "blue"}
              mb="lg"
              className="font-bold text-xs uppercase tracking-wider"
            >
              {isSuperAdmin ? "Super Admin" : isManager ? "Store Manager" : "Verified Customer"}
            </Badge>

            <Text
              size="sm"
              ta="center"
              maw={680}
              mx="auto"
              mb="xl"
              className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line"
            >
              {bio}
            </Text>

            <Button
              variant="outline"
              color="blue"
              size="sm"
              radius="md"
              w="100%"
              maw={320}
              mx="auto"
              onClick={onNavigateToSettings}
              className="font-semibold"
            >
              Edit Settings
            </Button>
          </Paper>
        </div>
      </div>
    </div>
  );
}
