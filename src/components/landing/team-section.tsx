'use client';

import { motion } from 'framer-motion';
import { SectionHeader } from './section-header';
import { useTheme } from '@/context/theme-provider';
import { cn } from '@/lib/utils';
import { Code, FileText, UserCheck, Palette, Github, Linkedin, Twitter } from 'lucide-react';

const teamMembers = [
  {
    role: "Lead Developer",
    name: "Rayzon Virgen",
    description: "Responsible for full-stack development, implementing the core logic, AI integrations, and real-time validation systems.",
    image: "/team/developer_m.png",
    icon: Code,
    color: "text-cyan-400",
    borderColor: "border-cyan-500/20",
    bgColor: "bg-cyan-500/10",
  },
  {
    role: "Technical Documentation",
    name: "Robert Codilla",
    description: "Managed technical specifications, hardware research, and authored the comprehensive documentation for the platform.",
    image: "/team/documentation_m.png",
    icon: FileText,
    color: "text-blue-400",
    borderColor: "border-blue-500/20",
    bgColor: "bg-blue-500/10",
  },
  {
    role: "Project Manager",
    name: "John Vincent Dela Rosa",
    description: "Coordinated development timelines, managed team resources, and ensured the project aligned with capstone objectives.",
    image: "/team/pm_m.png",
    icon: UserCheck,
    color: "text-purple-400",
    borderColor: "border-purple-500/20",
    bgColor: "bg-purple-500/10",
  },
  {
    role: "UI/UX Designer",
    name: "John Christian Gripon",
    description: "Designed the high-fidelity user interface and interactive experience, focusing on modern aesthetics and usability.",
    image: "/team/ui_m.png",
    icon: Palette,
    color: "text-pink-400",
    borderColor: "border-pink-500/20",
    bgColor: "bg-pink-500/10",
  }
];

export function TeamSection() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <section className="py-32 relative overflow-hidden transition-colors duration-1000">

      <div className="max-w-[1800px] w-full mx-auto px-4 md:px-8 relative z-10">
        <SectionHeader
          badge="BSIT Capstone Project"
          title="Meet The Team"
          subtitle="Building the future of PC assembly. A Capstone Project by STI College BSIT students, dedicated to simplifying hardware selection through innovation."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.role}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={cn(
                "group relative p-8 rounded-[32px] border transition-all duration-500 hover:scale-[1.02]",
                isDark
                  ? "bg-slate-900/40 border-white/5 hover:border-primary/30"
                  : "bg-slate-50/50 border-slate-200 hover:border-primary/20 shadow-sm"
              )}
            >
              {/* Member Image Wrapper */}
              <div className="relative mb-8 aspect-square rounded-2xl overflow-hidden border border-white/10 group-hover:border-primary/40 transition-colors duration-500">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                {/* Role Icon Floating */}
                <div className={cn(
                  "absolute top-4 right-4 p-3 rounded-xl backdrop-blur-xl border flex items-center justify-center transition-transform duration-500 group-hover:rotate-12",
                  member.bgColor,
                  member.borderColor
                )}>
                  <member.icon className={cn("w-5 h-5", member.color)} />
                </div>
              </div>

              {/* Info */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-[0.3em]",
                    member.color
                  )}>
                    {member.role}
                  </p>
                  <h3 className={cn(
                    "text-2xl font-black font-headline uppercase tracking-tight",
                    isDark ? "text-white" : "text-slate-900"
                  )}>
                    {member.name}
                  </h3>
                </div>

                <p className={cn(
                  "text-sm leading-relaxed font-medium",
                  isDark ? "text-slate-400" : "text-slate-600"
                )}>
                  {member.description}
                </p>

                {/* Social links placeholder */}
                <div className="flex items-center gap-4 pt-4 opacity-40 group-hover:opacity-100 transition-opacity">
                  <Github className="w-4 h-4 cursor-pointer hover:text-primary transition-colors" />
                  <Linkedin className="w-4 h-4 cursor-pointer hover:text-primary transition-colors" />
                  <Twitter className="w-4 h-4 cursor-pointer hover:text-primary transition-colors" />
                </div>
              </div>

              {/* Decorative line on hover */}
              <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
