"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Accordion,
  TextInput,
  Badge,
  Paper,
  Text,
  Title,
  ThemeIcon,
  Button as MantineButton,
  Group,
  Stack,
} from "@mantine/core";
import {
  Search,
  Cpu,
  ShieldCheck,
  Truck,
  HelpCircle,
  ArrowRight,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/theme-provider";

const faqData = [
  {
    category: "AI Compatibility & Building",
    icon: Cpu,
    questions: [
      {
        question: "How does the AI PC Builder check compatibility?",
        answer: "BuildbotAI cross-references thousands of hardware combinations, manufacturer specifications, socket layouts, and thermal requirements. It analyzes your target performance and budget in real time to recommend balanced part configurations with zero clearance or power conflicts."
      },
      {
        question: "What is Bottleneck Analysis?",
        answer: "Bottleneck Analysis identifies if any single component—typically the CPU or GPU—will significantly constrain overall system throughput at your chosen resolution (1080p, 1440p, or 4K). We provide a percentage-based score and clear recommendations to ensure optimal component balance."
      },
      {
        question: "Can I customize the recommended parts list?",
        answer: "Yes. The AI provides an optimized starting baseline. You can swap out any component—such as choosing a higher-capacity SSD or an alternative case—and BuildbotAI will instantly re-validate the entire build for compatibility and power headroom."
      }
    ]
  },
  {
    category: "Orders, Shipping & Reservations",
    icon: Truck,
    questions: [
      {
        question: "How long does shipping take for systems?",
        answer: "Standard pre-built systems typically ship within 3–5 business days. Custom-built rigs undergo a comprehensive 24-hour stress test and quality assurance check, generally shipping within 5–7 business days."
      },
      {
        question: "Do you ship internationally?",
        answer: "Currently, BuildbotAI services customers throughout the Philippines. All orders are carefully packaged with anti-static protection and insured shipping."
      },
      {
        question: "How can I track my reservation status?",
        answer: "Once your build leaves our assembly facility, you will receive an email containing courier tracking details. You can also view live build milestones directly in your User Profile under Reservations."
      },
      {
        question: "How do I cancel or modify an active reservation?",
        answer: "Because components are immediately allocated and reserved from our live warehouse inventory upon booking, direct self-cancellation is restricted. To modify or cancel an order, please reach out via our Contact page with your Order ID, and a representative will assist you."
      }
    ]
  },
  {
    category: "Warranty & Support",
    icon: ShieldCheck,
    questions: [
      {
        question: "What kind of warranty is included?",
        answer: "All complete systems assembled through BuildbotAI include a comprehensive 2-year parts and labor warranty. Individual retail components also carry their respective official manufacturer warranties."
      },
      {
        question: "What is your return policy?",
        answer: "We offer a 30-day satisfaction window. If you experience hardware defects or issues upon receipt, our technical support team will troubleshoot, replace components, or facilitate returns according to our standard warranty guidelines."
      },
      {
        question: "How do I get technical support for my build?",
        answer: "You can reach us through our 24/7 AI chatbot assistant, submit a ticket via our Contact page, or email support@buildbot.ai directly with your system specifications and order details."
      }
    ]
  }
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const filteredFaq = faqData
    .map(category => ({
      ...category,
      questions: category.questions.filter(
        q =>
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }))
    .filter(category => category.questions.length > 0);

  return (
    <main className="min-h-screen bg-background pt-32 pb-24 px-4 overflow-hidden relative">
      {/* Ambient Lighting */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -z-10" />

      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 mb-4"
          >
            <Badge
              variant="light"
              color="cyan"
              size="lg"
              radius="xl"
              leftSection={<HelpCircle size={14} />}
              className="font-bold tracking-widest uppercase py-2 px-3.5"
            >
              Help Center & Knowledge Base
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black font-headline uppercase tracking-tight mb-5 text-slate-900 dark:text-slate-100"
          >
            Frequently Asked <span className="text-cyan-600 dark:text-cyan-400">Questions</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-600 dark:text-slate-400 text-base sm:text-xl max-w-2xl mx-auto font-medium leading-relaxed"
          >
            Find quick answers regarding our AI parts matching, assembly benchmarks,
            shipping policies, and comprehensive warranty coverage.
          </motion.p>
        </div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="mb-14 max-w-3xl mx-auto"
        >
          <TextInput
            placeholder="Search questions, warranties, or build policies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="lg"
            radius="xl"
            leftSection={<Search size={20} className="text-slate-400" />}
            classNames={{
              input: cn(
                "h-14 font-medium transition-all shadow-md",
                isDark
                  ? "bg-[#111722]/80 border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400"
                  : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600"
              )
            }}
          />
        </motion.div>

        {/* FAQ Categories & Separated Mantine Accordions */}
        <div className="space-y-12">
          {filteredFaq.length > 0 ? (
            filteredFaq.map((cat, catIndex) => (
              <motion.div
                key={cat.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * catIndex }}
              >
                <Group gap="sm" className="mb-3">
                  <ThemeIcon size={36} radius="md" variant="light" color="cyan">
                    <cat.icon size={18} />
                  </ThemeIcon>
                  <Title order={3} className="text-xl font-bold font-headline uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    {cat.category}
                  </Title>
                </Group>

                <Accordion
                  variant="separated"
                  radius="lg"
                  classNames={{
                    item: cn(
                      "transition-all duration-200 border",
                      isDark
                        ? "bg-[#111722]/85 border-white/10 hover:border-cyan-500/30 shadow-md shadow-black/20"
                        : "bg-white border-slate-200 hover:border-cyan-500/30 shadow-sm"
                    ),
                    control: "px-3 py-3 hover:bg-slate-50/60 dark:hover:bg-white/5",
                    label: "font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg",
                    panel: "px-3 pb-3 pt-1 text-slate-600 dark:text-slate-300 font-medium text-sm sm:text-base leading-relaxed border-t border-slate-100 dark:border-white/5",
                    chevron: "text-cyan-600 dark:text-cyan-400",
                  }}
                >
                  {cat.questions.map((q) => (
                    <Accordion.Item key={q.question} value={q.question}>
                      <Accordion.Control>{q.question}</Accordion.Control>
                      <Accordion.Panel>{q.answer}</Accordion.Panel>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </motion.div>
            ))
          ) : (
            <Paper
              withBorder
              radius="xl"
              p={12}
              className={cn(
                "text-center py-16",
                isDark ? "bg-[#111722]/60 border-white/10" : "bg-white border-slate-200"
              )}
            >
              <Search className="w-10 h-10 mx-auto mb-3 text-slate-400 opacity-60" />
              <Text size="lg" fw={700} className="text-slate-900 dark:text-slate-100 mb-1">
                No matching questions found
              </Text>
              <Text size="sm" c="dimmed">
                Try searching with different terms or reach out directly to our support specialists.
              </Text>
            </Paper>
          )}
        </div>

        {/* Footer Support CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-10"
        >
          <Paper
            withBorder
            radius="2xl"
            p={12}
            className={cn(
              "text-center backdrop-blur-xl shadow-xl",
              isDark
                ? "bg-[#111722]/90 border-white/10"
                : "bg-white/95 border-slate-200"
            )}
          >
            <div className="max-w-xl mx-auto space-y-3">
              <ThemeIcon size={52} radius="xl" variant="light" color="cyan" className="mx-auto">
                <MessageSquare size={24} />
              </ThemeIcon>

              <Title order={3} className="text-2xl sm:text-3xl font-bold font-headline uppercase tracking-tight text-slate-900 dark:text-slate-100">
                Still have questions?
              </Title>

              <Text size="base" className="text-slate-600 dark:text-slate-400 font-medium">
                Can&apos;t find the answer you&apos;re looking for? Our hardware support team is ready to help you directly.
              </Text>

              <div className="pt-2">
                <MantineButton
                  component={Link}
                  href="/contact"
                  size="md"
                  radius="md"
                  color="cyan"
                  rightSection={<ArrowRight size={18} />}
                  className="font-headline font-bold uppercase tracking-wider text-white shadow-md shadow-cyan-500/20"
                >
                  Contact Support Team
                </MantineButton>
              </div>
            </div>
          </Paper>
        </motion.div>
      </div>
    </main>
  );
}
