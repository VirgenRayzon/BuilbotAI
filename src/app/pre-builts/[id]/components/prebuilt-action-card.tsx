"use client";

import React from "react";
import { Paper, Group, Stack, Text, Title, Button as MantineButton, Badge } from "@mantine/core";
import { formatCurrency } from "@/lib/utils";
import { SparkleButton } from "@/components/ui/sparkle-button";
import { SlidersHorizontal, Zap, AlertCircle, CheckCircle2 } from "lucide-react";

interface PrebuiltActionCardProps {
    children?: React.ReactNode;
    price: number;
    isComplete: boolean;
    missingPartsCount: number;
    isInStock: boolean;
    loadingParts: boolean;
    isReserving: boolean;
    isManagerOrAdmin: boolean;
    hasComponents: boolean;
    onReserve: () => void;
    onCustomize: () => void;
}

export function PrebuiltActionCard({
    children,
    price,
    isComplete,
    missingPartsCount,
    isInStock,
    loadingParts,
    isReserving,
    isManagerOrAdmin,
    hasComponents,
    onReserve,
    onCustomize,
}: PrebuiltActionCardProps) {
    return (
        <Paper
            radius="xl"
            p={{ base: "sm", sm: "md" }}
            withBorder
            className="bg-white/90 dark:bg-[#141a23]/90 border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-md"
        >
            {children && (
                <div className="mb-3 border-b border-slate-200/70 pb-3 dark:border-white/10">
                    {children}
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Price Display */}
                <div>
                    <Text size="sm" fw={800} c="dimmed" className="mb-1 uppercase tracking-[0.16em]">
                        Build Total
                    </Text>
                    <Title
                        order={2}
                        className="font-mono font-black tracking-tight text-cyan-600 dark:text-cyan-400"
                        style={{ fontSize: "clamp(2rem, 3vw, 3.25rem)", lineHeight: 1 }}
                    >
                        {formatCurrency(price)}
                    </Title>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Customize Prebuilt Button (Available for all, including staff) */}
                    <MantineButton
                        variant="default"
                        size="lg"
                        radius="md"
                        leftSection={<SlidersHorizontal className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />}
                        disabled={loadingParts || !hasComponents}
                        onClick={onCustomize}
                        className="h-12 px-5 text-xs font-semibold uppercase tracking-wider border-slate-200 transition-colors hover:border-cyan-500/50 dark:border-white/15"
                    >
                        Customize in Builder
                    </MantineButton>

                    {/* Reserve Button — STRICTLY HIDDEN for Managers and Super Admins */}
                    {!isManagerOrAdmin && (
                        <SparkleButton
                            onClick={onReserve}
                            isLoading={isReserving}
                            disabled={!isComplete || loadingParts || !isInStock || isReserving}
                            icon={<Zap className="w-4 h-4" />}
                            className="h-12 rounded-xl px-6 text-xs font-bold uppercase tracking-wider shadow-md"
                        >
                            {loadingParts
                                ? "Checking Stock..."
                                : !isInStock
                                    ? "Out of Stock"
                                    : "Reserve this Build"}
                        </SparkleButton>
                    )}
                </div>
            </div>

            {/* Error or Warning Banners */}
            {!isComplete && (
                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/10 flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Configuration incomplete: missing {missingPartsCount} required component{missingPartsCount > 1 ? "s" : ""}.</span>
                </div>
            )}

            {isComplete && !loadingParts && !isInStock && (
                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/10 flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>One or more components are currently out of stock. You can customize the build to swap components.</span>
                </div>
            )}
        </Paper>
    );
}
