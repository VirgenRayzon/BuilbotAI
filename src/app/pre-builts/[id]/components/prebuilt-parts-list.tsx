"use client";

import React from "react";
import { Badge, Loader, Paper, Text } from "@mantine/core";
import { Cpu, Package } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { PartDetailsDialog } from "@/components/part-details-dialog";
import { formatCurrency, getOptimizedStorageUrl } from "@/lib/utils";
import type { PrebuiltPartStatus } from "@/lib/prebuilt-utils";
import { useToast } from "@/hooks/use-toast";

interface PrebuiltPartsListProps {
    parts: PrebuiltPartStatus[];
    loading: boolean;
}

export function PrebuiltPartsList({ parts, loading }: PrebuiltPartsListProps) {
    const { toast } = useToast();
    const availableCount = parts.filter(p => Boolean(p.part)).length;

    return (
        <Paper
            radius="md"
            p={{ base: "md", sm: "lg" }}
            withBorder
            className="bg-white/90 dark:bg-[#141a23]/90 border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-md"
        >
            <div className="flex items-center justify-between mb-4 border-b border-slate-200/70 pb-3.5 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                        <Cpu className="w-4.5 h-4.5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <Text fw={800} size="md" className="text-slate-900 dark:text-slate-100 text-base sm:text-lg">
                                Installed Components
                            </Text>
                            <Badge size="sm" variant="light" color="cyan" radius="sm">
                                {loading ? "Loading..." : `${availableCount} Items`}
                            </Badge>
                        </div>
                    </div>
                </div>
                <Text size="xs" c="dimmed" className="hidden sm:inline text-xs sm:text-sm">
                    Click part to view specifications
                </Text>
            </div>

            {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <Loader size="md" color="cyan" />
                    <Text size="sm" c="dimmed" fw={500}>
                        Loading component inventory details...
                    </Text>
                </div>
            ) : parts.length === 0 ? (
                <div className="py-10 text-center text-slate-500">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <Text size="sm" fw={600}>No parts configured</Text>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {parts.map((item) => {
                        const { part, issue, categoryLabel, key } = item;
                        const unavailable = issue !== null;

                        if (!part) {
                            return (
                                <div
                                    key={key}
                                    className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01]"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Badge variant="filled" color="dark" size="sm" radius="xs" className="uppercase text-[10px] font-bold px-2 h-5">
                                            {categoryLabel}
                                        </Badge>
                                        <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                                            Component slot not configured
                                        </span>
                                    </div>
                                    <Badge color="yellow" variant="light" size="sm">
                                        Missing
                                    </Badge>
                                </div>
                            );
                        }

                        return (
                            <PartDetailsDialog
                                key={key}
                                part={part}
                                isAdded={true}
                                onToggle={() => {
                                    toast({
                                        title: "Included Hardware",
                                        description: `${part.name} is pre-configured. Use "Customize in Builder" to modify parts.`,
                                    });
                                }}
                            >
                                <div
                                    className={`flex items-center justify-between gap-4 p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer group select-none shadow-xs ${
                                        unavailable
                                            ? "border-amber-400/80 bg-amber-50/60 dark:border-amber-500/40 dark:bg-[#211e18]"
                                            : "border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.02] hover:bg-slate-50 dark:hover:bg-white/[0.05] hover:border-cyan-500/50 dark:hover:border-cyan-400/50"
                                    }`}
                                >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-white/10 p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
                                            <OptimizedImage
                                                src={getOptimizedStorageUrl(part.imageUrl) || "/placeholder-part.png"}
                                                alt={part.name}
                                                fill
                                                sizes="64px"
                                                className="object-contain p-0.5"
                                            />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge
                                                    variant="filled"
                                                    color="dark"
                                                    size="sm"
                                                    radius="xs"
                                                    className="uppercase text-[10px] font-bold px-2 py-0.5 h-5 tracking-wide"
                                                >
                                                    {categoryLabel}
                                                </Badge>
                                                {part.brand && (
                                                    <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium truncate">
                                                        {part.brand}
                                                    </span>
                                                )}
                                            </div>
                                            <Text
                                                className="text-sm sm:text-base font-semibold truncate text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors leading-snug"
                                            >
                                                {part.name}
                                            </Text>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end shrink-0 pl-3">
                                        <Text className="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-slate-100">
                                            {formatCurrency(part.price)}
                                        </Text>
                                        {unavailable ? (
                                            <Badge color="yellow" variant="light" size="sm" className="text-xs h-5 mt-0.5">
                                                {issue === "out-of-stock" ? "Out of Stock" : "Unavailable"}
                                            </Badge>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                <span>In Stock</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </PartDetailsDialog>
                        );
                    })}
                </div>
            )}
        </Paper>
    );
}
