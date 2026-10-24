"use client";

import React from "react";
import {
    Text,
    Button as MantineButton,
    Loader,
    Badge,
} from "@mantine/core";
import {
    Sparkles,
    ThumbsUp,
    AlertCircle,
    RefreshCw,
} from "lucide-react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { SparkleButton } from "@/components/ui/sparkle-button";

interface PrebuiltAiHighlightsProps {
    analysis: { pros?: string[] } | null;
    loadingAnalysis: boolean;
    analysisError: string | null;
    canGenerateReport: boolean;
    onAnalyze: () => void;
}

export function PrebuiltAiHighlights({
    analysis,
    loadingAnalysis,
    analysisError,
    canGenerateReport,
    onAnalyze,
}: PrebuiltAiHighlightsProps) {
    const pros = analysis?.pros || [];

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-4 border-b border-slate-200/70 pb-3.5 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                        <Sparkles className="w-4.5 h-4.5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <Text fw={800} size="md" className="text-slate-900 dark:text-slate-100 text-base sm:text-lg">
                                AI System Highlights
                            </Text>
                            {pros.length > 0 && (
                                <Badge size="sm" variant="light" color="cyan" radius="sm">
                                    {pros.length} Highlights
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                {canGenerateReport && (
                    <MantineButton
                        variant="subtle"
                        color="cyan"
                        size="xs"
                        leftSection={<RefreshCw className="w-3.5 h-3.5" />}
                        onClick={onAnalyze}
                        className="text-xs h-8 px-2.5"
                    >
                        Re-evaluate
                    </MantineButton>
                )}
            </div>

            {loadingAnalysis ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                    <Loader size="md" color="cyan" />
                    <div>
                        <Text fw={700} size="sm" className="text-slate-900 dark:text-slate-100">
                            Analyzing Hardware Synergy
                        </Text>
                        <Text size="xs" c="dimmed">
                            Evaluating component performance benchmarks and strengths...
                        </Text>
                    </div>
                </div>
            ) : analysisError ? (
                <div className="text-center py-8 px-4 bg-rose-50/50 dark:bg-rose-950/20 rounded-lg border border-rose-200 dark:border-rose-900/40">
                    <AlertCircle className="w-7 h-7 text-rose-500 mx-auto mb-2 opacity-90" />
                    <Text fw={700} size="sm" className="text-rose-900 dark:text-rose-200 mb-1">
                        Analysis Error
                    </Text>
                    <Text size="xs" c="dimmed" className="max-w-md mx-auto mb-3">
                        {analysisError}
                    </Text>
                    {canGenerateReport && (
                        <MantineButton
                            variant="light"
                            color="rose"
                            size="xs"
                            leftSection={<RefreshCw className="w-3.5 h-3.5" />}
                            onClick={onAnalyze}
                            className="h-8 text-xs"
                        >
                            Try Again
                        </MantineButton>
                    )}
                </div>
            ) : pros.length === 0 ? (
                <div className="flex flex-col items-center text-center py-8 px-4">
                    <Text fw={700} size="sm" className="text-slate-900 dark:text-slate-100 mb-1">
                        No AI performance review yet
                    </Text>
                    <Text size="xs" c="dimmed" ta="center" className="max-w-sm mb-4">
                        {canGenerateReport
                            ? "Generate a review to summarize this build's component balance, expected performance, and recommended use cases."
                            : "An AI performance review has not been published for this system yet. Check back once one is available."}
                    </Text>
                    {canGenerateReport && (
                        <SparkleButton
                            onClick={onAnalyze}
                            icon={<Sparkles className="w-4 h-4" />}
                            className="px-5 h-9 text-xs font-semibold uppercase tracking-wider"
                        >
                            Generate review
                        </SparkleButton>
                    )}
                </div>
            ) : (
                <div className="relative px-7 sm:px-9">
                    <Carousel
                        opts={{
                            align: "start",
                            loop: true,
                        }}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-0">
                            {pros.map((pro, idx) => (
                                <CarouselItem key={idx} className="pl-0 basis-full">
                                    <div className="flex min-h-[200px] sm:min-h-[230px] flex-col justify-between rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-5 sm:p-6 select-none transition-all hover:border-emerald-500/40 dark:hover:border-emerald-500/30 shadow-xs">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                                        <ThumbsUp className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                                                        Synergy Strength
                                                    </span>
                                                </div>
                                                <Badge variant="light" color="teal" size="sm" radius="sm">
                                                    Highlight {String(idx + 1).padStart(2, "0")} / {String(pros.length).padStart(2, "0")}
                                                </Badge>
                                            </div>
                                            <Text fw={500} className="text-sm sm:text-[15px] md:text-base text-slate-800 dark:text-slate-200 leading-relaxed sm:leading-7">
                                                {pro}
                                            </Text>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs sm:text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                                <span>Hardware verified</span>
                                            </div>
                                            <span className="text-slate-400 text-xs font-normal">
                                                Slide {idx + 1} of {pros.length}
                                            </span>
                                        </div>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="-left-3 sm:-left-4 h-8 w-8 rounded-full border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-cyan-500 shadow-md transition-all" />
                        <CarouselNext className="-right-3 sm:-right-4 h-8 w-8 rounded-full border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-cyan-500 shadow-md transition-all" />
                    </Carousel>
                </div>
            )}
        </div>
    );
}
