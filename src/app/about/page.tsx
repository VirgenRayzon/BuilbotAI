'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  Paper,
  Title,
  Text,
  Badge,
  ThemeIcon,
  Modal,
  Button as MantineButton,
  Group,
  Stack,
  Loader,
} from '@mantine/core';
import {
  FileText,
  Sparkles,
  Maximize2,
  ChevronRight,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/theme-provider';

interface AboutSection {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  subItems?: { title: string; content: string; imageUrl?: string }[];
}

interface AboutContent {
  title: string;
  subtitle: string;
  sections: AboutSection[];
}

const DEFAULT_ABOUT_CONTENT: AboutContent = {
  title: 'Engineering the Future of Custom PCs',
  subtitle: 'BuildbotAI empowers builders and gamers with instant compatibility validation, real-time bottleneck checks, and intelligent component matching.',
  sections: [
    {
      id: 'mission',
      title: 'Our Mission & Vision',
      content: 'Custom PC building has traditionally required hours of cross-referencing socket diagrams, clearance tolerances, PCIe bandwidth splits, and power requirements. BuildbotAI was founded to bridge hardware knowledge with machine intelligence—giving every enthusiast the confidence of an expert technician.',
      subItems: [
        {
          title: 'Verified Hardware Baselines',
          content: 'Every component in our system index is verified for mechanical clearance, socket compatibility, thermal requirements, and power supply headroom.',
        },
        {
          title: 'Algorithmic Bottleneck Detection',
          content: 'Instead of generic rules of thumb, our system evaluates the performance balance between CPU and GPU workloads across 1080p, 1440p, and 4K resolution targets.',
        },
      ],
    },
    {
      id: 'technology',
      title: 'The Technology Platform',
      content: 'Built on Next.js, Firebase Cloud Services, and Genkit AI orchestration, BuildbotAI merges live inventory tracking with multi-modal reasoning. Whether you are assembling a budget esports rig or a workstation titan, the system validates parts dynamically as you make changes.',
      subItems: [
        {
          title: 'Live Stock Integration',
          content: 'No phantom parts or outdated pricing. Our database syncs with warehouse inventory to ensure reserved configurations can be assembled immediately.',
        },
        {
          title: '2-Year Hardware Protection',
          content: 'Every turnkey system and custom assembly is backed by our full 2-year parts and labor warranty, stress-tested before handover.',
        },
      ],
    },
    {
      id: 'community',
      title: 'Capstone Heritage',
      content: 'Developed as a Senior Capstone Project by STI College BSIT students in Quezon City, BuildbotAI reflects real-world engineering rigor, deep research into hardware synergy, and a passion for modern web technologies.',
    },
  ],
};

export default function AboutPage() {
  const [content, setContent] = useState<AboutContent>(DEFAULT_ABOUT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string>('mission');

  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const firestore = useFirestore();

  useEffect(() => {
    async function fetchAboutContent() {
      if (!firestore) {
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(firestore, 'siteContent', 'about');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as AboutContent;
          if (data.sections && data.sections.length > 0) {
            setContent(data);
            setActiveSectionId(data.sections[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching about content:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAboutContent();
  }, [firestore]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader color="cyan" size="lg" />
      </div>
    );
  }

  const sectionsToRender = content.sections && content.sections.length > 0
    ? content.sections
    : DEFAULT_ABOUT_CONTENT.sections;

  return (
    <div className="min-h-screen bg-background font-body text-foreground pt-32 pb-24 px-4 sm:px-6 md:px-8 lg:px-12 w-full relative">
      {/* Lightbox Modal using Mantine Modal */}
      <Modal
        opened={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        size="xl"
        radius="xl"
        centered
        withCloseButton
        overlayProps={{
          backgroundOpacity: 0.75,
          blur: 6,
        }}
        classNames={{
          content: isDark ? 'bg-[#111722] border border-white/10' : 'bg-white border border-slate-200',
        }}
      >
        {selectedImage && (
          <div className="p-2 flex flex-col items-center">
            <img
              src={selectedImage}
              alt="Expanded preview"
              className="w-full h-auto max-h-[75vh] object-contain rounded-xl"
            />
          </div>
        )}
      </Modal>

      <div className="max-w-7xl mx-auto">
        {/* Editorial Hero Header */}
        <div className="mb-16 md:mb-20 text-center md:text-left max-w-4xl">
          <Badge
            variant="light"
            color="cyan"
            size="lg"
            radius="xl"
            leftSection={<Sparkles size={14} />}
            className="font-bold tracking-widest uppercase mb-6 py-2 px-3.5"
          >
            About BuildbotAI
          </Badge>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black font-headline uppercase tracking-tight text-slate-900 dark:text-slate-100 mb-6 leading-tight">
            {content.title}
          </h1>

          <p className="text-lg sm:text-2xl text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            {content.subtitle}
          </p>
        </div>

        {/* Content Layout: Sticky Navigation + Story Cards */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start relative">
          {/* Left Column: Floating Quick Navigation */}
          <aside className="col-span-1 md:col-span-4 hidden md:block sticky top-32">
            <Paper
              withBorder
              radius="2xl"
              p="xl"
              className={cn(
                'backdrop-blur-xl transition-all shadow-lg',
                isDark
                  ? 'bg-[#111722]/85 border-white/10 shadow-black/40'
                  : 'bg-white/95 border-slate-200 shadow-slate-200/60'
              )}
            >
              <Group gap="xs" className="mb-5 pb-3 border-b border-slate-200/60 dark:border-white/10">
                <ThemeIcon size={28} radius="md" variant="light" color="cyan">
                  <FileText size={15} />
                </ThemeIcon>
                <Text size="xs" fw={800} className="uppercase tracking-widest text-slate-500 dark:text-slate-400 font-headline">
                  Key Topics
                </Text>
              </Group>

              <nav className="flex flex-col gap-2">
                {sectionsToRender.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={() => setActiveSectionId(section.id)}
                    className={cn(
                      'px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-between transition-all duration-200',
                      activeSectionId === section.id
                        ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-headline'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-white/5'
                    )}
                  >
                    <span>{section.title}</span>
                    <ChevronRight size={16} className="opacity-60" />
                  </a>
                ))}
              </nav>

              <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-white/10">
                <Text size="xs" c="dimmed" mb="sm" fw={600}>
                  Ready to test our compatibility engine?
                </Text>
                <MantineButton
                  component={Link}
                  href="/builder"
                  size="sm"
                  radius="md"
                  color="cyan"
                  fullWidth
                  rightSection={<ArrowRight size={16} />}
                  className="font-headline font-bold uppercase tracking-wider text-white"
                >
                  Start Custom Build
                </MantineButton>
              </div>
            </Paper>
          </aside>

          {/* Right Column: Editorial Sections */}
          <div className="col-span-1 md:col-span-8 space-y-12">
            {sectionsToRender.map((section, sIndex) => (
              <section key={section.id} id={section.id} className="scroll-mt-32">
                <Paper
                  withBorder
                  radius="2xl"
                  p={{ base: 'xl', sm: 36 }}
                  className={cn(
                    'transition-all duration-300 shadow-xl',
                    isDark
                      ? 'bg-[#111722]/85 border-white/10 shadow-black/40'
                      : 'bg-white/95 border-slate-200 shadow-slate-200/60'
                  )}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-xs font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
                      0{sIndex + 1}
                    </span>
                    <div className="h-px w-8 bg-cyan-500/40" />
                    <Title order={2} className="text-2xl sm:text-3xl font-black font-headline uppercase tracking-tight text-slate-900 dark:text-slate-100">
                      {section.title}
                    </Title>
                  </div>

                  <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed mb-6 font-medium">
                    <ReactMarkdown>{section.content}</ReactMarkdown>
                  </div>

                  {section.imageUrl && (
                    <div
                      onClick={() => setSelectedImage(section.imageUrl!)}
                      className="cursor-zoom-in relative rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 mb-8 group"
                    >
                      <img
                        src={section.imageUrl}
                        alt={section.title}
                        className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Badge variant="filled" color="cyan" size="lg" radius="xl" leftSection={<Maximize2 size={14} />}>
                          Click to Expand
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Sub-Items (Feature Grid) */}
                  {section.subItems && section.subItems.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-200/60 dark:border-white/10">
                      {section.subItems.map((sub, subIdx) => (
                        <Paper
                          key={subIdx}
                          withBorder
                          radius="xl"
                          p="lg"
                          className={cn(
                            'transition-all',
                            isDark
                              ? 'bg-slate-900/50 border-white/5 hover:border-cyan-500/30'
                              : 'bg-slate-50/80 border-slate-200 hover:border-cyan-500/30'
                          )}
                        >
                          <Text size="md" fw={700} className="text-slate-900 dark:text-slate-100 mb-2 font-headline">
                            {sub.title}
                          </Text>
                          <div className="prose prose-slate dark:prose-invert text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            <ReactMarkdown>{sub.content}</ReactMarkdown>
                          </div>
                        </Paper>
                      ))}
                    </div>
                  )}
                </Paper>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
