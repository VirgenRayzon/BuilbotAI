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
      {/* Header and Breadcrumbs */}
      <div>
        <Breadcrumbs separator="/" mb={4} className="text-xs">
          {breadcrumbItems}
        </Breadcrumbs>
        <Title
          order={2}
          className="text-2xl font-bold font-headline text-slate-900 dark:text-slate-100 tracking-tight"
        >
          Profile
        </Title>
      </div>

      {/* Main 2-Column Layout */}
      <Grid gutter="md">
        {/* LEFT COLUMN (approx 1/3) */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md">
            {/* Card 1: Profile Details */}
            <Paper
              withBorder
              radius="md"
              p="xl"
              className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm text-center flex flex-col items-center"
            >
              <Text size="xs" fw={700} className="uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                Profile details
              </Text>

              <Avatar
                src={profile?.photoURL || authUser?.photoURL}
                size={88}
                radius="xl"
                color="blue"
                className="mb-3 border-2 border-white dark:border-slate-800 shadow-md ring-2 ring-blue-500/20"
              >
                {initials}
              </Avatar>

              <Title order={4} className="text-lg font-bold font-headline text-slate-900 dark:text-slate-100">
                {displayName}
              </Title>

              <Text size="xs" className="text-slate-500 dark:text-slate-400 mb-2">
                {email}
              </Text>

              <Badge
                size="sm"
                variant="light"
                color={isSuperAdmin ? "indigo" : isManager ? "orange" : "blue"}
                className="font-bold text-[10px] uppercase tracking-wider mb-3"
              >
                {isSuperAdmin ? "Super Admin" : isManager ? "Store Manager" : "Verified Customer"}
              </Badge>

              <Text size="xs" className="text-slate-600 dark:text-slate-400 text-center leading-relaxed mb-4 line-clamp-3">
                {bio}
              </Text>

              <Button
                variant="outline"
                color="blue"
                size="xs"
                radius="md"
                fullWidth
                onClick={onNavigateToSettings}
                className="font-semibold text-xs"
              >
                Edit Settings
              </Button>
            </Paper>

            {/* Card 2: Skills & Tags */}
            <Paper
              withBorder
              radius="md"
              p="lg"
              className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm"
            >
              <Title order={5} className="text-sm font-bold font-headline text-slate-900 dark:text-slate-100 mb-3">
                Skills & Interests
              </Title>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <Badge
                    key={skill}
                    size="sm"
                    radius="sm"
                    variant="filled"
                    color="blue"
                    className="font-bold text-[10px] tracking-wider uppercase bg-blue-600 hover:bg-blue-700"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </Paper>

            {/* Card 3: About */}
            <Paper
              withBorder
              radius="md"
              p="lg"
              className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm"
            >
              <Title order={5} className="text-sm font-bold font-headline text-slate-900 dark:text-slate-100 mb-3">
                About
              </Title>
              <Stack gap="xs" className="text-xs text-slate-600 dark:text-slate-300">
                <Group gap="xs" wrap="nowrap">
                  <MapPin size={15} className="text-slate-400 shrink-0" />
                  <span>Lives in <strong className="text-slate-800 dark:text-slate-100 font-semibold">{locationText}</strong></span>
                </Group>
                <Group gap="xs" wrap="nowrap">
                  <Briefcase size={15} className="text-slate-400 shrink-0" />
                  <span>Member at <strong className="text-slate-800 dark:text-slate-100 font-semibold">Buildbot AI Store</strong></span>
                </Group>
                <Group gap="xs" wrap="nowrap">
                  <Mail size={15} className="text-slate-400 shrink-0" />
                  <span className="truncate">Email: <strong className="text-slate-800 dark:text-slate-100 font-semibold">{email}</strong></span>
                </Group>
              </Stack>
            </Paper>

            {/* Card 4: Social */}
            <Paper
              withBorder
              radius="md"
              p="lg"
              className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm"
            >
              <Title order={5} className="text-sm font-bold font-headline text-slate-900 dark:text-slate-100 mb-3">
                Social
              </Title>
              <Stack gap="xs" className="text-xs">
                <Anchor href="https://facebook.com" target="_blank" className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400 hover:text-blue-600">
                  <Facebook size={15} className="text-blue-600" />
                  <span className="font-medium">Facebook</span>
                </Anchor>
                <Anchor href="https://twitter.com" target="_blank" className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400 hover:text-sky-500">
                  <Twitter size={15} className="text-sky-500" />
                  <span className="font-medium">Twitter / X</span>
                </Anchor>
                <Anchor href="https://linkedin.com" target="_blank" className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400 hover:text-blue-700">
                  <Linkedin size={15} className="text-blue-700" />
                  <span className="font-medium">LinkedIn</span>
                </Anchor>
                <Anchor href="https://github.com" target="_blank" className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  <Github size={15} className="text-slate-800 dark:text-slate-200" />
                  <span className="font-medium">Github</span>
                </Anchor>
              </Stack>
            </Paper>
          </Stack>
        </Grid.Col>

        {/* RIGHT COLUMN (approx 2/3) */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="md">
            {/* Card 1: Activity & Valuation Chart */}
            <Paper
              withBorder
              radius="md"
              p="lg"
              className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm"
            >
              <Group justify="space-between" mb="md">
                <div>
                  <Title order={4} className="text-base font-bold font-headline text-slate-900 dark:text-slate-100">
                    Build Activity & Valuation
                  </Title>
                  <Text size="xs" className="text-slate-500 dark:text-slate-400">
                    System activity, part reservations, and hardware configuration volume
                  </Text>
                </div>
                <Badge size="xs" variant="light" color="blue">
                  Live Insights
                </Badge>
              </Group>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="profileSeries1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="profileSeries2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.15)" />
                    <XAxis
                      dataKey="time"
                      tick={{ fill: "#888888", fontSize: 11 }}
                      axisLine={{ stroke: "rgba(150, 150, 150, 0.2)" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#888888", fontSize: 11 }}
                      axisLine={{ stroke: "rgba(150, 150, 150, 0.2)" }}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        borderColor: "rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "#fff",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="series1"
                      name="Build Activity"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#profileSeries1)"
                    />
                    <Area
                      type="monotone"
                      dataKey="series2"
                      name="Reservation Volume"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#profileSeries2)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Paper>

            {/* Row of 3 Stat Cards */}
            <Grid gutter="sm">
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Paper
                  withBorder
                  radius="md"
                  p="md"
                  className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm"
                >
                  <Group justify="space-between" align="flex-start" mb="xs">
                    <div>
                      <Text size="xs" fw={700} className="text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Total Builds
                      </Text>
                      <Title order={3} className="text-2xl font-bold font-headline text-slate-900 dark:text-slate-100 mt-1">
                        {stats.totalBuilds || favorites.length || 3}
                      </Title>
                    </div>
                    <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                      <Cpu size={18} />
                    </ThemeIcon>
                  </Group>
                  <Text size="xs" className="text-blue-600 dark:text-blue-400 font-semibold">
                    Saved Rigs in Workspace
                  </Text>
                </Paper>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Paper
                  withBorder
                  radius="md"
                  p="md"
                  className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm"
                >
                  <Group justify="space-between" align="flex-start" mb="xs">
                    <div>
                      <Text size="xs" fw={700} className="text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Reservations
                      </Text>
                      <Title order={3} className="text-2xl font-bold font-headline text-slate-900 dark:text-slate-100 mt-1">
                        {stats.activeBuilds || reservations.length || 1}
                      </Title>
                    </div>
                    <ThemeIcon size="lg" radius="md" color="teal" variant="light">
                      <Package size={18} />
                    </ThemeIcon>
                  </Group>
                  <Text size="xs" className="text-teal-600 dark:text-teal-400 font-semibold">
                    Store Pick-up Tickets
                  </Text>
                </Paper>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Paper
                  withBorder
                  radius="md"
                  p="md"
                  className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm"
                >
                  <Group justify="space-between" align="flex-start" mb="xs">
                    <div>
                      <Text size="xs" fw={700} className="text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Hardware Value
                      </Text>
                      <Title order={3} className="text-2xl font-bold font-headline text-slate-900 dark:text-slate-100 mt-1 truncate">
                        {stats.totalValue > 0 ? formatCurrency(stats.totalValue) : "₱145,000"}
                      </Title>
                    </div>
                    <ThemeIcon size="lg" radius="md" color="indigo" variant="light">
                      <TrendingUp size={18} />
                    </ThemeIcon>
                  </Group>
                  <Text size="xs" className="text-indigo-600 dark:text-indigo-400 font-semibold">
                    Total Estimated Rig Worth
                  </Text>
                </Paper>
              </Grid.Col>
            </Grid>

            {/* Card 3: Recent Builds & Projects Table */}
            <Paper
              withBorder
              radius="md"
              p="lg"
              className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm"
            >
              <Group justify="space-between" mb="md">
                <div>
                  <Title order={4} className="text-base font-bold font-headline text-slate-900 dark:text-slate-100">
                    Projects & Saved Builds
                  </Title>
                  <Text size="xs" className="text-slate-500 dark:text-slate-400">
                    Recent custom configurations and active reservation requests
                  </Text>
                </div>

                <Button
                  size="xs"
                  variant="light"
                  color="blue"
                  radius="md"
                  leftSection={<Cpu size={14} />}
                  onClick={() => router.push("/builder")}
                  className="font-semibold text-xs"
                >
                  Launch PC Builder
                </Button>
              </Group>

              <div className="overflow-x-auto">
                <Table striped highlightOnHover verticalSpacing="sm" className="text-xs">
                  <Table.Thead className="bg-slate-50 dark:bg-slate-900/50">
                    <Table.Tr>
                      <Table.Th className="text-slate-600 dark:text-slate-300 font-bold uppercase text-[11px] tracking-wider">
                        Name
                      </Table.Th>
                      <Table.Th className="text-slate-600 dark:text-slate-300 font-bold uppercase text-[11px] tracking-wider">
                        Date
                      </Table.Th>
                      <Table.Th className="text-slate-600 dark:text-slate-300 font-bold uppercase text-[11px] tracking-wider">
                        State
                      </Table.Th>
                      <Table.Th className="text-slate-600 dark:text-slate-300 font-bold uppercase text-[11px] tracking-wider text-right">
                        Est. Value
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {recentItems.map((item, idx) => (
                      <Table.Tr key={idx} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <Table.Td className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <ThemeIcon size="xs" radius="sm" color={item.stateColor} variant="light">
                            <Layers size={11} />
                          </ThemeIcon>
                          <span>{item.name}</span>
                        </Table.Td>
                        <Table.Td className="text-slate-500 dark:text-slate-400 font-mono">
                          {item.date}
                        </Table.Td>
                        <Table.Td>
                          <Badge size="xs" variant="light" color={item.stateColor} className="font-semibold uppercase tracking-wider">
                            {item.state}
                          </Badge>
                        </Table.Td>
                        <Table.Td className="text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                          {item.value}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </div>
            </Paper>
          </Stack>
        </Grid.Col>
      </Grid>
    </div>
  );
}
