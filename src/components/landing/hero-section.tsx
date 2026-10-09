"use client";

import { motion } from 'framer-motion';
import {
  Paper,
  Badge,
  Progress,
  ThemeIcon,
  Text,
  Group,
  Stack,
  Button as MantineButton,
} from '@mantine/core';
import {
  Sparkles,
  LayoutPanelLeft,
  Cpu,
  Zap,
  CheckCircle2,
  HardDrive,
  Layers,
  ArrowRight,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CanvasText } from '@/components/ui/canvas-text';

interface HeroSectionProps {
  isDark: boolean;
}

const previewParts = [
  {
    role: "Processor",
    name: "AMD Ryzen 7 7800X3D",
    spec: "8-Core • 5.0 GHz Max",
    icon: Cpu,
    color: "cyan",
  },
  {
    role: "Graphics",
    name: "NVIDIA GeForce RTX 4080 Super",
    spec: "16GB GDDR6X • DLSS 3.5",
    icon: Layers,
    color: "blue",
  },
  {
    role: "Memory",
    name: "32GB (2x16GB) DDR5-6000 CL30",
    spec: "Dual Channel • Low Latency",
    icon: Activity,
    color: "indigo",
  },
  {
    role: "Storage",
    name: "2TB PCIe 4.0 NVMe SSD",
    spec: "7,400 MB/s Read Speed",
    icon: HardDrive,
    color: "teal",
  },
];

export function HeroSection({ isDark }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Full Screen Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/hero-custom.webp"
          alt="BuildbotAI Custom PC Rig"
          className="w-full h-full object-cover opacity-70"
        />
        {/* Gradients for Content Legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Ambient Lighting */}
      <div
        className={cn(
          "absolute inset-0 opacity-30 z-0 pointer-events-none",
          isDark
            ? "bg-[radial-gradient(circle_at_30%_50%,rgba(34,211,238,0.15),transparent_50%)]"
            : "bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent_50%)]"
        )}
      />

      <div className="w-full relative z-10 px-4 sm:px-6 md:px-8 lg:px-10 py-20">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Heading & Value Proposition */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-7 text-left"
          >
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <div className="h-px w-10 bg-cyan-500" />
              <Badge
                variant="light"
                color="cyan"
                size="lg"
                radius="xl"
                leftSection={<Sparkles size={14} className="animate-pulse" />}
                className="font-bold tracking-widest uppercase py-2.5 px-4"
              >
                BuildbotAI Platform
              </Badge>
            </div>

            <h1 className="font-headline text-4xl sm:text-6xl md:text-7xl lg:text-[7.5rem] font-black tracking-tighter mb-6 md:mb-8 leading-[0.95] md:leading-[0.85] uppercase">
              Build Your <br />
              <CanvasText
                text="MASTERPIECE"
                className="italic text-primary font-headline"
                backgroundClassName="bg-blue-600 dark:bg-blue-900"
                colors={["rgba(34, 211, 238, 1)"]}
                animationDuration={12}
                lineGap={5}
                curveIntensity={35}
              />
              <br className="hidden sm:block" />
              With <span className={isDark ? "text-slate-100" : "text-slate-900"}>AI</span>
            </h1>

            <p
              className={cn(
                "max-w-xl text-lg md:text-xl mb-8 md:mb-12 leading-relaxed font-medium",
                isDark ? "text-slate-300" : "text-slate-600"
              )}
            >
              Configure high-performance custom PCs with real-time bottleneck checking,
              thermal headroom verification, and intelligent part compatibility.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-4">
              <MantineButton
                component={Link}
                href="/signin"
                size="xl"
                radius="md"
                color="cyan"
                rightSection={<LayoutPanelLeft size={20} />}
                className="h-14 md:h-16 px-8 text-base font-headline font-bold uppercase tracking-wider text-white shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Launch Builder
              </MantineButton>

              <MantineButton
                component={Link}
                href="/signin"
                size="xl"
                radius="md"
                variant="default"
                leftSection={<Sparkles size={18} className="text-cyan-500" />}
                className={cn(
                  "h-14 md:h-16 px-8 text-base font-headline font-bold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98]",
                  isDark
                    ? "bg-[#111722]/80 border-white/10 text-slate-100 hover:bg-[#141a23]"
                    : "bg-white/90 border-slate-200 text-slate-900 hover:bg-slate-50"
                )}
              >
                AI Advisor
              </MantineButton>
            </div>

            {/* Quick Guarantees */}
            <div className="grid grid-cols-3 gap-4 pt-10 mt-8 border-t border-slate-200/60 dark:border-white/10 max-w-lg">
              <div>
                <p className="text-xl sm:text-2xl font-bold font-headline text-slate-900 dark:text-slate-100">100%</p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pinpoint Fit</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold font-headline text-cyan-600 dark:text-cyan-400">Zero</p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bottlenecks</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold font-headline text-emerald-600 dark:text-emerald-400">2-Year</p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Warranty</p>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Sleek Mantine Spec & Performance Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="lg:col-span-5 relative"
          >
            {/* Main Spec Paper */}
            <Paper
              withBorder
              radius="2xl"
              p={{ base: 'md', sm: 'xl' }}
              className={cn(
                "relative backdrop-blur-2xl transition-all shadow-2xl",
                isDark
                  ? "bg-[#111722]/90 border-white/10 shadow-black/60"
                  : "bg-white/95 border-slate-200/90 shadow-slate-300/40"
              )}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200/60 dark:border-white/10">
                <Group gap="xs">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <Text size="xs" fw={700} className="uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Live System Check
                  </Text>
                </Group>
                <Badge color="teal" variant="light" size="sm" radius="md">
                  Optimal Balance
                </Badge>
              </div>

              {/* Verified Parts List */}
              <Stack gap="xs" className="mb-6">
                {previewParts.map((part) => (
                  <Paper
                    key={part.role}
                    withBorder
                    radius="lg"
                    p="sm"
                    className={cn(
                      "transition-colors",
                      isDark
                        ? "bg-slate-900/40 border-white/5 hover:border-cyan-500/30"
                        : "bg-slate-50 border-slate-200/80 hover:border-cyan-500/30"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Group gap="sm" wrap="nowrap" className="min-w-0">
                        <ThemeIcon color={part.color} variant="light" size="md" radius="md">
                          <part.icon size={16} />
                        </ThemeIcon>
                        <div className="min-w-0">
                          <Text size="xs" fw={700} c="dimmed" className="uppercase tracking-wider">
                            {part.role}
                          </Text>
                          <Text size="sm" fw={600} truncate className="text-slate-900 dark:text-slate-100">
                            {part.name}
                          </Text>
                        </div>
                      </Group>
                      <ThemeIcon color="teal" variant="subtle" size="sm" radius="xl">
                        <CheckCircle2 size={16} />
                      </ThemeIcon>
                    </div>
                  </Paper>
                ))}
              </Stack>

              {/* Power Draw & Headroom */}
              <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Power Consumption</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">485W / 750W (65%)</span>
                </div>
                <Progress value={65} color="cyan" size="sm" radius="xl" />
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Zero Bottleneck: &lt; 1.2%</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Ready to Assemble</span>
                </div>
              </div>
            </Paper>

            {/* Floating Satellite Badge */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 -left-4 sm:-left-6 z-20"
            >
              <Paper
                withBorder
                radius="xl"
                p="md"
                className={cn(
                  "shadow-xl backdrop-blur-xl flex items-center gap-3",
                  isDark
                    ? "bg-[#111722]/95 border-white/10"
                    : "bg-white/95 border-slate-200"
                )}
              >
                <ThemeIcon color="cyan" variant="light" size="lg" radius="md">
                  <ShieldCheck size={20} />
                </ThemeIcon>
                <div>
                  <Text size="xs" fw={700} className="uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Confidence Score
                  </Text>
                  <Text size="sm" fw={800} className="text-slate-900 dark:text-slate-100">
                    99.8% Hardware Synergy
                  </Text>
                </div>
              </Paper>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

