'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@mantine/core';
import { ArrowRight } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query } from 'firebase/firestore';
import { PrebuiltSystem } from '@/lib/types';
import { PrebuiltSystemCard } from '@/components/prebuilt-system-card';
import { SectionHeader } from './section-header';
import { motion } from 'framer-motion';
import { useTheme } from "@/context/theme-provider";
import { cn } from "@/lib/utils";

import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

export interface PrebuiltShowcaseProps {
    badge?: string;
    title?: string;
    subtitle?: string;
    excludeId?: string;
    className?: string;
    isAdminPreview?: boolean;
    layout?: "grid" | "carousel";
    limit?: number;
    showViewAll?: boolean;
}

export function PrebuiltShowcase({
    badge = "Battle-Ready",
    title = "Featured Systems",
    subtitle = "Expertly architected PC builds, validated by Buildbot AI for zero-bottleneck performance.",
    excludeId,
    className,
    isAdminPreview = false,
    layout = "grid",
    limit = 12,
    showViewAll = true,
}: PrebuiltShowcaseProps = {}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const firestore = useFirestore();
    const prebuiltSystemsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'prebuiltSystems')
        );
    }, [firestore]);

    const { data: systems, loading } = useCollection<PrebuiltSystem>(prebuiltSystemsQuery);

    const [showAllParts, setShowAllParts] = useState(false);

    const activeSystems = useMemo(() => {
        if (!systems) return [];
        const unarchived = systems.filter(s => !s.isArchived);
        if (!excludeId) return unarchived;
        const filtered = unarchived.filter(s => s.id !== excludeId && s.productId !== excludeId);
        return filtered.length > 0 ? filtered : unarchived;
    }, [systems, excludeId]);

    const displayedSystems = useMemo(() => {
        if (layout === "grid" && limit) {
            return activeSystems.slice(0, limit);
        }
        return activeSystems;
    }, [activeSystems, layout, limit]);

    return (
        <section className={cn("py-32 relative overflow-hidden transition-colors duration-1000", className)}>
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-8 xl:px-10 relative z-10">
                <SectionHeader
                    badge={badge}
                    title={title}
                    subtitle={subtitle}
                />

                <div className={cn("relative mt-16 sm:mt-20", layout === "carousel" && "px-4 md:px-12")}>
                    {loading ? null : activeSystems.length > 0 ? (
                        layout === "carousel" ? (
                            <Carousel
                                opts={{
                                    align: "start",
                                    loop: true,
                                }}
                                className="w-full"
                            >
                                <CarouselContent className="-ml-4 md:-ml-8">
                                    {activeSystems.map((system, index) => (
                                        <CarouselItem key={system.id} className="pl-4 md:pl-8 basis-full md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                whileInView={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                                viewport={{ once: true }}
                                                className="h-full py-4"
                                            >
                                                <PrebuiltSystemCard
                                                    system={system}
                                                    showReserveButton={false}
                                                    showLaunchButton={true}
                                                    isClickable={false}
                                                    isAdminPreview={isAdminPreview}
                                                    expanded={showAllParts}
                                                    onToggle={() => setShowAllParts(prev => !prev)}
                                                />
                                            </motion.div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                
                                {/* Premium Navigation Controls */}
                                <div className="flex items-center justify-center gap-6 mt-16">
                                    <CarouselPrevious className={cn(
                                        "static translate-y-0 h-14 w-14 rounded-2xl border-2 transition-all duration-300 hover:scale-110 active:scale-95",
                                        isDark ? "bg-white/5 border-white/10 text-white hover:bg-primary hover:border-primary hover:text-white" : "bg-white border-slate-200 text-slate-900 hover:bg-primary hover:border-primary hover:text-white"
                                    )} />
                                    <div className="h-1 w-24 bg-muted rounded-full overflow-hidden">
                                        <motion.div 
                                            className="h-full bg-primary"
                                            initial={{ width: "30%" }}
                                            animate={{ width: "60%" }}
                                            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                                        />
                                    </div>
                                    <CarouselNext className={cn(
                                        "static translate-y-0 h-14 w-14 rounded-2xl border-2 transition-all duration-300 hover:scale-110 active:scale-95",
                                        isDark ? "bg-white/5 border-white/10 text-white hover:bg-primary hover:border-primary hover:text-white" : "bg-white border-slate-200 text-slate-900 hover:bg-primary hover:border-primary hover:text-white"
                                    )} />
                                </div>
                            </Carousel>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                                    {displayedSystems.map((system, index) => (
                                        <motion.div
                                            key={system.id}
                                            initial={{ opacity: 0, y: 16 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.4, delay: (index % 4) * 0.08 }}
                                            viewport={{ once: true }}
                                            className="h-full flex flex-col py-2"
                                        >
                                            <PrebuiltSystemCard
                                                system={system}
                                                showReserveButton={false}
                                                showLaunchButton={true}
                                                isClickable={false}
                                                isAdminPreview={isAdminPreview}
                                                showBadges={false}
                                                expanded={showAllParts}
                                                onToggle={() => setShowAllParts(prev => !prev)}
                                            />
                                        </motion.div>
                                    ))}
                                </div>

                                {showViewAll && (
                                    <div className="mt-14 sm:mt-16 flex justify-center">
                                        <Button
                                            component={Link}
                                            href="/pre-builts"
                                            color="cyan"
                                            radius="md"
                                            size="lg"
                                            rightSection={<ArrowRight size={18} />}
                                            className="h-12 font-headline font-bold uppercase tracking-wide shadow-lg hover:scale-105 transition-transform"
                                        >
                                            View All Pre-builts
                                        </Button>
                                    </div>
                                )}
                            </>
                        )
                    ) : (
                        <div className={cn(
                            "text-center py-24 rounded-[40px] border border-dashed flex flex-col items-center justify-center",
                            isDark ? "bg-slate-900/40 border-white/10" : "bg-white/60 border-slate-200"
                        )}>
                            <p className="text-muted-foreground font-medium italic">Curated systems being architected. Check back soon.</p>
                        </div>
                    )}
                </div>
            </div>

        </section>
    );
}
