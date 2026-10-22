"use client";

import React, { useState, useEffect } from "react";
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
} from "@mantine/core";
import {
  Search,
  HelpCircle,
  ArrowRight,
  MessageSquare,
  Sparkles,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/theme-provider";
import { FAQ_CATEGORIES } from "./faq-data";

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Handle URL hash on initial load (e.g. #shipping-amp-delivery)
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.replace("#", "");
      if (hash) {
        const found = FAQ_CATEGORIES.find((c) => c.id === hash);
        if (found) {
          setSelectedCategory(found.id);
          const el = document.getElementById(hash);
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
          }
        }
      }
    }
  }, []);

  const filteredFaq = FAQ_CATEGORIES
    .filter((cat) => selectedCategory === "all" || cat.id === selectedCategory)
    .map((category) => ({
      ...category,
      questions: category.questions.filter(
        (q) =>
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.questions.length > 0);

  const totalQuestions = FAQ_CATEGORIES.reduce(
    (acc, cat) => acc + cat.questions.length,
    0
  );

  return (
    <main className="min-h-screen bg-background pt-32 pb-24 px-4 overflow-hidden relative">
      {/* Ambient Lighting */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -z-10" />

      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 lg:px-8 xl:px-10 relative z-10">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
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
              Netcodex Knowledge Base &amp; FAQ
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
            className="text-slate-600 dark:text-slate-400 text-base sm:text-xl max-w-3xl mx-auto font-medium leading-relaxed"
          >
            Find comprehensive answers about nationwide delivery, store pickup, genuine warranties, custom PC builds, and dedicated after-sales support across all {totalQuestions} official topics.
          </motion.p>
        </div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="mb-8 max-w-3xl mx-auto"
        >
          <TextInput
            placeholder="Search shipping, warranties, custom PC builds, or store policies..."
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
              ),
            }}
          />
        </motion.div>

        {/* Category Navigation Quick Filter Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12 max-w-4xl mx-auto">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold font-headline transition-all cursor-pointer border",
              selectedCategory === "all"
                ? "bg-cyan-600 text-white border-cyan-600 shadow-sm"
                : "bg-white/80 dark:bg-[#141a23] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-cyan-500/40"
            )}
          >
            <Layers size={14} />
            <span>All Topics ({totalQuestions})</span>
          </button>
          {FAQ_CATEGORIES.map((cat) => {
            const CatIcon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedCategory(cat.id);
                  if (typeof window !== "undefined") {
                    window.history.replaceState(null, "", `#${cat.id}`);
                    const el = document.getElementById(cat.id);
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth" });
                    }
                  }
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold font-headline transition-all cursor-pointer border",
                  isSelected
                    ? "bg-cyan-600 text-white border-cyan-600 shadow-sm"
                    : "bg-white/80 dark:bg-[#141a23] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-cyan-500/40"
                )}
              >
                <CatIcon
                  size={14}
                  className={isSelected ? "text-white" : "text-cyan-600 dark:text-cyan-400"}
                />
                <span>{cat.category}</span>
                <span className={cn("text-[10px] ml-0.5 opacity-80", isSelected ? "text-white" : "text-slate-400")}>
                  ({cat.questions.length})
                </span>
              </a>
            );
          })}
        </div>

        {/* FAQ Categories & Separated Mantine Accordions */}
        <div className="space-y-12">
          {filteredFaq.length > 0 ? (
            filteredFaq.map((cat, catIndex) => {
              const CatIcon = cat.icon;
              return (
                <section
                  key={cat.id}
                  id={cat.id}
                  className="scroll-mt-28"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * catIndex }}
                  >
                    <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-200/60 dark:border-white/10">
                      <Group gap="sm">
                        <ThemeIcon size={34} radius="md" variant="light" color="cyan">
                          <CatIcon size={18} />
                        </ThemeIcon>
                        <Title
                          order={3}
                          className="text-lg sm:text-xl font-bold font-headline uppercase tracking-wider text-slate-900 dark:text-slate-100"
                        >
                          {cat.category}
                        </Title>
                      </Group>
                      <Badge size="sm" variant="light" color="cyan" className="font-bold">
                        {cat.questions.length} {cat.questions.length === 1 ? "question" : "questions"}
                      </Badge>
                    </div>

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
                        control: "px-3.5 py-3 hover:bg-slate-50/60 dark:hover:bg-white/5",
                        label: "font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-headline",
                        panel: "px-3.5 pb-3.5 pt-1 text-slate-600 dark:text-slate-300 font-medium text-xs sm:text-sm leading-relaxed border-t border-slate-100 dark:border-white/5",
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
                </section>
              );
            })
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
                Try searching with different terms or select &quot;All Topics&quot; to browse our full catalog of answers.
              </Text>
            </Paper>
          )}
        </div>

        {/* Footer Support CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-14"
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
            <div className="max-w-xl mx-auto space-y-3 py-2">
              <ThemeIcon size={52} radius="xl" variant="light" color="cyan" className="mx-auto">
                <MessageSquare size={24} />
              </ThemeIcon>

              <Title order={3} className="text-2xl sm:text-3xl font-bold font-headline uppercase tracking-tight text-slate-900 dark:text-slate-100">
                Still have questions?
              </Title>

              <Text size="sm" className="text-slate-600 dark:text-slate-400 font-medium">
                Can&apos;t find the exact answer you&apos;re looking for? Our enthusiast hardware support team is available Monday to Sunday from 10:00 AM to 7:00 PM.
              </Text>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <MantineButton
                  component={Link}
                  href="/contact"
                  size="md"
                  radius="md"
                  color="cyan"
                  rightSection={<ArrowRight size={18} />}
                  className="font-headline font-bold uppercase tracking-wider text-white shadow-md shadow-cyan-500/20"
                >
                  Contact Support Desk
                </MantineButton>
                <MantineButton
                  component={Link}
                  href="/builder"
                  size="md"
                  radius="md"
                  variant="default"
                  rightSection={<Sparkles size={16} className="text-cyan-500" />}
                  className="font-headline font-bold uppercase tracking-wider"
                >
                  Launch PC Builder
                </MantineButton>
              </div>
            </div>
          </Paper>
        </motion.div>
      </div>
    </main>
  );
}
