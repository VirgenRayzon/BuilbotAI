"use client";

import Link from "next/link";
import { Badge, Button, Loader, Paper, Text } from "@mantine/core";
import { AlertCircle, ExternalLink, Package } from "lucide-react";
import {
    Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious,
} from "@/components/ui/carousel";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { formatCurrency, getOptimizedStorageUrl } from "@/lib/utils";
import type { PrebuiltPartStatus } from "@/lib/prebuilt-utils";

interface PrebuiltComponentCarouselProps {
    parts: PrebuiltPartStatus[];
    loading: boolean;
}

function PrebuiltComponentCard({ item }: { item: PrebuiltPartStatus }) {
    const { part, issue } = item;
    const unavailable = issue !== null;

    return (
        <Paper
            radius="md"
            p={0}
            withBorder
            className={`flex h-full min-h-[220px] flex-1 flex-col overflow-hidden border shadow-xs transition-colors select-none group ${unavailable
                ? "border-amber-500 bg-amber-50 dark:border-amber-400 dark:!bg-[#211e18]"
                : "border-slate-200/90 bg-white dark:border-white/10 dark:bg-[#141a23] hover:border-cyan-500/50 dark:hover:border-cyan-400/50"
                } ${part ? "cursor-pointer hover:shadow-md" : ""}`}
        >
            <div className="p-3 pb-2">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <Badge variant="filled" color="dark" size="xs" radius="sm" className="uppercase font-bold text-[10px] tracking-wider">
                        {part?.brand || item.categoryLabel}
                    </Badge>
                    {unavailable && (
                        <Badge color="yellow" variant="filled" size="xs" radius="sm" leftSection={<AlertCircle size={10} />}>
                            {issue === "out-of-stock" ? "Out of stock" : "Missing part"}
                        </Badge>
                    )}
                </div>
                <Text size="xs" fw={700} className="mt-2 line-clamp-2 leading-snug text-slate-900 dark:text-slate-100">
                    {item.name}
                </Text>
            </div>

            <div className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden border-y border-slate-100 bg-white dark:border-white/10">
                {part ? (
                    <OptimizedImage
                        src={getOptimizedStorageUrl(part.imageUrl) || "/placeholder-part.png"}
                        alt={part.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 300px"
                        className="object-contain p-2"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-amber-700 dark:text-amber-600">
                        <Package className="h-8 w-8" strokeWidth={1.5} />
                        <span className="text-xs font-semibold">Component unavailable</span>
                    </div>
                )}
            </div>

            <div className="mt-auto p-3 pt-2">
                <Text size="10px" fw={800} className="uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    {part ? "Price" : "Status"}
                </Text>
                <Text size="md" fw={800} className={`mt-1 font-mono leading-none ${unavailable
                    ? "text-amber-800 dark:text-amber-300"
                    : "text-slate-900 dark:text-slate-100"}`}>
                    {part ? formatCurrency(part.price) : "Replacement needed"}
                </Text>
                {part?.productId && (
                    <Button
                        component={Link}
                        href={`/parts/${part.productId}`}
                        variant="light"
                        color="cyan"
                        size="xs"
                        fullWidth
                        mt="sm"
                        rightSection={<ExternalLink className="h-3.5 w-3.5" />}
                        className="h-9 font-semibold"
                    >
                        View part
                    </Button>
                )}
            </div>
        </Paper>
    );
}

export function PrebuiltComponentCarousel({ parts, loading }: PrebuiltComponentCarouselProps) {
    if (loading) {
        return (
            <Paper radius="xl" p="xl" withBorder className="flex flex-col items-center justify-center gap-3 border-slate-200 bg-white/80 py-16 text-center dark:border-white/10 dark:bg-[#141a23]/80">
                <Loader size="md" color="cyan" />
                <Text size="sm" fw={700}>Loading installed parts</Text>
                <Text size="xs" c="dimmed">Fetching component availability...</Text>
            </Paper>
        );
    }

    if (parts.length === 0) {
        return (
            <Paper radius="xl" p="xl" withBorder className="border-slate-200 bg-white/80 py-12 text-center dark:border-white/10 dark:bg-[#141a23]/80">
                <Package className="mx-auto mb-3 h-8 w-8 text-slate-400" />
                <Text size="sm" fw={700}>No installed components</Text>
                <Text size="xs" c="dimmed">Component specifications have not been configured for this prebuilt yet.</Text>
            </Paper>
        );
    }

    return (
        <div className="relative px-0 sm:px-6">
            <Carousel opts={{ align: "start", loop: parts.length > 2 }} className="w-full">
                <CarouselContent className="-ml-2 items-stretch">
                    {parts.map(item => (
                        <CarouselItem key={item.key} className="flex h-auto basis-full pl-2 md:basis-1/2">
                            <PrebuiltComponentCard item={item} />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex -left-4 h-8 w-8 rounded-full border-slate-200 bg-white dark:border-white/10 dark:bg-[#1a2230]" />
                <CarouselNext className="hidden sm:flex -right-4 h-8 w-8 rounded-full border-slate-200 bg-white dark:border-white/10 dark:bg-[#1a2230]" />
            </Carousel>
        </div>
    );
}
