"use client";

import React from "react";
import { Badge, Group, Paper, Text, Title, Button as MantineButton } from "@mantine/core";
import { formatCurrency } from "@/lib/utils";
import { SlidersHorizontal, ShieldCheck } from "lucide-react";
import type { PrebuiltSystem } from "@/lib/types";

interface PrebuiltHeaderCardProps {
    system: PrebuiltSystem;
    price: number;
    isComplete: boolean;
    isInStock: boolean;
    loadingParts: boolean;
    hasComponents: boolean;
    onCustomize: () => void;
}

export function PrebuiltHeaderCard({
    system,
    price,
    isComplete,
    isInStock,
    loadingParts,
    hasComponents,
    onCustomize,
}: PrebuiltHeaderCardProps) {
    return (
        <Paper
            radius="md"
            p={{ base: "md", sm: "lg" }}
            withBorder
            className="bg-white/90 dark:bg-[#141a23]/90 border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-md"
        >
            {/* Badges */}
            <Group gap="xs" mb="xs">
                <Badge
                    variant="filled"
                    color="cyan"
                    size="md"
                    radius="sm"
                    className="font-bold tracking-wider uppercase text-[10px]"
                >
                    {system.tier} Tier
                </Badge>
                {isComplete && (
                    <Badge
                        variant="light"
                        color="teal"
                        size="md"
                        radius="sm"
                        leftSection={<ShieldCheck className="w-3.5 h-3.5" />}
                        className="font-semibold text-[10px]"
                    >
                        Verified Build
                    </Badge>
                )}
                {isInStock && (
                    <Badge
                        variant="light"
                        color="emerald"
                        size="md"
                        radius="sm"
                        className="font-semibold text-[10px]"
                    >
                        In Stock
                    </Badge>
                )}
            </Group>

            {/* Prebuilt Name */}
            <Title
                order={1}
                className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 mb-3"
            >
                {system.name}
            </Title>

            {/* Description with proper spacing before the separator line */}
            {system.description && (
                <Text size="md" c="dimmed" className="leading-relaxed mb-6 pb-2">
                    {system.description}
                </Text>
            )}

            {/* Starting At + Price on left, Customize in Builder aligned to the right */}
            <div className="mt-6 pt-5 border-t border-slate-200/70 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Text size="xs" fw={800} c="dimmed" className="uppercase tracking-[0.16em] mb-1">
                        Starting At
                    </Text>
                    <Title
                        order={2}
                        className="font-mono font-black tracking-tight text-cyan-600 dark:text-cyan-400"
                        style={{ fontSize: "clamp(2rem, 2.5vw, 2.75rem)", lineHeight: 1 }}
                    >
                        {formatCurrency(price)}
                    </Title>
                </div>

                <MantineButton
                    variant="default"
                    size="md"
                    radius="md"
                    leftSection={<SlidersHorizontal className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />}
                    disabled={loadingParts || !hasComponents}
                    onClick={onCustomize}
                    className="h-11 px-5 text-xs font-semibold uppercase tracking-wider border-slate-200 transition-colors hover:border-cyan-500/50 dark:border-white/15 shrink-0"
                >
                    Customize in Builder
                </MantineButton>
            </div>
        </Paper>
    );
}
