"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container, Grid, Title, Text, Paper, Button, Loader } from "@mantine/core";
import { ArrowLeft } from "lucide-react";
import { usePrebuiltDetails } from "./hooks/use-prebuilt-details";
import { PrebuiltImageView } from "./components/prebuilt-image-view";
import { PrebuiltPerformanceAnalyzer } from "./components/prebuilt-performance-analyzer";
import { PrebuiltActionCard } from "./components/prebuilt-action-card";
import { PrebuiltHeaderCard } from "./components/prebuilt-header-card";
import { PrebuiltAiHighlights } from "./components/prebuilt-ai-highlights";
import { PrebuiltPartsList } from "./components/prebuilt-parts-list";
import { PrebuiltShowcase } from "@/components/landing/prebuilt-showcase";
import { getEcommerceFallbackImage } from "@/context/ecommerce-context";

export default function LegacyPrebuiltProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: systemId } = use(params);
    const router = useRouter();
    const {
        system,
        loadingSystem,
        components,
        componentStatuses,
        unavailableParts,
        loadingParts,
        analysis,
        loadingAnalysis,
        analysisError,
        isReserving,
        isManagerOrAdmin,
        canGenerateReport,
        isComplete,
        isInStock,
        backLink,
        backText,
        handleReserve,
        handleCustomizePrebuilt,
        handleAnalyze,
    } = usePrebuiltDetails(systemId);

    const handleBackClick = (e: React.MouseEvent) => {
        if (
            typeof window !== "undefined" &&
            window.history.length > 1 &&
            document.referrer &&
            document.referrer.startsWith(window.location.origin)
        ) {
            e.preventDefault();
            router.back();
        }
    };

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
                    <Button component={Link} href={backLink} onClick={handleBackClick} variant="default" radius="md">
                        {backText}
                    </Button>
                </Paper>
            </Container>
        );
    }

    const hasComponents = Object.values(components).some(Boolean);
    const ecommerceSubComponents = Object.entries(components)
        .filter(([, part]) => Boolean(part))
        .map(([cat, part]) => ({
            category: cat.toUpperCase(),
            name: part!.name,
            price: part!.price || 0,
            imageUrl:
                part!.imageUrl ||
                part!.images?.[0] ||
                getEcommerceFallbackImage(cat, "part"),
        }));

    return (
        <div className="min-h-screen overflow-x-hidden bg-white text-slate-900 transition-colors duration-500 dark:bg-[#0c0f14] dark:text-slate-50">
            <div
                className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] dark:invert"
                style={{ backgroundImage: "radial-gradient(#000 0.5px, transparent 0.5px)", backgroundSize: "24px 24px" }}
            />

            <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 py-8 sm:px-6 md:px-8 lg:px-8 xl:px-10">
                {/* Top Navigation */}
                <div className="mb-6">
                    <Button
                        component={Link}
                        href={backLink}
                        onClick={handleBackClick}
                        variant="subtle"
                        color="gray"
                        size="xs"
                        leftSection={<ArrowLeft className="w-3.5 h-3.5" />}
                        className="font-semibold text-xs tracking-wider uppercase text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400"
                    >
                        {backText}
                    </Button>
                </div>

                {/* 2-Column Blueprint Layout */}
                <Grid gutter={{ base: "xl", lg: 32 }} align="start">
                    {/* LEFT COLUMN: Image Preview + (Desktop only: Performance Analyzer & AI Highlights) */}
                    <Grid.Col span={{ base: 12, lg: 6 }}>
                        <div className="flex flex-col gap-8">
                            {/* Image Preview */}
                            <PrebuiltImageView
                                imageUrl={system.imageUrl}
                                images={system.images}
                                systemName={system.name}
                                tier={system.tier}
                            />

                            {/* Desktop-only: Performance Analyzer & AI Highlights */}
                            <div className="hidden lg:flex flex-col gap-8">
                                <PrebuiltPerformanceAnalyzer
                                    components={components}
                                    componentStatuses={componentStatuses}
                                    loadingParts={loadingParts}
                                    onCustomize={handleCustomizePrebuilt}
                                />

                                <PrebuiltAiHighlights
                                    analysis={analysis}
                                    loadingAnalysis={loadingAnalysis}
                                    analysisError={analysisError}
                                    canGenerateReport={canGenerateReport}
                                    onAnalyze={handleAnalyze}
                                />
                            </div>
                        </div>
                    </Grid.Col>

                    {/* RIGHT COLUMN: Header Card (Badges, Name, Description, Starting At + Customize on right), Parts List, Bottom Action Card */}
                    <Grid.Col span={{ base: 12, lg: 6 }}>
                        <div className="flex flex-col gap-5">
                            {/* Combined Header Card: Badges, Prebuilt Name, Description, Starting At + Price, and Customize on right */}
                            <PrebuiltHeaderCard
                                system={system}
                                price={system.price}
                                isComplete={isComplete}
                                isInStock={isInStock}
                                loadingParts={loadingParts}
                                hasComponents={hasComponents}
                                onCustomize={handleCustomizePrebuilt}
                            />

                            {/* Parts in List View */}
                            <PrebuiltPartsList
                                parts={componentStatuses}
                                loading={loadingParts}
                            />

                            {/* Bottom Price Display and Action Buttons */}
                            <PrebuiltActionCard
                                systemId={system.id}
                                systemName={system.name}
                                tier={system.tier}
                                imageUrl={system.imageUrl || system.images?.[0]}
                                componentList={ecommerceSubComponents}
                                price={system.price}
                                priceLabel="Build Total"
                                isComplete={isComplete}
                                unavailableParts={unavailableParts}
                                isInStock={isInStock}
                                loadingParts={loadingParts}
                                isReserving={isReserving}
                                isManagerOrAdmin={isManagerOrAdmin}
                                hasComponents={hasComponents}
                                onReserve={handleReserve}
                            />
                        </div>
                    </Grid.Col>
                </Grid>

                {/* Mobile-only: Performance Analyzer and AI System Highlights placed at the end before "You might also like" */}
                <div className="flex lg:hidden flex-col gap-8 mt-10">
                    <PrebuiltPerformanceAnalyzer
                        components={components}
                        componentStatuses={componentStatuses}
                        loadingParts={loadingParts}
                        onCustomize={handleCustomizePrebuilt}
                    />

                    <PrebuiltAiHighlights
                        analysis={analysis}
                        loadingAnalysis={loadingAnalysis}
                        analysisError={analysisError}
                        canGenerateReport={canGenerateReport}
                        onAnalyze={handleAnalyze}
                    />
                </div>

                {/* Full-width Carousel: "You might also like." */}
                <div className="mt-16 sm:mt-24 pt-8 border-t border-slate-200/80 dark:border-white/10">
                    <PrebuiltShowcase
                        badge="Battle-Ready"
                        title="You might also like."
                        subtitle="Expertly architected PC builds, validated by Buildbot AI for zero-bottleneck performance."
                        excludeId={system.id}
                        className="py-12 sm:py-16"
                    />
                </div>
            </div>
        </div>
    );
}
