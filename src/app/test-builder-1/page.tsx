"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/context/theme-provider";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserProfile } from "@/context/user-profile";
import { useLoading } from "@/context/loading-context";
import { cn, formatCurrency } from "@/lib/utils";
import { Pin, PinOff, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

// Custom Hooks
import { useInventoryQuery } from "../builder/hooks/use-inventory-query";
import { useBuilderLogic } from "../builder/hooks/use-builder-logic";
import { useFilteredInventory } from "../builder/hooks/use-filtered-inventory";

// Components
import { BuilderHeader } from "../builder/components/builder-header";
import { InventoryView } from "../builder/components/inventory-view";
import { YourBuild } from "@/components/your-build";
import { RouteGuard } from "@/components/auth/route-guard";
import { BuilderFloatingChat } from "@/components/builder-floating-chat";
import { BuilderFloatingAnalytics } from "@/components/builder-floating-analytics";
import type { Part, Resolution, WorkloadType } from "@/lib/types";

export default function TestBuilder1Page() {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const { authUser, profile, loading: authLoading } = useUserProfile();
    const router = useRouter();
    const searchParams = useSearchParams();

    // A/B Testing Layout State
    const [isPinned, setIsPinned] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // Data Layer
    const { allParts, loading: inventoryLoading } = useInventoryQuery();

    // Logic Layer
    const {
        build, handlePartToggle, handleRemovePart,
        handleClearBuild, getCountInBuild, isLoaded
    } = useBuilderLogic(allParts);

    // Filter Layer
    const {
        searchQuery, setSearchQuery,
        sortBy, setSortBy,
        sortDirection, setSortDirection,
        currentPage, setCurrentPage,
        itemsPerPage, setItemsPerPage,
        categories,
        handleCategoryChange,
        sortedAndFilteredParts,
        paginatedParts,
        totalPages,
        availableBrands,
        selectedBrands,
        setSelectedBrands
    } = useFilteredInventory(allParts, build, getCountInBuild);

    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [resolution, setResolution] = useState<Resolution>('1080p');
    const [workload, setWorkload] = useState<WorkloadType>('Balanced');
    const [analysis, setAnalysis] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    const handleApplySuggestion = (category: string, partId: string) => {
        const event = new CustomEvent('add-suggestion', {
            detail: { id: partId, category }
        });
        window.dispatchEvent(event);
    };

    useEffect(() => {
        setMounted(true);
        // Load layout preference from localStorage if available
        const savedPinned = localStorage.getItem('test_builder_1_pinned');
        if (savedPinned) {
            setIsPinned(savedPinned === 'true');
        }
    }, []);

    const handlePinToggle = (pinned: boolean) => {
        setIsPinned(pinned);
        localStorage.setItem('test_builder_1_pinned', String(pinned));
        if (pinned) {
            setIsOpen(false);
        }
    };

    // Handle initial category from URL
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
            return (items as any)?.model === part.name;
        }
        return (build[part.category] as any)?.model === part.name;
    };

    const selectedPartsCount = Object.entries(build).reduce((acc, [name, value]) => {
        if (Array.isArray(value)) return acc + value.length;
        return acc + (value ? 1 : 0);
    }, 0);

    const totalPrice = Object.values(build).reduce((acc, component) => {
        if (Array.isArray(component)) {
            return acc + component.reduce((sum, c) => sum + (c.price || 0), 0);
        }
        return acc + (component?.price || 0);
    }, 0);

    return (
        <RouteGuard requiredPermission="isSuperAdmin">
            <div className={cn(
                "min-h-screen transition-colors duration-500 overflow-x-hidden",
                isDark ? "bg-background text-foreground" : "bg-white text-slate-900"
            )}>
                {/* Circuit Pattern Background */}
                <div className={cn(
                    "fixed inset-0 opacity-[0.05] pointer-events-none z-0",
                    isDark ? "invert" : ""
                )} style={{ backgroundImage: 'radial-gradient(currentColor 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

                <main className="w-full max-w-[1800px] mx-auto px-4 md:px-8 py-8 md:py-12 pb-24 lg:pb-12 pt-10 md:pt-20 relative z-10">
                    <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30">Layout A/B Testing</span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Test Variant 1</span>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-headline font-bold uppercase tracking-tight text-foreground mt-2">
                                Masterpiece Architect <span className="text-primary font-light text-2xl md:text-3xl font-sans normal-case italic">FAB Drawer Layout</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePinToggle(!isPinned)}
                                className="rounded-xl h-9 text-[10px] font-headline font-bold uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/10 transition-all"
                            >
                                {isPinned ? (
                                    <>
                                        <PinOff className="h-3.5 w-3.5 mr-2" /> Unpin Build Panel
                                    </>
                                ) : (
                                    <>
                                        <Pin className="h-3.5 w-3.5 mr-2" /> Pin Build Panel
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push("/profile")}
                                className="rounded-xl h-9 text-[10px] font-headline font-bold uppercase tracking-widest"
                            >
                                Back to Settings
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">
                        {/* Your Build — Sidebar (Rendered if pinned) */}
                        {isPinned && (
                            <aside className="hidden lg:block lg:col-span-3 self-start space-y-4">
                                <div className="p-4 rounded-2xl bg-muted/20 border border-border/40 backdrop-blur-xl flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Pin className="h-3.5 w-3.5 text-primary rotate-45" />
                                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Docked Sidebar</span>
                                    </div>
                                    <Button
                                        onClick={() => handlePinToggle(false)}
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 px-2 text-[9px] uppercase font-bold text-destructive hover:bg-destructive/10"
                                    >
                                        Unpin Sidebar
                                    </Button>
                                </div>
                                <YourBuild
                                    build={build}
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
                                />
                            </aside>
                        )}

                        {/* Inventory — Expands to full screen if sidebar is unpinned */}
                        <InventoryView
                            className={isPinned ? "lg:col-span-9" : "col-span-12 lg:col-span-12"}
                            gridCols={isPinned ? 4 : 5}
                            loading={inventoryLoading}
                            paginatedParts={paginatedParts}
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
                            itemCount={sortedAndFilteredParts.length}
                            availableBrands={availableBrands}
                            selectedBrands={selectedBrands}
                            onBrandChange={setSelectedBrands}
                        />
                    </div>
                </main>

                {/* Floating Action Button (FAB) (Visible only when unpinned) */}
                {!isPinned && (
                    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end">
                        <Button
                            onClick={() => setIsOpen(true)}
                            className="h-14 px-6 rounded-2xl bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/95 hover:to-cyan-500/95 text-white font-bold tracking-widest uppercase text-xs shadow-[0_8px_30px_rgb(6,182,212,0.3)] hover:shadow-[0_8px_30px_rgb(6,182,212,0.5)] border-none transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <Briefcase className="h-5 w-5 animate-pulse" />
                            <span>View Build ({selectedPartsCount})</span>
                            <span className="h-4 w-px bg-white/20 mx-1"></span>
                            <span className="font-mono">{formatCurrency(totalPrice)}</span>
                        </Button>
                    </div>
                )}

                {/* Sliding Drawer/Sheet for "Your Build" (Unpinned state) */}
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-background/95 backdrop-blur-2xl border-l border-primary/20">
                        <SheetHeader className="py-4 px-5 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between">
                            <div>
                                <SheetTitle className="font-headline text-lg font-bold tracking-tight uppercase">Floating Build Panel</SheetTitle>
                                <p className="text-[9px] uppercase tracking-widest text-muted-foreground/60 mt-0.5">Quick access dashboard</p>
                            </div>
                            <Button
                                onClick={() => handlePinToggle(true)}
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-lg text-[9px] uppercase font-bold tracking-wider border-primary/30 text-primary hover:bg-primary/10 mr-4"
                            >
                                <Pin className="h-3 w-3 mr-1" /> Pin to Sidebar
                            </Button>
                        </SheetHeader>
                        <ScrollArea className="flex-1 w-full h-full">
                            <div className="p-1">
                                <YourBuild
                                    build={build}
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
                                    className="border-none bg-transparent shadow-none"
                                />
                            </div>
                        </ScrollArea>
                    </SheetContent>
                </Sheet>

                {/* Floating UI Elements */}
                <BuilderFloatingAnalytics
                    build={build}
                    resolution={resolution}
                    onResolutionChange={setResolution}
                    workload={workload}
                    onWorkloadChange={setWorkload}
                    analysis={analysis}
                    onApplySuggestion={handleApplySuggestion}
                />
                <BuilderFloatingChat build={build} />
            </div>
        </RouteGuard>
    );
}
