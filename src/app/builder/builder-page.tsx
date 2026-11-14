"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "@/context/theme-provider";
import { useSearchParams } from "next/navigation";
import { useUserProfile } from "@/context/user-profile";
import { cn } from "@/lib/utils";

import { useInventoryQuery } from "./hooks/use-inventory-query";
import { useBuilderLogic } from "./hooks/use-builder-logic";
import { useFilteredInventory } from "./hooks/use-filtered-inventory";

import { BuilderHeader } from "./components/builder-header";
import { InventoryView } from "./components/inventory-view";
import { YourBuild } from "@/components/your-build";
import { RouteGuard } from "@/components/auth/route-guard";
import { ProtectedPageLoading } from "@/components/auth/protected-page-loading";
import { DeferredBuilderChat } from "@/components/deferred-builder-chat";
import { BuildLayoutFab } from "@/components/build/layout-2d/build-layout-tab";
import type { Part, ComponentData, Resolution, WorkloadType } from "@/lib/types";
import { BUILDER_PART_IMAGE_SIZES } from '@/lib/inventory-image-sizes';
import { useLiveBuildRecommendations } from '@/hooks/use-live-build-recommendations';
import { prioritizeRecommendedParts } from '@/lib/live-build-recommendations';
import { useSiteSettings } from '@/context/site-settings-context';
import Link from 'next/link';
import { AnimatedMessageIcon } from '@/components/ui/animated-icons';
import { PUBLIC_FEATURE_SIGN_IN_URL } from '@/lib/public-feature-auth';

export default function BuilderPage({ initialParts }: { initialParts?: Part[] }) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const { authUser } = useUserProfile();
    const searchParams = useSearchParams();
    const { isLiveBuilderRecommendationsEnabled } = useSiteSettings();

    const { allParts, loading: inventoryLoading } = useInventoryQuery(initialParts);

    const {
        build, handlePartToggle, handleRemovePart,
        handleClearBuild, getCountInBuild
    } = useBuilderLogic(allParts);

    const {
        searchQuery, setSearchQuery,
        sortBy, setSortBy,
        sortDirection, setSortDirection,
        currentPage, setCurrentPage,
        itemsPerPage, setItemsPerPage,
        categories,
        handleCategoryChange,
        sortedAndFilteredParts,
        availableBrands,
        selectedBrands,
        setSelectedBrands,
        hideIncompatible,
        setHideIncompatible
    } = useFilteredInventory(allParts, build, getCountInBuild);

    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [resolution, setResolution] = useState<Resolution>('1080p');
    const [workload, setWorkload] = useState<WorkloadType>('AAA');
    const [autoRecommendationsEnabled, setAutoRecommendationsEnabled] = useState(true);
    const [analysis, setAnalysis] = useState<any>(null);
    const activeCategories = categories.filter(category => category.selected);
    const preferredCategory = activeCategories.length === 1 ? activeCategories[0].name : null;
    const recommendations = useLiveBuildRecommendations({
        allParts, build, resolution, workload, preferredCategory,
        user: authUser || null, onAddPart: handlePartToggle,
        enabled: isLiveBuilderRecommendationsEnabled && autoRecommendationsEnabled && !!authUser,
    });
    const prioritizedParts = useMemo(() =>
        prioritizeRecommendedParts(sortedAndFilteredParts, recommendations.suggestions),
    [sortedAndFilteredParts, recommendations.suggestions]);
    const totalPages = Math.ceil(prioritizedParts.length / itemsPerPage);
    const paginatedParts = useMemo(() => prioritizedParts.slice(
        (currentPage - 1) * itemsPerPage, currentPage * itemsPerPage,
    ), [prioritizedParts, currentPage, itemsPerPage]);
    const recommendationKey = recommendations.suggestions.map(item => `${item.category}:${item.id}`).join('|');
    useEffect(() => { setCurrentPage(1); }, [recommendationKey, setCurrentPage]);

    const handleApplySuggestion = (category: string, partId: string) => {
        const event = new CustomEvent('add-suggestion', {
            detail: { id: partId, category }
        });
        window.dispatchEvent(event);
    };

    useEffect(() => {
        const categoryParam = searchParams.get('category');
        if (categoryParam) {
            handleCategoryChange(categoryParam, true);
        }
    }, [searchParams]);

    const isSelected = (part: Part) => {
        if (part.category === 'Storage' || part.category === 'RAM') {
            const items = build[part.category];
            if (Array.isArray(items)) {
                return items.some(c => c.model === part.name);
            }
            return (items as ComponentData)?.model === part.name;
        }
        return (build[part.category] as ComponentData)?.model === part.name;
    };

    return (
        <RouteGuard requiredPermission="canUseBuilder" loadingComponent={<ProtectedPageLoading variant="builder" />}>
            <div className={cn(
                "min-h-screen transition-colors duration-500 overflow-x-hidden",
                isDark ? "bg-[#0c0f14] text-slate-50" : "bg-slate-50 text-slate-900"
            )}>
                <div className={cn(
                    "fixed inset-0 opacity-[0.05] pointer-events-none z-0",
                    isDark ? "invert" : ""
                )} style={{ backgroundImage: 'radial-gradient(currentColor 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

                <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-8 xl:px-10 py-4 md:py-6 pb-24 lg:pb-12 pt-4 md:pt-6 relative z-10">
                    <BuilderHeader />

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">
                        <div className="contents lg:block lg:col-span-3 self-start">
                            <YourBuild
                                build={build}
                                openReservation={searchParams.get('reserve') === '1'}
                                recommendationState={isLiveBuilderRecommendationsEnabled && authUser ? recommendations : undefined}
                                autoRecommendationsEnabled={autoRecommendationsEnabled}
                                onAutoRecommendationsChange={setAutoRecommendationsEnabled}
                                onRemovePart={handleRemovePart}
                                onClearBuild={handleClearBuild}
                                resolution={resolution}
                                onResolutionChange={setResolution}
                                workload={workload}
                                onWorkloadChange={setWorkload}
                                analysis={analysis}
                                onAnalysisUpdate={setAnalysis}
                                onCategorySelect={handleCategoryChange}
                                categories={categories}
                                onApplySuggestion={handleApplySuggestion}
                            />
                        </div>

                        <InventoryView
                            imageSizes={BUILDER_PART_IMAGE_SIZES}
                            loading={inventoryLoading}
                            paginatedParts={paginatedParts}
                            recommendations={isLiveBuilderRecommendationsEnabled ? recommendations : undefined}
                            totalPages={totalPages}
                            currentPage={currentPage}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                            onItemsPerPageChange={setItemsPerPage}
                            view={view}
                            onViewChange={setView}
                            categories={categories}
                            onCategoryChange={handleCategoryChange}
                            searchQuery={searchQuery}
                            onSearchQueryChange={setSearchQuery}
                            sortBy={sortBy}
                            onSortByChange={(val) => { setSortBy(val); setCurrentPage(1); }}
                            sortDirection={sortDirection}
                            onSortDirectionChange={(val) => { setSortDirection(val); setCurrentPage(1); }}
                            onTogglePart={handlePartToggle}
                            isSelected={isSelected}
                            itemCount={prioritizedParts.length}
                            availableBrands={availableBrands}
                            selectedBrands={selectedBrands}
                            onBrandChange={setSelectedBrands}
                            hideIncompatible={hideIncompatible}
                            onHideIncompatibleChange={setHideIncompatible}
                        />
                    </div>
                </main>

                <BuildLayoutFab
                    build={build}
                    onCategorySelect={handleCategoryChange}
                    activeFilter={preferredCategory}
                />

                {authUser ? <DeferredBuilderChat build={build} /> : (
                    <Link
                        href={PUBLIC_FEATURE_SIGN_IN_URL}
                        aria-label="Sign in to use Buildbot chat"
                        title="Sign in to use Buildbot chat"
                        className="fixed bottom-20 right-4 z-50 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-cyan-600 text-white shadow-lg transition-colors hover:bg-cyan-700 sm:bottom-24 sm:right-6 lg:bottom-6"
                    >
                        <AnimatedMessageIcon size={22} />
                    </Link>
                )}
            </div>
        </RouteGuard>
    );
}
