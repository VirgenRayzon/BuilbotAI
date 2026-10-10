"use client";

import React from "react";
import { Accordion, Badge, Group, Paper, Text, Loader } from "@mantine/core";
import { Layers, AlertCircle } from "lucide-react";
import type { Part } from "@/lib/types";
import { formatCurrency, getOptimizedStorageUrl } from "@/lib/utils";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { PartDetailsDialog } from "@/components/part-details-dialog";
import { useToast } from "@/hooks/use-toast";

interface PrebuiltPartsAccordionProps {
    components: Record<string, Part | null>;
    loadingParts: boolean;
}

export function PrebuiltPartsAccordion({ components, loadingParts }: PrebuiltPartsAccordionProps) {
    const { toast } = useToast();
    const componentEntries = Object.entries(components);
    const populatedCount = componentEntries.filter(([, part]) => Boolean(part)).length;

    return (
        <Paper
            radius="xl"
            withBorder
            className="bg-white/80 dark:bg-[#141a23]/80 border-slate-200 dark:border-white/10 overflow-hidden shadow-sm"
        >
            <Accordion
                defaultValue={null} // Closed by default as requested
                variant="separated"
                styles={{
                    item: {
                        border: "none",
                        backgroundColor: "transparent",
                    },
                    control: {
                        padding: "1.25rem 1.5rem",
                        backgroundColor: "transparent",
                    },
                    content: {
                        padding: "0 1.5rem 1.5rem",
                    },
                }}
            >
                <Accordion.Item value="parts-list">
                    <Accordion.Control>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full pr-4">
                            <Group gap="sm">
                                <div>
                                    <Group gap="xs">
                                        <Text fw={700} size="md" className="tracking-tight text-slate-900 dark:text-slate-100">
                                            Installed Components
                                        </Text>
                                        <Badge variant="light" color="cyan" size="sm" radius="sm">
                                            {loadingParts ? "Loading..." : `${populatedCount} Items`}
                                        </Badge>
                                    </Group>
                                    <Text size="xs" c="dimmed">
                                        Click to view full hardware breakdown and specifications
                                    </Text>
                                </div>
                            </Group>

                        </div>
                    </Accordion.Control>

                    <Accordion.Panel>
                        {loadingParts ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-3">
                                <Loader size="sm" color="cyan" />
                                <Text size="xs" c="dimmed" fw={500}>
                                    Loading component inventory details...
                                </Text>
                            </div>
                        ) : (
                            <div className="grid gap-3 pt-2">
                                {componentEntries.map(([category, part]) => {
                                    if (!part) {
                                        return (
                                            <Paper
                                                key={category}
                                                p="md"
                                                radius="lg"
                                                withBorder
                                                className="bg-slate-50/50 dark:bg-white/[0.02] border-dashed border-slate-200 dark:border-white/10 flex items-center justify-between"
                                            >
                                                <Group gap="sm">
                                                    <Badge variant="light" color="gray" size="sm" className="uppercase w-24">
                                                        {category}
                                                    </Badge>
                                                    <div className="flex items-center gap-2 text-rose-500 text-xs font-medium">
                                                        <AlertCircle className="w-4 h-4" />
                                                        <span>Component not selected</span>
                                                    </div>
                                                </Group>
                                            </Paper>
                                        );
                                    }

                                    return (
                                        <PartDetailsDialog
                                            key={category}
                                            part={part}
                                            isAdded={true}
                                            onToggle={() => {
                                                toast({
                                                    title: "Included Hardware",
                                                    description: `${part.name} is pre-configured. Use "Customize in Builder" to modify parts.`,
                                                });
                                            }}
                                        >
                                            <Paper
                                                p="md"
                                                radius="lg"
                                                withBorder
                                                className="bg-white dark:bg-[#1a2230] border-slate-200/80 dark:border-white/10 hover:border-cyan-500/50 dark:hover:border-cyan-400/50 hover:shadow-sm transition-all cursor-pointer group select-none"
                                            >
                                                <div className="flex flex-col gap-3">
                                                    {/* Keep the category label above the component information. */}
                                                    <div>
                                                        <Badge
                                                            variant="light"
                                                            color="cyan"
                                                            size="sm"
                                                            className="uppercase text-center justify-center"
                                                        >
                                                            {category}
                                                        </Badge>
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div className="flex items-center gap-4 min-w-0">
                                                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
                                                                <OptimizedImage
                                                                    src={getOptimizedStorageUrl(part.imageUrl) || "/placeholder-part.png"}
                                                                    alt={part.name}
                                                                    fill
                                                                    sizes="80px"
                                                                    className="object-contain p-1"
                                                                />
                                                            </div>

                                                            <div className="min-w-0 flex-1">
                                                                <Text
                                                                    size="md"
                                                                    fw={700}
                                                                    className="line-clamp-2 text-base sm:text-lg group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors"
                                                                >
                                                                    {part.name}
                                                                </Text>
                                                                <Text size="sm" c="dimmed">
                                                                    {part.brand}
                                                                </Text>
                                                            </div>
                                                        </div>

                                                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 sm:pl-4">
                                                            <Text fw={700} size="md" className="font-mono text-base sm:text-lg">
                                                                {formatCurrency(part.price)}
                                                            </Text>
                                                            {part.stock > 0 ? (
                                                                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                    <span>In Stock</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1 text-rose-500 text-xs font-medium">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                                    <span>Out of Stock</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Paper>
                                        </PartDetailsDialog>
                                    );
                                })}
                            </div>
                        )}
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>
        </Paper>
    );
}
