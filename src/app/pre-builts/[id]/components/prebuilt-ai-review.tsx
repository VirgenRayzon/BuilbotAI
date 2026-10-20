"use client";

import React, { useState } from "react";
import {
    Paper,
    Text,
    Group,
    Button as MantineButton,
    Loader,
    Badge,
    SegmentedControl,
} from "@mantine/core";
import {
    Sparkles,
    ThumbsUp,
    AlertCircle,
    RefreshCw,
    Cpu,
} from "lucide-react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { SparkleButton } from "@/components/ui/sparkle-button";
import type { PrebuiltPartStatus } from "@/lib/prebuilt-utils";
import { PrebuiltComponentCarousel } from "./prebuilt-component-carousel";

interface PrebuiltAiReviewProps {
    analysis: { pros?: string[] } | null;
    loadingAnalysis: boolean;
    analysisError: string | null;
    canGenerateReport: boolean;
    onAnalyze: () => void;
    componentStatuses: PrebuiltPartStatus[];
    loadingParts?: boolean;
}

export function PrebuiltAiReview({
    analysis,
    loadingAnalysis,
    analysisError,
    canGenerateReport,
    onAnalyze,
    componentStatuses,
    loadingParts = false,
}: PrebuiltAiReviewProps) {
    const [activeTab, setActiveTab] = useState<"components" | "highlights">("components");

    const pros = analysis?.pros || [];

    return (
        <div className="space-y-3">
            {/* Tab Controls & Re-evaluate Action */}
            <div className="flex items-center justify-between gap-2">
                <SegmentedControl
                    value={activeTab}
                    onChange={(val) => setActiveTab(val as "components" | "highlights")}
                    size="xs"
                    radius="md"
                    data={[
                        {
                            value: "components",
                            label: (
                                <div className="flex items-center gap-1.5 px-1 py-0.5">
                                    <Cpu size={13} className="text-cyan-500 shrink-0" />
                                    <span className="font-semibold text-xs">Components</span>
                                    {componentStatuses.length > 0 && (
                                        <Badge size="xs" variant="light" color="cyan" circle>
                                            {componentStatuses.length}
                                        </Badge>
                                    )}
                                </div>
                            ),
                        },
                        {
                            value: "highlights",
                            label: (
                                <div className="flex items-center gap-1.5 px-1 py-0.5">
                                    <Sparkles size={13} className="text-cyan-500 shrink-0" />
                                    <span className="font-semibold text-xs">AI Highlights</span>
                                </div>
                            ),
                        },
                    ]}
                />

                {activeTab === "highlights" && canGenerateReport && (
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

            {activeTab === "components" && (
                <PrebuiltComponentCarousel parts={componentStatuses} loading={loadingParts} />
            )}

            {/* TAB 2: AI HIGHLIGHTS */}
            {activeTab === "highlights" && (
                <>
                    {loadingAnalysis ? (
                        <Paper
                            radius="xl"
                            p="xl"
                            withBorder
                            className="bg-white/80 dark:bg-[#141a23]/80 border-slate-200 dark:border-white/10 flex flex-col items-center justify-center py-16 text-center gap-3"
                        >
                            <Loader size="md" color="cyan" />
                            <div>
                                <Text fw={700} size="sm" className="text-slate-900 dark:text-slate-100">
                                    Analyzing Hardware Synergy
                                </Text>
                                <Text size="xs" c="dimmed">
                                    Evaluating component performance benchmarks and strengths...
                                </Text>
                            </div>
                        </Paper>
                    ) : analysisError ? (
                        <Paper
                            radius="xl"
                            p="xl"
                            withBorder
                            className="bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-center py-12"
                        >
                            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2 opacity-90" />
                            <Text fw={700} size="sm" className="text-rose-900 dark:text-rose-200 mb-1">
                                Analysis Error
                            </Text>
                            <Text size="xs" c="dimmed" className="max-w-md mx-auto mb-4">
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
                    ) : !analysis || pros.length === 0 ? (
                        <Paper
                            radius="xl"
                            p="xl"
                            withBorder
                            className="bg-white/80 dark:bg-[#141a23]/80 border-slate-200 dark:border-white/10 py-12"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-3">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <Text fw={700} size="sm" className="text-slate-900 dark:text-slate-100 mb-1">
                                    No AI performance review yet
                                </Text>
                                <Text size="xs" c="dimmed" ta="center" className="max-w-lg mb-5">
                                    {canGenerateReport
                                        ? "Generate a review to summarize this build’s component balance, expected performance, and recommended use cases."
                                        : "An AI performance review has not been published for this system yet. Check back once one is available."}
                                </Text>
                                {canGenerateReport && (
                                    <SparkleButton
                                        onClick={onAnalyze}
                                        icon={<Sparkles className="w-4 h-4" />}
                                        className="px-5 h-10 text-xs font-semibold uppercase tracking-wider"
                                    >
                                        Generate review
                                    </SparkleButton>
                                )}
                            </div>
                        </Paper>
                    ) : (
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
                                                className="flex h-full min-h-[220px] flex-1 flex-col justify-between bg-white shadow-xs transition-all select-none dark:bg-[#141a23] border-slate-200/90 dark:border-white/10 hover:border-emerald-500/40 dark:hover:border-emerald-500/30"
                                            >
                                                <div className="flex-1 space-y-2.5">
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
                                                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
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
                    )}
                </>
            )}
        </div>
    );
}
