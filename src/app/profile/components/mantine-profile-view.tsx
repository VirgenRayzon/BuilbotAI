"use client";

import React, { useMemo } from "react";
import {
  Paper,
  Title,
  Text,
  Badge,
  Button,
  Grid,
  Group,
  Stack,
  Avatar,
  Breadcrumbs,
  Anchor,
  ThemeIcon,
  Table,
} from "@mantine/core";
import {
  User as UserIcon,
  Mail,
  MapPin,
  Briefcase,
  ExternalLink,
  MessageSquare,
  Package,
  Heart,
  TrendingUp,
  Cpu,
  Layers,
  Facebook,
  Twitter,
  Linkedin,
  Github,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { UserProfile, Order } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";

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
  reservations = [],
  favorites = [],
  stats = { totalBuilds: 0, activeBuilds: 0, totalValue: 0 },
}: MantineProfileViewProps) {
  const router = useRouter();

  const isSuperAdmin = Boolean(profile?.isSuperAdmin);
  const isManager = Boolean(profile?.isManager && !profile?.isSuperAdmin);

  const displayName = profile?.name || authUser?.displayName || "Buildbot Explorer";
  const email = profile?.email || authUser?.email || "user@buildbotai.com";
  const bio =
    profile?.bio ||
    "Hardware and PC building enthusiast. Experienced in custom system configuration, cooling loops, and high-performance gaming rigs.";

  const locationText = [profile?.city, profile?.state].filter(Boolean).join(", ") || "Manila, Philippines";

  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Activity chart data derived from builds or fallback activity curve
  const chartData = useMemo(() => {
    return [
      { time: "00:00", series1: 25, series2: 15 },
      { time: "01:30", series1: 42, series2: 30 },
      { time: "02:30", series1: 32, series2: 24 },
      { time: "03:30", series1: 50, series2: 45 },
      { time: "04:30", series1: 65, series2: 48 },
      { time: "05:30", series1: 88, series2: 60 },
      { time: "06:30", series1: 110, series2: 75 },
    ];
  }, []);

  const breadcrumbItems = [
    { title: "Dashboard", href: isSuperAdmin || isManager ? "/admin" : "/builder" },
    { title: "Apps", href: "/profile" },
    { title: "Profile", href: "#" },
  ].map((item, index) => (
    <Anchor
      key={index}
      href={item.href}
      size="xs"
      className="text-slate-500 hover:text-blue-500 dark:text-slate-400 dark:hover:text-blue-400 font-medium"
    >
      {item.title}
    </Anchor>
  ));

  const skills = [
    "PC BUILDER",
    "GAMING RIGS",
    "WORKSTATION",
    "OVERCLOCKING",
    "LIQUID COOLING",
    "AI ADVISOR",
    "MANTINE UI",
  ];

  // Combined recent projects/builds from favorites and reservations
  const recentItems = useMemo(() => {
    const items: Array<{
      name: string;
      date: string;
      state: string;
      stateColor: string;
      value: string;
      id?: string;
    }> = [];

    const parseSafeDate = (val: any) => {
      if (!val) return "Recent";
      try {
        if (typeof val.toDate === "function") return val.toDate().toLocaleDateString();
        if (val.seconds) return new Date(val.seconds * 1000).toLocaleDateString();
        const d = new Date(val);
        if (!isNaN(d.getTime())) return d.toLocaleDateString();
      } catch {
        // Fallback
      }
      return "Recent";
    };

    favorites.slice(0, 5).forEach((fav) => {
      items.push({
        name: fav.name || "Custom Performance Build",
        date: parseSafeDate(fav.createdAt),
        state: "Saved Rig",
        stateColor: "blue",
        value: fav.totalPrice ? formatCurrency(fav.totalPrice) : "Custom",
        id: fav.id,
      });
    });

    reservations.slice(0, 3).forEach((res) => {
      items.push({
        name: `Reservation #${res.id.slice(0, 6)}`,
        date: parseSafeDate(res.createdAt),
        state: res.status === "finished building" ? "Completed" : res.status === "building" ? "Building" : "Pending",
        stateColor: res.status === "finished building" ? "teal" : res.status === "building" ? "indigo" : "orange",
        value: formatCurrency(res.totalPrice),
        id: res.id,
      });
    });

    if (items.length === 0) {
      items.push(
        {
          name: "Enthusiast Gaming Rig (RTX 4080)",
          date: "10/04/2026",
          state: "Completed",
          stateColor: "teal",
          value: "₱145,000",
        },
        {
          name: "Compact ITX Workstation",
          date: "09/28/2026",
          state: "In Progress",
          stateColor: "blue",
          value: "₱89,500",
        },
        {
          name: "Budget Esports Battlestation",
          date: "09/15/2026",
          state: "Saved Rig",
          stateColor: "indigo",
          value: "₱42,000",
        }
      );
    }

    return items;
  }, [favorites, reservations]);

  return (
    <div className="space-y-6">


      {/* Profile Card */}
      <div className="w-full">
        <div className="w-full">
          <Paper
            withBorder
            radius="lg"
            p="xl"
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
