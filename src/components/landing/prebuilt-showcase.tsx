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

export function PrebuiltShowcase() {
    const firestore = useFirestore();
    const prebuiltSystemsQuery = useMemo(() => {
        if (!firestore) return null;
        // Fetch 4 featured or high-end systems for the showcase
        return query(
            collection(firestore, 'prebuiltSystems'),
            limit(4)
        );
    }, [firestore]);

    const { data: systems, loading } = useCollection<PrebuiltSystem>(prebuiltSystemsQuery);

    return (
        <section className="py-24 bg-slate-950/50 relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <SectionHeader
                    badge="Ready to Ship"
                    title="Featured Systems"
                    subtitle="Expertly architected PC builds, validated by Buildbot AI for zero-bottleneck performance."
                />

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-[400px] w-full rounded-2xl bg-white/5" />
                        ))}
                    </div>
                ) : systems && systems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
                        {systems.map((system, index) => (
                            <motion.div
                                key={system.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                            >
                                <PrebuiltSystemCard system={system} />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 glass-panel rounded-3xl border-dashed">
                        <p className="text-slate-400">Curated systems coming soon.</p>
                    </div>
                )}
            </div>

            {/* Background Accents */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -z-10" />
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] -z-10" />
        </section>
    );
}
