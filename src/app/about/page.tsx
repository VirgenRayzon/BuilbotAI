'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import storefrontImage from '@/assets/about/netcodex-storefront.png';
import {
  Paper,
  Title,
  Text,
  Badge,
  ThemeIcon,
  Button as MantineButton,
  Group,
  Stack,
} from '@mantine/core';
import {
  FileText,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Cpu,
  Truck,
  Wrench,
  Award,
  ArrowRight,
  CheckCircle2,
  Headphones,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthBackground } from '@/components/auth/auth-background';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/theme-provider';

const STOREFRONT_PILLARS = [
  {
    title: 'Expertise You Can Trust',
    description:
      'Built on over 25 years of IT industry experience. Our technicians are enthusiasts who understand high-performance requirements for gaming and professional workstations.',
  },
  {
    title: 'Authorized & Authentic',
    description:
      'Shop with zero worries. We are a SEC-registered corporation and an authorized reseller. Every product we sell is 100% brand new and backed by official manufacturer warranties.',
  },
  {
    title: 'Nationwide Logistics',
    description:
      'We ship anywhere in the Philippines. We partner with trusted couriers like LBC and fast local delivery services to ensure your rig arrives safe and on time.',
  },
  {
    title: 'After-Sales Support',
    description:
      'Our relationship doesn’t end at checkout. We provide dedicated technical support and warranty assistance to keep your system running at peak performance.',
  },
];

interface AboutSection {
  id: string;
  number: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  lead: string;
  subItems?: { title: string; content: string }[];
}

const ABOUT_SECTIONS: AboutSection[] = [
  {
    id: 'who-we-are',
    number: '01',
    icon: Award,
    title: 'A Nationwide Online Computer & Tech Store',
    lead: 'Established in 2020, Netcodex Computer Center has grown into a premier nationwide online technology store serving gamers, professionals, and enterprise clients across Luzon, Visayas, and Mindanao. Built as an online-first platform, our logistics and operations are designed specifically for fast nationwide fulfillment, competitive market pricing, and a stress-free buying experience.',
    subItems: [
      {
        title: 'Online-First Architecture',
        content: 'Engineered for rapid order processing, live inventory sync, and dependable nationwide dispatch rather than walk-in retail bottlenecks.',
      },
      {
        title: 'Extensive Catalog',
        content: 'Covering thousands of SKUs across processors, graphics cards, motherboards, memory, power supplies, cooling, cases, and complete turnkey builds.',
      },
    ],
  },
  {
    id: 'our-roots',
    number: '02',
    icon: Cpu,
    title: 'From the C:\\> Prompt to Custom Rigs',
    lead: 'While Netcodex was established in 2020, our founder’s journey began decades before RGB lighting existed. Known in the enthusiast community as nievz, he started as a teenager writing code in BASIC and C, navigating MS-DOS, and compiling custom Linux kernels and drivers when plug-and-play was non-existent. This lifelong passion for computer hardware evolved into a trusted nationwide service.',
    subItems: [
      {
        title: 'Community Reputation Since 2007',
        content: 'Backed by verified positive feedback on TipidPC since 2007, building a trusted reputation across the Filipino PC building community.',
      },
      {
        title: 'Global Enthusiast Tuning (Overclock.net)',
        content: 'An active contributor to Overclock.net since 2011, mastering CPU curve optimization, memory sub-timings, and advanced thermal management across CPU and GPU architectures.',
      },
    ],
  },
  {
    id: 'hardware-expertise',
    number: '03',
    icon: ShieldCheck,
    title: '25+ Years of Enterprise IT Leadership',
    lead: 'Behind our custom rigs is enterprise-grade discipline. Having directed mission-critical IT operations and large-scale workstation deployments for major BPO and corporate organizations, Netcodex brings a Chief Technology Officer (CTO) level of insight to every build.',
    subItems: [
      {
        title: 'ITIL® Methodology Standards',
        content: 'We don’t just assemble parts; we apply ITIL service standards, structured testing workflows, and rigorous cable management to ensure maximum uptime.',
      },
      {
        title: 'Mission-Critical Reliability',
        content: 'We apply the same 99.999% availability mindset to small businesses and creator workstations that enterprise data centers require.',
      },
    ],
  },
  {
    id: 'authentic-products',
    number: '04',
    icon: CheckCircle2,
    title: '100% Authentic Hardware with Official Warranties',
    lead: 'Netcodex is an authorized reseller and SEC-registered enterprise. Every single component—from entry-level power supplies to halo-tier GPUs—is 100% brand new, authentic, and backed by legitimate manufacturer and distributor warranties.',
    subItems: [
      {
        title: 'Zero Gray-Market Risk',
        content: 'We source exclusively through authorized Philippine distributors and direct vendor channels with legitimate local warranty support.',
      },
      {
        title: 'Fair Market Pricing',
        content: 'Continuous supplier monitoring ensures our prices remain competitive with traditional IT hubs like Gilmore without the hassle of travel.',
      },
    ],
  },
  {
    id: 'custom-pc-building',
    number: '05',
    icon: Wrench,
    title: 'Intelligent Custom PC Building with Buildbot AI',
    lead: 'Our Custom PC Builder brings together 25+ years of hands-on assembly knowledge and advanced artificial intelligence. Powered by the Buildbot AI assistant, our platform cross-validates socket layouts, physical clearances, DDR generations, and PSU wattage headroom in real time.',
    subItems: [
      {
        title: 'Zero-Bottleneck Verification',
        content: 'Dynamic bottleneck analysis evaluates hardware synergy across 1080p, 1440p, and 4K gaming and workstation workloads.',
      },
      {
        title: 'Hand-Built Craftsmanship',
        content: 'Every custom order is reviewed, assembled, and cable-managed by experienced technicians, followed by thermal stress testing before packaging.',
      },
    ],
  },
  {
    id: 'nationwide-logistics',
    number: '06',
    icon: Truck,
    title: 'Nationwide Logistics & Delivery',
    lead: 'Centrally operated from our online warehouse in Quezon City, Netcodex ships securely across the entire Philippine archipelago. We prioritize fast turnaround from order placement to delivery.',
    subItems: [
      {
        title: 'Nationwide Insured Courier (LBC)',
        content: 'Secure, tracked, and insured shipping via LBC to any destination in Luzon, Visayas, and Mindanao with anti-static packaging.',
      },
      {
        title: 'Same-Day Metro Manila Delivery',
        content: 'Rapid same-day dispatch via Grab, Lalamove, and Transportify for customers within Metro Manila and nearby provinces.',
      },
    ],
  },
  {
    id: 'after-sales-support',
    number: '07',
    icon: Headphones,
    title: 'Dedicated After-Sales Support & Customer Trust',
    lead: 'Our relationship does not end when your order is delivered. Netcodex provides comprehensive after-sales technical support, warranty RMA assistance, and fast communication to keep your system performing at its peak.',
    subItems: [
      {
        title: '2-Year Complete System Protection',
        content: 'Turnkey and custom-built systems assembled through Netcodex include comprehensive parts and labor warranty coverage.',
      },
      {
        title: 'In-App Support Desk',
        content: 'Track your inquiries and talk directly with technical staff through the Contact page and your Profile Contact Inbox.',
      },
    ],
  },
];

const KEY_FACTS = [
  { label: 'Founded', value: '2020' },
  { label: 'IT Experience', value: '25+ Years' },
  { label: 'Headquarters', value: 'Quezon City, PH' },
  { label: 'Coverage', value: 'Nationwide (Luzon, Visayas, Mindanao)' },
  { label: 'Warranties', value: 'Official Manufacturer Warranties' },
  { label: 'AI Partner', value: 'Powered by Buildbot AI' },
];

export default function AboutPage() {
  const [activeSectionId, setActiveSectionId] = useState<string>('who-we-are');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="min-h-screen bg-transparent font-body text-foreground pt-24 pb-20 w-full relative overflow-hidden">
      <AuthBackground className="fixed" />
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-8 xl:px-10 relative z-10">
        {/* Hero Header */}
        <div className="mb-10 md:mb-14 text-center md:text-left">
          <Badge
            variant="light"
            color="cyan"
            size="lg"
            radius="xl"
            leftSection={<Sparkles size={14} />}
            className="font-bold tracking-widest uppercase mb-4 py-2 px-3.5"
          >
            About Netcodex
          </Badge>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black font-headline uppercase tracking-tight text-slate-900 dark:text-slate-100 mb-4 leading-tight">
            Nationwide Computer &amp; Tech Store <span className="text-cyan-600 dark:text-cyan-400">In The Philippines</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-4xl">
            Built on over 25 years of IT infrastructure expertise, Netcodex delivers authentic PC components, custom high-performance rigs, and transparent pricing—powered by Buildbot AI intelligence.
          </p>

          {/* Key Facts Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-8">
            {KEY_FACTS.map((fact) => (
              <Paper
                key={fact.label}
                withBorder
                radius="lg"
                p="xs"
                className={cn(
                  'text-left transition-colors',
                  isDark ? 'bg-[#111722]/80 border-white/10' : 'bg-white/90 border-slate-200 shadow-xs'
                )}
              >
                <Text size="xs" fw={700} c="dimmed" className="uppercase tracking-wider">
                  {fact.label}
                </Text>
                <Text size="sm" fw={800} className="text-slate-900 dark:text-slate-100 truncate font-headline mt-0.5">
                  {fact.value}
                </Text>
              </Paper>
            ))}
          </div>
        </div>

        {/* Content Layout: Sticky Navigation + Story Cards */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 items-start relative w-full">
          {/* Left Column: Floating Quick Navigation (Anchored Sticky) */}
          <aside className="col-span-1 md:col-span-4 lg:col-span-3 xl:col-span-3 hidden md:block sticky top-20 z-20 self-start">
            <Paper
              withBorder
              radius="2xl"
              p={12}
              className={cn(
                'backdrop-blur-xl transition-all shadow-lg flex flex-col max-h-[calc(100vh-7rem)]',
                isDark
                  ? 'bg-[#111722]/90 border-white/10 shadow-black/40'
                  : 'bg-white/95 border-slate-200 shadow-slate-200/60'
              )}
            >
              <Group gap="xs" className="mb-2 pb-2.5 border-b border-slate-200/60 dark:border-white/10 shrink-0">
                <ThemeIcon size={28} radius="md" variant="light" color="cyan">
                  <FileText size={15} />
                </ThemeIcon>
                <Text size="xs" fw={800} className="uppercase tracking-widest text-slate-500 dark:text-slate-400 font-headline">
                  Key Topics
                </Text>
              </Group>

              <nav className="flex flex-col gap-1.5 overflow-y-auto pr-1 flex-1 [scrollbar-color:rgb(6_182_212)_transparent] [scrollbar-width:thin]">
                {ABOUT_SECTIONS.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={() => setActiveSectionId(section.id)}
                    className={cn(
                      'px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition-all duration-200',
                      activeSectionId === section.id
                        ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-headline shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-white/5'
                    )}
                  >
                    <span className="truncate">{section.title}</span>
                    <ChevronRight size={14} className="opacity-60 shrink-0 ml-1.5" />
                  </a>
                ))}
              </nav>

              <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-white/10 shrink-0">
                <Text size="xs" c="dimmed" mb="xs" fw={600}>
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
          <div className="col-span-1 md:col-span-8 lg:col-span-9 space-y-6">
            {ABOUT_SECTIONS.map((section) => {
              const SectionIcon = section.icon;
              return (
                <section key={section.id} id={section.id} className="scroll-mt-32">
                  <Paper
                    withBorder
                    radius="2xl"
                    p={12}
                    className={cn(
                      'transition-all duration-300 shadow-xl',
                      isDark
                        ? 'bg-[#111722]/85 border-white/10 shadow-black/40'
                        : 'bg-white/95 border-slate-200 shadow-slate-200/60'
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
                        {section.number}
                      </span>
                      <div className="h-px w-8 bg-cyan-500/40" />
                      <ThemeIcon size={24} radius="sm" variant="light" color="cyan">
                        <SectionIcon size={14} />
                      </ThemeIcon>
                      <Title order={2} className="text-xl sm:text-2xl font-black font-headline uppercase tracking-tight text-slate-900 dark:text-slate-100">
                        {section.title}
                      </Title>
                    </div>

                    {/* Storefront Facade & Core Pillars Showcase for Who We Are */}
                    {section.id === 'who-we-are' && (
                      <div className="mb-6 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100/70 dark:bg-[#0c121d] shadow-sm">
                        <div className="relative w-full aspect-[1535/513] overflow-hidden bg-slate-950">
                          <Image
                            src={storefrontImage}
                            alt="Netcodex Computer Center Storefront - 35G Liberty Ave, Cubao, Quezon City"
                            fill
                            unoptimized
                            sizes="(max-width: 1024px) 100vw, 900px"
                            className="object-cover"
                          />
                        </div>

                        {/* 4 Pillars Under Photo */}
                        <div className="p-4 sm:p-5 lg:p-6 border-t border-slate-200/80 dark:border-white/10">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                            {STOREFRONT_PILLARS.map((pillar, idx) => (
                              <div key={idx} className="flex flex-col">
                                <Text fw={800} size="sm" className="text-slate-900 dark:text-slate-100 font-headline mb-1.5">
                                  {pillar.title}
                                </Text>
                                <Text size="xs" className="text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                                  {pillar.description}
                                </Text>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed mb-4 font-medium">
                      {section.lead}
                    </p>

                    {/* Secondary Texts as Clean Bullet Points */}
                    {section.subItems && section.subItems.length > 0 && (
                      <ul className="mt-4 pt-3.5 border-t border-slate-200/60 dark:border-white/10 space-y-2.5 list-none p-0 m-0">
                        {section.subItems.map((sub, subIdx) => (
                          <li key={subIdx} className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 mt-2 shrink-0 shadow-[0_0_6px_rgba(6,182,212,0.7)]" />
                            <div className="text-slate-600 dark:text-slate-300">
                              <strong className="font-bold text-slate-900 dark:text-slate-100 mr-1.5 font-headline">
                                {sub.title}:
                              </strong>
                              <span>{sub.content}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Paper>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
