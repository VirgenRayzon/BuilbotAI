"use client";

import { use } from "react";
import Link from "next/link";
import { Container, Grid, Title, Text, Badge, Group, Paper, Button, Loader } from "@mantine/core";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { usePrebuiltDetails } from "./hooks/use-prebuilt-details";
import { PrebuiltImageView } from "./components/prebuilt-image-view";
import { PrebuiltActionCard } from "./components/prebuilt-action-card";
import { PrebuiltAiReview } from "./components/prebuilt-ai-review";

export default function PrebuiltProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: systemId } = use(params);
    const {
        system,
        loadingSystem,
        components,
        loadingParts,
        analysis,
        loadingAnalysis,
        analysisError,
        isReserving,
        isManagerOrAdmin,
        canGenerateReport,
        isComplete,
        missingParts,
        isInStock,
        backLink,
        backText,
        handleReserve,
        handleCustomizePrebuilt,
        handleAnalyze,
    } = usePrebuiltDetails(systemId);

    // 1. Loading State
    if (loadingSystem) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
                <Loader size="md" color="cyan" />
                <Text size="sm" c="dimmed" fw={500}>
                    Loading system specifications...
                </Text>
            </div>
        );
    }

    // 2. Not Found State
    if (!system) {
        return (
            <Container size="sm" py={80} className="text-center">
                <Paper p="2xl" radius="xl" withBorder className="bg-white/80 dark:bg-[#141a23]/80 border-slate-200 dark:border-white/10">
                    <Title order={2} size="h3" fw={800} className="mb-2">
                        System Not Found
                    </Title>
                    <Text size="sm" c="dimmed" className="mb-6">
                        The requested prebuilt rig might have been unlisted or relocated.
                    </Text>
                    <Button component={Link} href={backLink} variant="default" radius="md">
                        {backText}
                    </Button>
                </Paper>
            </Container>
        );
    }

    const hasComponents = Object.values(components).some(Boolean);

    return (
        <div className="min-h-screen overflow-x-hidden bg-white text-slate-900 transition-colors duration-500 dark:bg-[#0c0f14] dark:text-slate-50">
            <div
                className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] dark:invert"
                style={{ backgroundImage: "radial-gradient(#000 0.5px, transparent 0.5px)", backgroundSize: "24px 24px" }}
            />

            <div className="relative z-10 w-full px-4 py-8 sm:px-6 md:px-8 lg:px-10">
                {/* Top Navigation */}
                <div className="mb-8">
                    <Button
                        component={Link}
                        href={backLink}
                        variant="subtle"
                        color="gray"
                        size="xs"
                        leftSection={<ArrowLeft className="w-3.5 h-3.5" />}
                        className="font-semibold text-xs tracking-wider uppercase text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400"
                    >
                        {backText}
                    </Button>
                </div>

                {/* Desktop layout: visual at left, build details at right. */}
                <Grid gutter={{ base: "xl", lg: 40 }} align="stretch">
                    {/* Product information is first in the document for a better mobile reading order. */}
                    <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 1, md: 2 }} className="flex">
                        <div className="flex h-full w-full flex-col">
                            {/* Product Header */}
                            <div>
                                <Group gap="xs" mb="xs">
                                    <Badge
                                        variant="filled"
                                        color="cyan"
                                        size="md"
                                        radius="sm"
                                        className="font-bold tracking-wider uppercase text-[10px]"
                                    >
                                        {system.tier} Tier
                                    </Badge>
                                    {isComplete && (
                                        <Badge
                                            variant="light"
                                            color="teal"
                                            size="md"
                                            radius="sm"
                                            leftSection={<ShieldCheck className="w-3.5 h-3.5" />}
                                            className="font-semibold text-[10px]"
                                        >
                                            Verified Build
                                        </Badge>
                                    )}
                                </Group>

                                <Title
                                    order={1}
                                    className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 mb-3"
                                >
                                    {system.name}
                                </Title>

                                {system.description && (
                                    <Text size="md" c="dimmed" className="leading-relaxed">
                                        {system.description}
                                    </Text>
                                )}
                            </div>

                            {/* Anchor the purchase controls to the base of the image column. */}
                            <div className="mt-auto pt-6">
                                <PrebuiltActionCard
                                    price={system.price}
                                    isComplete={isComplete}
                                    missingPartsCount={missingParts.length}
                                    isInStock={isInStock}
                                    loadingParts={loadingParts}
                                    isReserving={isReserving}
                                    isManagerOrAdmin={isManagerOrAdmin}
                                    hasComponents={hasComponents}
                                    onReserve={handleReserve}
                                    onCustomize={handleCustomizePrebuilt}
                                >
                                    <PrebuiltAiReview
                                        analysis={analysis}
                                        loadingAnalysis={loadingAnalysis}
                                        analysisError={analysisError}
                                        canGenerateReport={canGenerateReport}
                                        onAnalyze={handleAnalyze}
                                        components={components}
                                        loadingParts={loadingParts}
                                    />
                                </PrebuiltActionCard>
                            </div>
                        </div>
                    </Grid.Col>

                    {/* The image defines the desktop row height. */}
                    <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 2, md: 1 }}>
                        <PrebuiltImageView
                            imageUrl={system.imageUrl}
                            systemName={system.name}
                            tier={system.tier}
                        />
                    </Grid.Col>
                </Grid>

            </div>
        </div>
    );
}
