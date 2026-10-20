"use client";

import React from "react";
import { Paper, Text, Title, Button as MantineButton } from "@mantine/core";
import { formatCurrency } from "@/lib/utils";
import { SlidersHorizontal, ShieldCheck, AlertCircle } from "lucide-react";
import type { PrebuiltPartStatus } from "@/lib/prebuilt-utils";

interface PrebuiltActionCardProps {
    children?: React.ReactNode;
    price: number;
    isComplete: boolean;
    unavailableParts: PrebuiltPartStatus[];
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
    unavailableParts,
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
            radius="md"
            p={{ base: "sm", sm: "md" }}
            withBorder
            className="bg-white/90 dark:bg-[#141a23]/90 border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-md"
        >
            {children && (
                <div className="mb-3 border-b border-slate-200/70 pb-3 dark:border-white/10">
                    {children}
                </div>
            )}

            <div className="flex flex-col justify-between gap-3">
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
                <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Customize Prebuilt Button (Available for all, including staff) */}
                    <MantineButton
                        variant="default"
                        size="lg"
                        radius="md"
                        leftSection={<SlidersHorizontal className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />}
                        disabled={loadingParts || !hasComponents}
                        onClick={onCustomize}
                        className="h-11 w-full min-w-0 px-4 text-xs font-semibold uppercase tracking-wider border-slate-200 transition-colors hover:border-cyan-500/50 dark:border-white/15"
                    >
                        Customize in Builder
                    </MantineButton>

                    {/* Reserve Button — STRICTLY HIDDEN for Managers and Super Admins */}
                    {!isManagerOrAdmin && (
                        <MantineButton
                            onClick={onReserve}
                            loading={isReserving}
                            disabled={!isComplete || loadingParts || !isInStock || isReserving}
                            color="teal"
                            size="md"
                            radius="md"
                            fullWidth
                            leftSection={<ShieldCheck className="h-[18px] w-[18px]" />}
                            className="h-11 text-xs font-bold uppercase tracking-wider shadow-md shadow-emerald-500/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                        >
                            {loadingParts
                                ? "Checking Stock..."
                                : !isInStock
                                    ? "Out of Stock"
                                    : "Reserve this Build"}
                        </MantineButton>
                    )}
                </div>
            </div>

            {!loadingParts && unavailableParts.length > 0 && (
                <div role="alert" className="mt-4 rounded-lg border border-amber-500/60 bg-amber-50 p-3 text-amber-950 dark:border-amber-400/60 dark:bg-[#211e18] dark:text-amber-100">
                    <div className="flex items-center gap-2 text-xs font-bold">
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>{unavailableParts.length} component{unavailableParts.length === 1 ? " needs" : "s need"} replacement</span>
                    </div>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                        {unavailableParts.map(item => (
                            <li key={item.key} className="rounded-md border border-amber-400/60 bg-white/70 px-2 py-1 text-xs font-semibold dark:border-amber-400/30 dark:bg-black/20">
                                {item.name}
                                <span className="ml-1 font-normal text-amber-800 dark:text-amber-300">
                                    ({item.issue === "out-of-stock" ? "out of stock" : "missing"})
                                </span>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-2 text-xs text-amber-800 dark:text-amber-300">Customize this build to choose replacements.</p>
                </div>
            )}
        </Paper>
    );
}
