'use client';

import { motion } from 'framer-motion';
import { SectionHeader } from './section-header';
import { useTheme } from '@/context/theme-provider';
import { cn } from '@/lib/utils';
import { Paper, ThemeIcon, Text, Badge, Group } from '@mantine/core';
import { Code, FileText, UserCheck, Palette, Github, Linkedin, Twitter } from 'lucide-react';

const teamMembers = [
  {
    role: "Lead Full-Stack Developer",
    name: "Rayzon Virgen",
    description: "Responsible for core application architecture, Firebase integration, AI flow orchestration, and real-time validation engines.",
    image: "/team/developer_m.png",
    icon: Code,
    color: "cyan",
  },
  {
    role: "Technical Documentation",
    name: "Robert Codilla",
    description: "Led technical research, curated component tier hierarchies, and authored platform documentation and system specifications.",
    image: "/team/documentation_m.png",
    icon: FileText,
    color: "blue",
  },
  {
    role: "Project Manager",
    name: "John Vincent Dela Rosa",
    description: "Coordinated development milestones, aligned research outcomes, and ensured technical deliverables adhered to capstone standards.",
    image: "/team/pm_m.png",
    icon: UserCheck,
    color: "violet",
  },
  {
    role: "UI/UX Designer",
    name: "John Christian Gripon",
    description: "Created user interface prototypes, interactive design systems, and responsive layouts focused on accessibility and usability.",
    image: "/team/ui_m.png",
    icon: Palette,
    color: "pink",
  }
];

export function TeamSection() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <section className="py-32 relative overflow-hidden transition-colors duration-1000">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 relative z-10 max-w-7xl mx-auto">
        <SectionHeader
          badge="STI College Cubao • BSIT Capstone"
          title="Meet The Team"
          subtitle="Building the future of accessible custom PC configuration. An academic capstone project dedicated to eliminating hardware guesswork through innovation."
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
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />

                    {/* Role Icon Floating */}
                    <div className="absolute top-3 right-3">
                      <ThemeIcon size={38} radius="md" variant="light" color={member.color} className="backdrop-blur-md shadow-md">
                        <member.icon size={18} />
                      </ThemeIcon>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 mb-4">
                    <Badge variant="light" color={member.color} size="sm" radius="md" className="font-bold tracking-wider uppercase">
                      {member.role}
                    </Badge>
                    <h3 className="text-xl font-bold font-headline uppercase tracking-tight text-slate-900 dark:text-slate-100">
                      {member.name}
                    </h3>
                    <Text size="sm" className="leading-relaxed font-medium text-slate-600 dark:text-slate-400">
                      {member.description}
                    </Text>
                  </div>
                </div>

                {/* Social links */}
                <div className="flex items-center gap-4 pt-4 border-t border-slate-200/60 dark:border-white/10 text-slate-400 dark:text-slate-500">
                  <Github size={16} className="cursor-pointer hover:text-cyan-500 transition-colors" />
                  <Linkedin size={16} className="cursor-pointer hover:text-cyan-500 transition-colors" />
                  <Twitter size={16} className="cursor-pointer hover:text-cyan-500 transition-colors" />
                </div>
              </Paper>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
