"use client";

import React from "react";
import Image from "next/image";
import { Card, Text, Badge, Button, Group, Box, Stack } from "@mantine/core";
import { OptimizedImage } from "./ui/optimized-image";
import { formatCurrency, formatToPHP, getOptimizedStorageUrl, cn } from "@/lib/utils";
import type { Part } from "@/lib/types";
import type { RecommendationRole } from "@/lib/live-build-recommendations";
import { Plus, Check, AlertTriangle, Sparkles } from "lucide-react";
import { useSiteSettings } from "@/context/site-settings-context";
import { PartDetailsDialog } from "./part-details-dialog";
import { CatalogQRButton } from "./catalog-qr-button";

interface PartCardProps {
    part: Part;
    priority?: boolean;
    imageSizes?: string;
    onToggleBuild: (part: Part) => void;
    isSelected: boolean;
    compatibility?: { compatible: boolean; message: string };
    effectiveStock?: number;
    recommendation?: {
        action: 'add' | 'replace';
        role: RecommendationRole;
        reason: string;
        applying: boolean;
        onApply: () => void;
    };
}

export function PartCard({
    part,
    priority = false,
    imageSizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    onToggleBuild,
    isSelected,
    compatibility,
    effectiveStock,
    recommendation,
}: PartCardProps) {
    const { shouldCorruptImages } = useSiteSettings();
    const currentStock = effectiveStock !== undefined ? effectiveStock : part.stock;
    const isOutOfStock = currentStock === 0 && !isSelected;
    const isIncompatible = compatibility && !compatibility.compatible && !isSelected;
    const isBestMatch = recommendation?.role === 'bestMatch';
    const recommendationLabel = isBestMatch ? 'Best match' : 'Best value';

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isOutOfStock) return;
        if (recommendation && !isSelected) {
            if (!recommendation.applying) recommendation.onApply();
            return;
        }
        onToggleBuild(part);
    };

    return (
        <div className="relative h-full min-w-0">
        {recommendation && !isSelected && (
            <div className="pointer-events-none absolute inset-x-0 bottom-full z-20 mb-2 flex justify-center px-1" role="note" aria-label={`${recommendationLabel}. ${recommendation.reason}`}>
                <div className={cn(
                    "relative rounded-lg border px-2.5 py-1.5 shadow-sm",
                    isBestMatch
                        ? "border-blue-400 bg-blue-50 dark:border-blue-400 dark:bg-[#102341]"
                        : "border-yellow-400 bg-amber-50 dark:border-yellow-400 dark:bg-[#3a310c]",
                )}>
                    <Group gap={5} wrap="nowrap">
                        <Sparkles size={13} className={cn("shrink-0", isBestMatch
                            ? "text-blue-700 dark:text-blue-300" : "text-amber-700 dark:text-yellow-300")} aria-hidden="true" />
                        <Text size="xs" fw={700} className={cn("text-center leading-tight", isBestMatch
                            ? "text-blue-950 dark:text-blue-100" : "text-amber-950 dark:text-yellow-100")}>
                            {recommendationLabel}
                        </Text>
                    </Group>
                    <span aria-hidden="true" className={cn(
                        "absolute -bottom-[6px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r",
                        isBestMatch
                            ? "border-blue-400 bg-blue-50 dark:border-blue-400 dark:bg-[#102341]"
                            : "border-yellow-400 bg-amber-50 dark:border-yellow-400 dark:bg-[#3a310c]",
                    )} />
                </div>
            </div>
        )}
        <Card
            withBorder
            radius="lg"
            padding={0}
            className={cn(
                "flex flex-col justify-between h-full relative group cursor-pointer overflow-hidden transition-all duration-300 shadow-lg",
                "bg-white/85 dark:bg-[#111722] hover:shadow-lg hover:-translate-y-1",
                "border-slate-200/80 dark:border-white/10 hover:border-cyan-500/40 dark:hover:border-cyan-500/40",
                isOutOfStock && "opacity-60 grayscale",
                isIncompatible && "border-red-500/40 dark:border-red-500/40",
                recommendation && !isSelected && (isBestMatch
                    ? "buildbot-recommendation-card--match !border-2"
                    : "buildbot-recommendation-card--value !border-2")
            )}
        >
            <PartDetailsDialog
                part={part}
                isAdded={isSelected}
                onToggle={() => {
                    if (isOutOfStock) return;
                    if (recommendation && !isSelected) {
                        if (!recommendation.applying) recommendation.onApply();
                        return;
                    }
                    onToggleBuild(part);
                }}
                isDisabled={Boolean(isIncompatible)}
            >
                <div className="flex h-full flex-col justify-between">
                {/* --- Incompatibility Overlay --- */}
                {compatibility && !compatibility.compatible && (
                    <div className="absolute inset-0 z-30 bg-background/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center rounded-[var(--mantine-radius-lg)] border border-red-500/30 animate-in fade-in duration-200">
                        <div className="p-3 rounded-full mb-3 bg-red-500/10 text-red-500 border border-red-500/20 shadow-sm">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <Text size="xs" fw={700} c="red" tt="uppercase" className="tracking-wider mb-1">
                            {compatibility.message.toLowerCase().includes("slot is full")
                                ? "Slots Full"
                                : "Incompatible"}
                        </Text>
                        <Text size="xs" c="dimmed" className="line-clamp-3 max-w-[200px]">
                            {compatibility.message}
                        </Text>
                    </div>
                )}

                {/* --- Top Metadata & Title --- */}
                <Stack gap={6} className="px-3 pt-3 pb-2">
                    <Group justify="space-between" align="center" wrap="nowrap">
                        <Badge
                            size="xs"
                            variant="light"
                            color="gray"
                            radius="sm"
                            className="font-medium tracking-wide uppercase"
                        >
                            {part.brand || "Component"}
                        </Badge>
                        {currentStock <= 5 && currentStock > 0 && (
                            <Badge size="xs" variant="light" color="orange" radius="sm">
                                Only {currentStock} left
                            </Badge>
                        )}
                        {currentStock === 0 && (
                            <Badge size="xs" variant="light" color="red" radius="sm">
                                Out of Stock
                            </Badge>
                        )}
                    </Group>

                    <Text
                        size="sm"
                        fw={600}
                        lineClamp={2}
                        className="leading-snug transition-colors group-hover:text-cyan-600 dark:group-hover:text-cyan-400 min-h-[2.5rem]"
                        title={part.name}
                    >
                        {part.name}
                    </Text>
                </Stack>

                {/* --- Clean Image Showcase Surface --- */}
                <Box
                    className={cn(
                        "aspect-[4/3] relative w-full overflow-hidden",
                        "bg-pure-white border-y border-slate-200/70 dark:border-white/10"
                    )}
                >
                    <OptimizedImage
                        src={getOptimizedStorageUrl(part.imageUrl, shouldCorruptImages) || "/placeholder-part.png"}
                        alt={part.name}
                        fill
                        priority={priority}
                        sizes={imageSizes}
                        className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                    />
                </Box>

                {/* --- Price & Inset Action Area --- */}
                <Stack gap="xs" className="px-3 pt-3 pb-3">
                    <Group
                        justify="space-between"
                        align="flex-end"
                        wrap="nowrap"
                        className={part.qrToken && part.sku ? "pr-9" : undefined}
                    >
                        <Stack gap={0}>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={600} className="tracking-wider text-[10px]">
                                Price
                            </Text>
                            <Text size="lg" fw={700} className="text-slate-900 dark:text-slate-100 font-mono leading-none">
                                {formatCurrency(part.price)}
                            </Text>
                        </Stack>
                        <Group gap={4} align="center" wrap="nowrap">
                            {part.usdSrp && (
                                <Text size="xs" c="dimmed" fw={500} className="text-[11px]">
                                    Est. {formatToPHP(part.usdSrp)}
                                </Text>
                            )}
                        </Group>
                    </Group>

                    {/* --- Inset Rounded Mantine Button --- */}
                    {(!compatibility || compatibility.compatible || isSelected) && (
                        <Button
                            onClick={handleToggle}
                            disabled={isOutOfStock}
                            loading={recommendation?.applying}
                            fullWidth
                            radius="md"
                            size="sm"
                            variant={isSelected ? "filled" : "light"}
                            color={isSelected ? "teal" : "cyan"}
                            leftSection={
                                isSelected ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <Plus className="h-4 w-4" />
                                )
                            }
                            className={cn(
                                "font-medium transition-all duration-200",
                                isSelected
                                    ? "shadow-sm shadow-teal-500/20"
                                    : "hover:bg-cyan-500 hover:text-white"
                            )}
                        >
                            {isSelected ? "Added to Build" : recommendation?.action === 'replace' ? 'Replace in Build' : "Add to Build"}
                        </Button>
                    )}
                </Stack>
                </div>
            </PartDetailsDialog>

            {part.qrToken && part.sku && (
                <div className="absolute bottom-[58px] right-3 z-40">
                    <CatalogQRButton
                        token={part.qrToken}
                        sku={part.sku}
                        productName={part.name}
                        size={28}
                    />
                </div>
            )}
        </Card>
        </div>
    );
}
