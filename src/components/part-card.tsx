"use client";

import React from "react";
import Image from "next/image";
import { Card, Text, Badge, Button, Group, Box, Stack } from "@mantine/core";
import { OptimizedImage } from "./ui/optimized-image";
import { formatCurrency, formatToPHP, getOptimizedStorageUrl, cn } from "@/lib/utils";
import type { Part } from "@/lib/types";
import { Plus, Check, AlertTriangle } from "lucide-react";
import { useSiteSettings } from "@/context/site-settings-context";
import { PartDetailsDialog } from "./part-details-dialog";

interface PartCardProps {
    part: Part;
    onToggleBuild: (part: Part) => void;
    isSelected: boolean;
    compatibility?: { compatible: boolean; message: string };
    effectiveStock?: number;
}

export function PartCard({
    part,
    onToggleBuild,
    isSelected,
    compatibility,
    effectiveStock,
}: PartCardProps) {
    const { shouldCorruptImages } = useSiteSettings();
    const currentStock = effectiveStock !== undefined ? effectiveStock : part.stock;
    const isOutOfStock = currentStock === 0 && !isSelected;
    const isIncompatible = compatibility && !compatibility.compatible && !isSelected;

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isOutOfStock) return;
        onToggleBuild(part);
    };

    return (
        <PartDetailsDialog
            part={part}
            isAdded={isSelected}
            onToggle={() => {
                if (isOutOfStock) return;
                onToggleBuild(part);
            }}
            isDisabled={isIncompatible}
        >
            <Card
                withBorder
                radius="lg"
                padding={0}
                className={cn(
                    "flex flex-col justify-between h-full relative group cursor-pointer overflow-hidden transition-all duration-300",
                    "bg-white/80 dark:bg-[#141a23]/90 hover:shadow-md hover:-translate-y-1",
                    "border-slate-200/80 dark:border-white/10 hover:border-cyan-500/40 dark:hover:border-cyan-500/40",
                    isOutOfStock && "opacity-60 grayscale",
                    isIncompatible && "border-red-500/40 dark:border-red-500/40"
                )}
            >
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
                        "bg-white border-y border-slate-200/70 dark:border-white/10"
                    )}
                >
                    <OptimizedImage
                        src={getOptimizedStorageUrl(part.imageUrl, shouldCorruptImages) || "/placeholder-part.png"}
                        alt={part.name}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                    />
                </Box>

                {/* --- Price & Inset Action Area --- */}
                <Stack gap="xs" className="px-3 pt-3 pb-3">
                    <Group justify="space-between" align="baseline">
                        <Stack gap={0}>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={600} className="tracking-wider text-[10px]">
                                Price
                            </Text>
                            <Text size="lg" fw={700} className="text-slate-900 dark:text-slate-100 font-mono leading-none">
                                {formatCurrency(part.price)}
                            </Text>
                        </Stack>
                        {part.usdSrp && (
                            <Text size="xs" c="dimmed" fw={500} className="text-[11px]">
                                Est. {formatToPHP(part.usdSrp)}
                            </Text>
                        )}
                    </Group>

                    {/* --- Inset Rounded Mantine Button --- */}
                    {(!compatibility || compatibility.compatible || isSelected) && (
                        <Button
                            onClick={handleToggle}
                            disabled={isOutOfStock}
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
                            {isSelected ? "Added to Build" : "Add to Build"}
                        </Button>
                    )}
                </Stack>
            </Card>
        </PartDetailsDialog>
    );
}
