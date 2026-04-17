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

export function PrebuiltShowcase() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const firestore = useFirestore();
    const prebuiltSystemsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'prebuiltSystems'),
            limit(4)
        );
    }, [firestore]);

    const { data: systems, loading } = useCollection<PrebuiltSystem>(prebuiltSystemsQuery);

    return (
        <section className={cn(
            "py-32 relative overflow-hidden transition-colors duration-500",
            isDark ? "bg-slate-900/50" : "bg-slate-50"
        )}>
            <div className="max-w-[1800px] w-full mx-auto px-4 md:px-8 relative z-10">
                <SectionHeader
                    badge="Battle-Ready"
                    title="Featured Systems"
                    subtitle="Expertly architected PC builds, validated by Buildbot AI for zero-bottleneck performance."
                />

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className={cn(
                                "h-[450px] w-full rounded-3xl",
                                isDark ? "bg-white/5" : "bg-black/5"
                            )} />
                        ))}
                    </div>
                ) : systems && systems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
                        {systems.map((system, index) => (
                            <motion.div
                                key={system.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.7, delay: index * 0.1, ease: "easeOut" }}
                                viewport={{ once: true }}
                            >
                                <PrebuiltSystemCard system={system} />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className={cn(
                        "text-center py-24 rounded-[40px] border border-dashed flex flex-col items-center justify-center",
                        isDark ? "bg-slate-900/40 border-white/10" : "bg-white/60 border-slate-200"
                    )}>
                        <p className="text-muted-foreground font-medium italic">Curated systems being architected. Check back soon.</p>
                    </div>
                )}
            </div>

            {/* Background Accents */}
            <div className={cn(
                "absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[150px] -z-10 opacity-20",
                isDark ? "bg-primary" : "bg-primary/40"
            )} />
            <div className={cn(
                "absolute top-1/2 right-0 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[150px] -z-10 opacity-20",
                isDark ? "bg-purple-600" : "bg-purple-600/40"
            )} />
        </section>
    );
}
