"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/context/theme-provider";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserProfile } from "@/context/user-profile";
import { useLoading } from "@/context/loading-context";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Sparkles } from "lucide-react";

// Custom Hooks
import { useInventoryQuery } from "../../builder/hooks/use-inventory-query";
import { useBuilderLogic } from "../../builder/hooks/use-builder-logic";
import { useFilteredInventory } from "../../builder/hooks/use-filtered-inventory";

// Components
import { InventoryView } from "../../builder/components/inventory-view";
import { RouteGuard } from "@/components/auth/route-guard";
import { BuilderFloatingChat } from "@/components/builder-floating-chat";
import { BuilderFloatingAnalytics } from "@/components/builder-floating-analytics";
import type { Part } from "@/lib/types";

export default function TestBuilder2BrowsePage() {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const { authUser, profile, loading: authLoading } = useUserProfile();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Data Layer
    const { allParts, loading: inventoryLoading } = useInventoryQuery();
    
    // Logic Layer
    const { 
        build, handlePartToggle, getCountInBuild, isLoaded 
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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Extract active category from URL
    const activeCategory = searchParams.get('category') || 'All';

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

    // Calculate selected parts counts
    const selectedPartsCount = Object.entries(build).reduce((acc, [name, value]) => {
        if (Array.isArray(value)) return acc + value.length;
        return acc + (value ? 1 : 0);
    }, 0);

    const totalPartsCount = Object.keys(build).length;

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

                <main className="w-full max-w-[1800px] mx-auto px-4 md:px-8 py-8 md:py-12 pb-24 pt-24 md:pt-32 relative z-10">
                    
                    {/* Floating Header Navigation Bar */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-muted/20 border border-border/40 mb-8 backdrop-blur-xl">
                        <div className="flex items-center gap-4">
                            <Button 
                                onClick={() => router.push('/test-builder-2')} 
                                variant="outline" 
                                className="rounded-xl h-10 text-[10px] uppercase font-bold tracking-widest border-primary/20 text-primary hover:bg-primary/10 transition-all flex items-center gap-1.5"
                            >
                                <ChevronLeft className="h-4 w-4" /> Back to Build
                            </Button>
                            <div>
                                <h1 className="text-xl font-headline font-bold uppercase tracking-tight text-foreground">
                                    Browse Components
                                </h1>
                                <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">
                                    Selecting parts for category: <span className="text-primary font-black">{activeCategory}</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <span className="text-[9px] uppercase tracking-widest text-muted-foreground/60 font-bold block">Build Progress</span>
                                <p className="text-sm font-bold text-foreground">{selectedPartsCount}/{totalPartsCount} Slots</p>
                            </div>
                            <div className="text-right">
                                <span className="text-[9px] uppercase tracking-widest text-muted-foreground/60 font-bold block">Current Budget</span>
                                <p className="text-sm font-bold text-primary">{formatCurrency(totalPrice)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 items-start">
                        {/* Catalog Inventory view full width */}
                        <InventoryView 
                            className="col-span-12"
                            gridCols={5}
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

                <BuilderFloatingChat build={build} />
            </div>
        </RouteGuard>
    );
}
