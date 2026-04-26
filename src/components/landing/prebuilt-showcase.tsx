'use client';

import React, { useMemo } from 'react';
import { useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, limit, query, where } from 'firebase/firestore';
import { PrebuiltSystem } from '@/lib/types';
import { PrebuiltSystemCard } from '@/components/prebuilt-system-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
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

export function PrebuiltShowcase() {
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

    const activeSystems = useMemo(() => {
        if (!systems) return [];
        return systems.filter(s => !s.isArchived);
    }, [systems]);

    return (
        <section className={cn(
            "py-32 relative overflow-hidden transition-colors duration-500",
            isDark ? "bg-slate-950/40" : "bg-slate-50"
        )}>
            <div className="max-w-[1800px] w-full mx-auto px-4 md:px-8 relative z-10">
                <SectionHeader
                    badge="Battle-Ready"
                    title="Featured Systems"
                    subtitle="Expertly architected PC builds, validated by Buildbot AI for zero-bottleneck performance."
                />

                <div className="relative mt-20 px-4 md:px-12">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} className={cn(
                                    "h-[500px] w-full rounded-[40px]",
                                    isDark ? "bg-white/5" : "bg-black/5"
                                )} />
                            ))}
                        </div>
                    ) : activeSystems.length > 0 ? (
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
                                            <PrebuiltSystemCard system={system} />
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
                        <div className={cn(
                            "text-center py-24 rounded-[40px] border border-dashed flex flex-col items-center justify-center",
                            isDark ? "bg-slate-900/40 border-white/10" : "bg-white/60 border-slate-200"
                        )}>
                            <p className="text-muted-foreground font-medium italic">Curated systems being architected. Check back soon.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Background Accents */}
            <div className={cn(
                "absolute top-1/2 left-0 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[180px] -z-10 opacity-10",
                isDark ? "bg-primary" : "bg-primary/30"
            )} />
            <div className={cn(
                "absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full blur-[180px] -z-10 opacity-10",
                isDark ? "bg-purple-600" : "bg-purple-600/30"
            )} />
        </section>
    );
}
