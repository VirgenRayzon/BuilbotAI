"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import { Paper, Box, Group, ThemeIcon, Text } from '@mantine/core';
import { ChatForm } from '@/components/chat-form';
import { BuildSummary } from '@/components/build-summary';

interface RecommendationTabProps {
    isDark: boolean;
    isPending: boolean;
    handleGetRecommendations: (data: any) => void;
    handleCancelRecommendations: () => void;
    build: any;
    elapsedTime: number;
    finalResponseTime: number | null;
    totalPrice: number;
    error?: string | null;
}

export function RecommendationTab({
    isDark,
    isPending,
    handleGetRecommendations,
    handleCancelRecommendations,
    build,
    elapsedTime,
    finalResponseTime,
    totalPrice,
    error
}: RecommendationTabProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-12 gap-5 xl:gap-6 h-full"
        >
            {/* Left Column - Width matched to "Your Build" (lg:col-span-3) */}
            <aside className="lg:col-span-3 lg:sticky lg:top-24 self-start">
                <Paper
                    radius="lg"
                    withBorder
                    shadow="xl"
                    className="w-full overflow-hidden bg-white/95 dark:bg-[#0d1117]/95 border-slate-200 dark:border-cyan-500/20 backdrop-blur-xl relative shadow-xl dark:shadow-[0_0_35px_rgba(0,0,0,0.5)]"
                >
                    <Box className="p-3 bg-slate-50/90 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10">
                        <Group justify="space-between" align="center">
                            <Group gap="xs" align="center">
                                <ThemeIcon size={32} radius="md" variant="light" color="cyan" className="shadow-sm">
                                    <Bot className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
                                </ThemeIcon>
                                <Text fw={900} size="xl" className="font-headline tracking-tight text-slate-900 dark:text-white">
                                    Buildbot Advisor
                                </Text>
                            </Group>
                        </Group>
                    </Box>

                    <Box className="p-3">
                        <ChatForm
                            getRecommendations={handleGetRecommendations}
                            isPending={isPending}
                        />
                    </Box>
                </Paper>
            </aside>

            {/* Right Column - Width matched to Diagnostics (lg:col-span-9) */}
            <div className="lg:col-span-9">
                <BuildSummary
                    build={build}
                    isPending={isPending}
                    onCancel={handleCancelRecommendations}
                    elapsedTime={elapsedTime}
                    finalResponseTime={finalResponseTime}
                    totalPrice={totalPrice}
                    error={error}
                />
            </div>
        </motion.div>
    );
}
