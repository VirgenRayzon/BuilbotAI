"use client";

import { motion } from 'framer-motion';
import { SectionHeader } from '@/components/landing/section-header';
import { Paper, ThemeIcon, Text, Button as MantineButton, Group, Stack } from '@mantine/core';
import { Box, MonitorSmartphone, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AccessoriesSectionProps {
  isDark: boolean;
}

export function AccessoriesSection({ isDark }: AccessoriesSectionProps) {
  return (
    <section
      className={cn(
        "py-32 relative border-y transition-colors duration-1000",
        isDark ? "border-white/5" : "border-slate-200"
      )}
    >
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10">
        <SectionHeader
          badge="Complete Setups"
          title="Beyond The Tower"
          subtitle="Whether you prefer an expertly configured turnkey system or want to hand-pick peripherals, we've got you covered."
        />

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Card 1: Turnkey Pre-builts */}
          <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.3 }}>
            <Paper
              withBorder
              radius="2xl"
              p={{ base: 'xl', md: 40 }}
              className={cn(
                "h-full flex flex-col justify-between gap-8 transition-all duration-300",
                isDark
                  ? "bg-[#111722]/80 border-white/10 hover:border-cyan-500/40 shadow-xl shadow-black/40"
                  : "bg-white/90 border-slate-200 hover:border-cyan-500/30 shadow-lg shadow-slate-200/60"
              )}
            >
              <Stack gap="lg">
                <ThemeIcon size={64} radius="xl" variant="light" color="cyan">
                  <Box size={32} />
                </ThemeIcon>

                <div>
                  <h4 className="text-2xl sm:text-3xl font-bold font-headline uppercase tracking-tight mb-3 text-slate-900 dark:text-slate-100">
                    Turnkey Pre-Built Systems
                  </h4>
                  <Text
                    size="lg"
                    className="leading-relaxed font-medium text-slate-600 dark:text-slate-400"
                  >
                    Curated, stress-tested rigs assembled by hardware technicians and validated with our AI compatibility engine. Zero guesswork, ready out of the box.
                  </Text>
                </div>
              </Stack>

              <MantineButton
                component={Link}
                href="/pre-builts"
                variant="light"
                color="cyan"
                size="md"
                radius="md"
                rightSection={<ArrowRight size={18} />}
                className="w-fit font-headline font-bold uppercase tracking-wider"
              >
                Browse Systems
              </MantineButton>
            </Paper>
          </motion.div>

          {/* Card 2: Monitors & Peripherals */}
          <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.3 }}>
            <Paper
              withBorder
              radius="2xl"
              p={{ base: 'xl', md: 40 }}
              className={cn(
                "h-full flex flex-col justify-between gap-8 transition-all duration-300",
                isDark
                  ? "bg-[#111722]/80 border-white/10 hover:border-violet-500/40 shadow-xl shadow-black/40"
                  : "bg-white/90 border-slate-200 hover:border-violet-500/30 shadow-lg shadow-slate-200/60"
              )}
            >
              <Stack gap="lg">
                <ThemeIcon size={64} radius="xl" variant="light" color="violet">
                  <MonitorSmartphone size={32} />
                </ThemeIcon>

                <div>
                  <h4 className="text-2xl sm:text-3xl font-bold font-headline uppercase tracking-tight mb-3 text-slate-900 dark:text-slate-100">
                    Monitors & Peripherals
                  </h4>
                  <Text
                    size="lg"
                    className="leading-relaxed font-medium text-slate-600 dark:text-slate-400"
                  >
                    Complete your workstation with high-refresh gaming displays, mechanical keyboards, audio headsets, and performance thermal accessories.
                  </Text>
                </div>
              </Stack>

              <MantineButton
                component={Link}
                href="/builder"
                variant="light"
                color="violet"
                size="md"
                radius="md"
                rightSection={<ArrowRight size={18} />}
                className="w-fit font-headline font-bold uppercase tracking-wider"
              >
                Configure Accessories
              </MantineButton>
            </Paper>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

