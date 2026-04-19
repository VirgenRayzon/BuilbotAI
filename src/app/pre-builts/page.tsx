
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/theme-provider";
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { InventoryToolbar } from '@/components/inventory-toolbar';
import { PrebuiltSystemCard } from '@/components/prebuilt-system-card';
import type { PrebuiltSystem } from '@/lib/types';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { PrebuiltsTable } from '@/components/prebuilts-table';
import { SearchX, MonitorOff, ShieldCheck, Zap, Cpu } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUserProfile } from '@/context/user-profile';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { FullPageLoader } from "@/components/full-page-loader";
import { useLoading } from "@/context/loading-context";

const prebuiltCategories = [
    { name: "Entry", selected: true },
    { name: "Mid-Range", selected: true },
    { name: "High-End", selected: true },
    { name: "Workstation", selected: true },
];

export default function PreBuiltsPage() {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const firestore = useFirestore();
    const { authUser, profile, loading: authLoading } = useUserProfile();
    const router = useRouter();

    const prebuiltSystemsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'prebuiltSystems')
        );
    }, [firestore]);
    const { data: prebuiltSystems, loading } = useCollection<PrebuiltSystem>(prebuiltSystemsQuery);

    const [categories, setCategories] = useState(prebuiltCategories);
    const [sortBy, setSortBy] = useState('Date Added');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');

    // Role-based redirection
    useEffect(() => {
        if (!authLoading) {
            if (!authUser) {
                router.push('/signin');
            } else if (profile?.isManager) {
                router.push('/admin');
            }
        }
    }, [authUser, profile, authLoading, router]);

    const handleCategoryChange = (categoryName: string, selected: boolean) => {
        setCategories(prev => {
            if (categoryName === 'All') {
                const anyUnselected = prev.some(cat => !cat.selected);
                return prev.map(cat => ({ ...cat, selected: anyUnselected }));
            }
            return prev.map((cat: any) => ({
                ...cat,
                selected: cat.name === categoryName ? true : false
            }));
        });
    };

    const filteredAndSortedSystems = useMemo(() => {
        if (!prebuiltSystems) return [];
        const selectedCategories = categories.filter(c => c.selected).map(c => c.name);
        const searchLower = searchQuery.toLowerCase();

        return prebuiltSystems.filter(system => {
            const isNotArchived = !system.isArchived;
            const matchesCategory = selectedCategories.includes(system.tier);
            const matchesSearch = system.name.toLowerCase().includes(searchLower) ||
                (system.description?.toLowerCase() || '').includes(searchLower);
            return isNotArchived && matchesCategory && matchesSearch;
        })
            .sort((a, b) => {
                let compare = 0;
                if (sortBy === 'Name') compare = a.name.localeCompare(b.name);
                else if (sortBy === 'Price') compare = a.price - b.price;
                else if (sortBy === 'Tier') compare = a.tier.localeCompare(b.tier);
                else if (sortBy === 'Date Added') {
                    const dateA = a.createdAt?.toDate?.() || a.createdAt || 0;
                    const dateB = b.createdAt?.toDate?.() || b.createdAt || 0;
                    compare = new Date(dateA).getTime() - new Date(dateB).getTime();
                }
                return sortDirection === 'asc' ? compare : -compare;
            });
    }, [prebuiltSystems, categories, sortBy, sortDirection, searchQuery]);

    const [mounted, setMounted] = useState(false);

    const { setIsPageLoading } = useLoading();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        setIsPageLoading(!mounted || authLoading);
        return () => setIsPageLoading(false);
    }, [mounted, authLoading, setIsPageLoading]);

    if (!mounted || authLoading) {
        return null;
    }

    return (
        <div className={cn(
            "min-h-screen transition-colors duration-500 overflow-x-hidden",
            isDark ? "bg-[#0c0f14] text-slate-50" : "bg-white text-slate-900"
        )}>
            {/* Circuit Pattern Background */}
            <div className={cn(
                "fixed inset-0 opacity-[0.03] pointer-events-none z-0",
                isDark ? "invert" : ""
            )} style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

            <main className="w-full max-w-[1800px] mx-auto px-4 md:px-8 py-8 md:py-12 pt-24 md:pt-32 relative z-10">
            <div className="relative mb-12">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative z-10"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-px w-8 bg-primary" />
                        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary italic">Deploy Now</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-headline font-black uppercase tracking-tighter leading-none mb-6">
                        Battle-Ready <span className="text-primary italic">Systems</span>
                    </h1>
                    <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed font-medium">
                        Expertly crafted builds engineered for absolute performance. Validated by Buildbot AI for ultimate reliability and stability.
                    </p>
                </motion.div>
                
                {/* Background Accent */}
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-6 rounded-3xl border backdrop-blur-xl shadow-2xl transition-all duration-500",
                  isDark ? "bg-slate-900/40 border-white/5 shadow-black/40" : "bg-white/60 border-slate-200 shadow-slate-200/50"
                )}
            >
                <div className="mb-8">
                    <InventoryToolbar
                        categories={categories}
                        onCategoryChange={handleCategoryChange}
                        itemCount={filteredAndSortedSystems.length}
                        sortBy={sortBy}
                        onSortByChange={setSortBy}
                        sortDirection={sortDirection}
                        onSortDirectionChange={setSortDirection}
                        supportedSorts={['Date Added', 'Name', 'Price', 'Tier']}
                        view={view}
                        onViewChange={setView}
                        showViewToggle={true}
                        searchQuery={searchQuery}
                        onSearchQueryChange={setSearchQuery}
                    />
                </div>

                {loading ? (
                    view === 'grid' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                            {[...Array(8)].map((_, i) => (
                                <Card key={i} className="overflow-hidden rounded-2xl border-white/5 bg-white/5">
                                    <CardContent className="p-0">
                                        <Skeleton className="aspect-square w-full rounded-none" />
                                    </CardContent>
                                    <CardContent className="p-4 space-y-3 mt-2">
                                        <Skeleton className="h-6 w-3/4" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-5 w-24 mt-4" />
                                    </CardContent>
                                    <CardFooter className="p-4 pt-0 flex justify-between items-center mt-2">
                                        <Skeleton className="h-8 w-1/3" />
                                        <Skeleton className="h-10 w-28" />
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-2xl border border-border/50 bg-background/20">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow>
                                        <TableHead className="uppercase text-[10px] font-bold tracking-widest">System Identifier</TableHead>
                                        <TableHead className="uppercase text-[10px] font-bold tracking-widest">Performance Tier</TableHead>
                                        <TableHead className="text-right uppercase text-[10px] font-bold tracking-widest">Value (PHP)</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[...Array(5)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell>
                                                <div className="flex items-center gap-4">
                                                    <Skeleton className="w-12 h-12 rounded-xl" />
                                                    <div className="space-y-2">
                                                        <Skeleton className="h-4 w-40" />
                                                        <Skeleton className="h-3 w-64" />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                                            <TableCell align="right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )
                ) : filteredAndSortedSystems.length > 0 ? (
                    view === 'grid' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                            {filteredAndSortedSystems.map(system => (
                                <PrebuiltSystemCard key={system.id} system={system} />
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-2xl border border-border/50 bg-background/20">
                            <PrebuiltsTable systems={filteredAndSortedSystems} showActions={false} />
                        </div>
                    )
                ) : (
                    <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-12">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                            {searchQuery ? (
                                <SearchX className="h-8 w-8 text-muted-foreground opacity-20" />
                            ) : (
                                <MonitorOff className="h-8 w-8 text-muted-foreground opacity-20" />
                            )}
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-headline font-bold uppercase tracking-tight">Zero Diagnostics Found</h3>
                            <p className="max-w-md mx-auto text-muted-foreground text-sm">
                                {searchQuery
                                    ? `No systems found matching "${searchQuery}". Reset filters to restart scanning.`
                                    : "No pre-built rigs match the currently selected criteria."}
                            </p>
                        </div>
                    </div>
                )}
            </motion.div>
        </main>
        </div>
    )
}
