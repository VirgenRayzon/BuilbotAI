'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { SectionHeader } from './section-header';
import { useTheme } from '@/context/theme-provider';
import { cn } from '@/lib/utils';
import { Paper, ThemeIcon, Text, Badge, Group } from '@mantine/core';
import { Code, FileText, UserCheck, Palette, Sparkles, Building2 } from 'lucide-react';
import devImage from '@/assets/team/rayzon.png';
import docImage from '@/assets/team/documentation_m.png';
import pmImage from '@/assets/team/pm_m.png';
import uiImage from '@/assets/team/ui_m.png';

const teamMembers = [
  {
    role: "Lead Full-Stack Developer",
    name: "Rayzon Virgen",
    description: "Responsible for core application architecture, Firebase integration, AI flow orchestration, and real-time validation engines.",
    image: devImage,
    icon: Code,
    color: "cyan",
  },
  {
    role: "Technical Documentation",
    name: "Robert Codilla",
    description: "Led technical research, curated component tier hierarchies, and authored platform documentation and system specifications.",
    image: docImage,
    icon: FileText,
    color: "blue",
  },
  {
    role: "Project Manager",
    name: "John Vincent Dela Rosa",
    description: "Coordinated development milestones, aligned research outcomes, and ensured technical deliverables adhered to capstone standards.",
    image: pmImage,
    icon: UserCheck,
    color: "violet",
  },
  {
    role: "UI/UX Designer",
    name: "John Christian Gripon",
    description: "Created user interface prototypes, interactive design systems, and responsive layouts focused on accessibility and usability.",
    image: uiImage,
    icon: Palette,
    color: "pink",
  }
];

export function TeamSection() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <section className="py-32 relative overflow-hidden transition-colors duration-1000">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-8 xl:px-10 relative z-10">
        <SectionHeader
          badge="STI College Cubao • BSIT Capstone"
          title="Meet The Group"
          subtitleClassName="max-w-4xl"
          subtitle={
            <div className="relative mx-auto mt-2 rounded-2xl border border-slate-200/80 bg-white/60 p-6 sm:p-8 backdrop-blur-md dark:border-white/10 dark:bg-[#111722]/60 shadow-lg dark:shadow-black/20">
              <p className="text-center text-sm sm:text-base md:text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                This capstone project proposal titled{' '}
                <strong className="font-bold text-cyan-700 dark:text-cyan-300">
                  BUILDBOT AI: A Machine Learning Enhanced for Personalized PC Components Selection and Budget Optimization
                </strong>
                , prepared and submitted by{' '}
                <strong className="font-semibold text-slate-900 dark:text-slate-100 underline decoration-cyan-500/40 decoration-2 underline-offset-4">
                  Robert C. Codilla
                </strong>
                ,{' '}
                <strong className="font-semibold text-slate-900 dark:text-slate-100 underline decoration-cyan-500/40 decoration-2 underline-offset-4">
                  John Vincent Dela Rosa
                </strong>
                ,{' '}
                <strong className="font-semibold text-slate-900 dark:text-slate-100 underline decoration-cyan-500/40 decoration-2 underline-offset-4">
                  John Christian G. Gripon
                </strong>
                , and{' '}
                <strong className="font-semibold text-slate-900 dark:text-slate-100 underline decoration-cyan-500/40 decoration-2 underline-offset-4">
                  Rayzon Z. Virgen
                </strong>
                , in partial fulfillment of the requirements for the degree of Bachelor of Science in Information Technology, has been examined and is recommended for acceptance and approval.
              </p>
            </div>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.role}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="h-full"
            >
              <Paper
                withBorder
                radius="2xl"
                p="lg"
                className={cn(
                  "h-full flex flex-col justify-between group transition-all duration-300 hover:scale-[1.02]",
                  isDark
                    ? "bg-[#111722]/85 border-white/10 hover:border-cyan-500/30 shadow-xl shadow-black/40"
                    : "bg-white/95 border-slate-200 hover:border-cyan-500/30 shadow-lg shadow-slate-200/60"
                )}
              >
                <div>
                  {/* Member Image Wrapper */}
                  <div className="relative mb-6 aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 group-hover:border-cyan-500/40 transition-colors duration-300">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 z-10" />

                    {/* Role Icon Floating */}
                    <div className="absolute top-3 right-3 z-20">
                      <ThemeIcon size={38} radius="md" variant="light" color={member.color} className="backdrop-blur-md shadow-md">
                        <member.icon size={18} />
                      </ThemeIcon>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-2">
                    <Badge variant="light" color={member.color} size="sm" radius="md" className="font-bold tracking-wider uppercase">
                      {member.role}
                    </Badge>
                    <h3 className="text-xl font-bold font-headline uppercase tracking-tight text-slate-900 dark:text-slate-100">
                      {member.name}
                    </h3>
                  </div>
                </div>
              </Paper>
            </motion.div>
          ))}
        </div>

        {/* Project Purpose & Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-16 sm:mt-24"
        >
          <div className="relative mx-auto max-w-5xl rounded-3xl border border-slate-200/90 bg-gradient-to-b from-white/95 to-slate-50/90 p-8 sm:p-12 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:from-[#111722]/95 dark:to-[#0c1017]/95 dark:shadow-black/50">
            {/* Header Badge */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/70 pb-6 dark:border-white/10">
              <div className="flex items-center gap-3">
                <ThemeIcon size={38} radius="xl" variant="light" color="cyan">
                  <Sparkles size={20} />
                </ThemeIcon>
                <div>
                  <Badge variant="light" color="cyan" size="sm" radius="md" className="font-bold tracking-wider uppercase">
                    Capstone Objectives
                  </Badge>
                  <h3 className="text-xl sm:text-2xl font-bold font-headline uppercase tracking-tight text-slate-900 dark:text-slate-100 mt-1">
                    Project Overview & Purpose
                  </h3>
                </div>
              </div>
            </div>

            {/* Content Cards */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {/* Card 1: Individual Builders */}
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200/70 bg-white/70 p-6 sm:p-8 dark:border-white/5 dark:bg-white/[0.02] shadow-sm">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-cyan-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                    <Sparkles size={14} /> Core Intelligent Solution
                  </div>
                  <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
                    The main purpose of <strong className="font-semibold text-slate-900 dark:text-slate-100">BuildBot AI</strong> is to provide an intelligent and efficient solution for selecting compatible PC components based on a user’s specific needs and budget. Through a machine learning enhanced recommendation system, users can input their preferred budget range, intended usage such as gaming, editing, or office work, and performance priorities.
                  </p>
                </div>
                <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] p-3.5 text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  Eliminates extensive manual research, reduces confusion in component selection, and simplifies decision-making for first-time builders.
                </div>
              </div>

              {/* Card 2: Decision Support & Industry */}
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200/70 bg-white/70 p-6 sm:p-8 dark:border-white/5 dark:bg-white/[0.02] shadow-sm">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    <Building2 size={14} /> Decision Support System
                  </div>
                  <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
                    In addition to assisting individual users, <strong className="font-semibold text-slate-900 dark:text-slate-100">BuildBot AI</strong> can also serve as a decision support tool for computer shops, students, gamers, IT professionals, and system builders.
                  </p>
                </div>
                <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-3.5 text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  Provides data-driven recommendations and compatibility validation, reducing errors and ensuring balanced performance allocation for improved customer satisfaction.
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
