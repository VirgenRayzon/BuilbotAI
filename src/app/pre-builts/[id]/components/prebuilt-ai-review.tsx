"use client";

import React from "react";
import { Paper, Text, Group, Button as MantineButton, Loader, Badge } from "@mantine/core";
import { Sparkles, ThumbsUp, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { SparkleButton } from "@/components/ui/sparkle-button";

interface PrebuiltAiReviewProps {
    analysis: { pros?: string[] } | null;
    loadingAnalysis: boolean;
    analysisError: string | null;
    canGenerateReport: boolean;
    onAnalyze: () => void;
}

export function PrebuiltAiReview({
    analysis,
    loadingAnalysis,
    analysisError,
    canGenerateReport,
    onAnalyze,
}: PrebuiltAiReviewProps) {
    const pros = analysis?.pros || [];

    // Loading State
    if (loadingAnalysis) {
        return (
            <Paper
                radius="xl"
                p="2xl"
                withBorder
                className="bg-white/80 dark:bg-[#141a23]/80 border-slate-200 dark:border-white/10 flex flex-col items-center justify-center py-20 text-center gap-4"
            >
                <div className="relative">
                    <Loader size="lg" color="cyan" />
                </div>
                <div>
                    <Text fw={700} size="md" className="text-slate-900 dark:text-slate-100">
                        Analyzing Hardware Synergy
                    </Text>
                    <Text size="xs" c="dimmed">
                        Evaluating component performance benchmarks and strengths...
                    </Text>
                </div>
            </Paper>
        );
    }

    // Error State
    if (analysisError) {
        return (
            <Paper
                radius="xl"
                p="xl"
                withBorder
                className="bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-center py-12"
            >
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3 opacity-90" />
                <Text fw={700} size="md" className="text-rose-900 dark:text-rose-200 mb-1">
                    Analysis Error
                </Text>
                <Text size="sm" c="dimmed" className="max-w-md mx-auto mb-5">
                    {analysisError}
                </Text>
                {canGenerateReport && (
                    <MantineButton
                        variant="light"
                        color="rose"
                        size="xs"
                        leftSection={<RefreshCw className="w-3.5 h-3.5" />}
                        onClick={onAnalyze}
                    >
                        Try Again
                    </MantineButton>
                )}
            </Paper>
        );
    }

    // Empty State (No report generated yet)
    if (!analysis || pros.length === 0) {
        return (
            <Paper
                radius="xl"
                p="2xl"
                withBorder
                className="bg-white/80 dark:bg-[#141a23]/80 border-slate-200 dark:border-white/10 py-16"
            >
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <Text fw={700} size="md" className="text-slate-900 dark:text-slate-100 mb-1">
                        No AI performance review yet
                    </Text>
                    <Text size="sm" c="dimmed" ta="center" className="max-w-xl mb-6">
                        {canGenerateReport
                            ? "Generate a review to summarize this build’s component balance, expected performance, and recommended use cases."
                            : "An AI performance review has not been published for this system yet. Check back once one is available."}
                    </Text>
                    {canGenerateReport && (
                        <SparkleButton
                            onClick={onAnalyze}
                            icon={<Sparkles className="w-4 h-4" />}
                            className="px-6 h-11 text-xs font-semibold uppercase tracking-wider"
                        >
                            Generate review
                        </SparkleButton>
                    )}
                </div>
            </Paper>
        );
    }

    // Success State: Carousel of Strengths Cards
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div>
                    <Text fw={700} size="md" className="text-slate-900 dark:text-slate-100">
                        System Strengths & Highlights
                    </Text>
                    <Text size="xs" c="dimmed">
                        Verified architectural highlights generated by Buildbot AI
                    </Text>
                </div>
                {canGenerateReport && (
                    <MantineButton
                        variant="subtle"
                        color="cyan"
                        size="xs"
                        leftSection={<RefreshCw className="w-3.5 h-3.5" />}
                        onClick={onAnalyze}
                        className="text-xs"
                    >
                        Re-evaluate
                    </MantineButton>
                )}
            </div>

            {/* Carousel Container */}
            <div className="relative px-0 sm:px-6">
                <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    className="w-full"
                >
                    <CarouselContent className="-ml-2 items-stretch">
                        {pros.map((pro, idx) => (
                            <CarouselItem key={idx} className="flex h-auto basis-full pl-2 md:basis-1/2">
                                <Paper
                                    radius="xl"
                                    p="md"
                                    withBorder
                                    className="flex h-full min-h-[320px] flex-1 flex-col justify-between bg-white shadow-sm transition-all select-none dark:bg-[#141a23] border-slate-200/90 dark:border-white/10 hover:border-emerald-500/40 dark:hover:border-emerald-500/30 sm:min-h-[360px]"
                                >
                                    <div className="space-y-2">
                                        <Group justify="space-between" align="center">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                                <ThumbsUp className="w-4 h-4" />
                                            </div>
                                            <Badge variant="light" color="teal" size="xs" radius="sm">
                                                Highlight {String(idx + 1).padStart(2, "0")}
                                            </Badge>
                                        </Group>
                                        <Text size="sm" fw={500} className="text-slate-800 dark:text-slate-200 leading-relaxed">
                                            {pro}
                                        </Text>
                                    </div>
                                    <div className="mt-auto flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[11px] font-medium text-emerald-600 dark:border-white/5 dark:text-emerald-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        <span>Hardware verified</span>
                                    </div>
                                </Paper>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="hidden sm:flex -left-4 w-8 h-8 rounded-full border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a2230]" />
                    <CarouselNext className="hidden sm:flex -right-4 w-8 h-8 rounded-full border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a2230]" />
                </Carousel>
            </div>
        </div>
    );
}
