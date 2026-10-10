import { useCallback, useEffect, useState } from "react";
import { ActionIcon, Badge, Button, Group, Paper, Text } from "@mantine/core";
import { Check, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { getComponentPlaceholderImage } from "@/lib/placeholder-images";
import type { StructuredPart } from "@/lib/inventory-fetcher";
import type { ComponentData } from "@/lib/types";
import { filterChatRecommendations } from "@/lib/chat-recommendations";
import { getChatRecommendationFacts } from "@/lib/chat-recommendation-facts";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";

interface ChatRecommendationsCarouselProps {
    partsList: StructuredPart[];
    isDark: boolean;
    addedPartIds: Record<string, boolean>;
    hasBuildParts: boolean;
    build: Record<string, ComponentData | ComponentData[] | null> | null;
    onAddPart: (partName: string, partId: string) => void;
}

function partImage(part: StructuredPart) {
    let url = part.imageUrl;
    if (url?.includes('firebasestorage.googleapis.com') && url.includes('/o/') && url.includes('?')) {
        const [prefix, remainder] = url.split('/o/');
        const [path, query] = remainder.split('?');
        if (path.includes('/')) url = prefix + '/o/' + path.split('/').join('%2F') + '?' + query;
    }
    return url?.startsWith('http') && !url.includes('picsum.photos')
        ? url
        : getComponentPlaceholderImage(part.category, part.name);
}

export function ChatRecommendationsCarousel({ partsList, isDark, addedPartIds, hasBuildParts, build, onAddPart }: ChatRecommendationsCarouselProps) {
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);

    const updateNavigation = useCallback(() => {
        if (!carouselApi) return;
        setSelectedIndex(carouselApi.selectedScrollSnap());
        setCanScrollPrev(carouselApi.canScrollPrev());
        setCanScrollNext(carouselApi.canScrollNext());
    }, [carouselApi]);

    useEffect(() => {
        if (!carouselApi) return;
        updateNavigation();
        carouselApi.on("select", updateNavigation);
        carouselApi.on("reInit", updateNavigation);
        return () => {
            carouselApi.off("select", updateNavigation);
            carouselApi.off("reInit", updateNavigation);
        };
    }, [carouselApi, updateNavigation]);

    if (!Array.isArray(partsList) || partsList.length === 0) return null;
    const currentMatches = filterChatRecommendations(partsList, partsList[0].category, build);
    const currentMatchIds = new Set(currentMatches.map(part => part.id));
    const addedParts = partsList.filter(part => addedPartIds[part.id] && !currentMatchIds.has(part.id));
    const recommendations = [...currentMatches, ...addedParts].slice(0, 4);
    if (recommendations.length === 0) {
        return <Text size="xs" c="dimmed" className="px-5 py-3">These options no longer match Your Build. Ask for updated recommendations.</Text>;
    }

    return (
        <section className="mt-2 mb-1 w-full min-w-0 px-4" aria-label="Available recommendations">
            <Group justify="space-between" align="center" wrap="nowrap" gap="xs" mb="xs">
                <div className="min-w-0">
                    <Text size="sm" fw={700} className={isDark ? "text-slate-100" : "text-slate-900"}>Available options</Text>
                    <Text size="xs" c="dimmed">{hasBuildParts ? "Compatible with Your Build" : "In stock"}</Text>
                </div>
                {recommendations.length > 1 && (
                    <Group gap={4} wrap="nowrap" className="shrink-0">
                        <Text size="xs" c="dimmed" aria-live="polite" className="mr-1 tabular-nums">
                            {Math.min(selectedIndex + 1, recommendations.length)} / {recommendations.length}
                        </Text>
                        <ActionIcon
                            variant="default"
                            size="sm"
                            radius="md"
                            onClick={() => carouselApi?.scrollPrev()}
                            disabled={!canScrollPrev}
                            aria-label="Previous recommendation"
                        >
                            <ChevronLeft size={15} />
                        </ActionIcon>
                        <ActionIcon
                            variant="default"
                            size="sm"
                            radius="md"
                            onClick={() => carouselApi?.scrollNext()}
                            disabled={!canScrollNext}
                            aria-label="Next recommendation"
                        >
                            <ChevronRight size={15} />
                        </ActionIcon>
                    </Group>
                )}
            </Group>
            <Carousel className="w-full" setApi={setCarouselApi} opts={{ align: "start" }}>
                <CarouselContent className="ml-0">
                    {recommendations.map(part => {
                        const isAdded = !!addedPartIds[part.id];
                        const facts = getChatRecommendationFacts(part);
                        return (
                            <CarouselItem key={part.id} className="pl-0 basis-full">
                                <Paper
                                    withBorder
                                    radius="md"
                                    p="sm"
                                    className={isDark ? "bg-[#192230] border-white/10" : "bg-white border-slate-200"}
                                >
                                    <Group align="stretch" wrap="nowrap" gap="sm">
                                        <div className="flex h-[80px] w-[80px] shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white p-2 sm:h-[96px] sm:w-[96px]">
                                            <img src={partImage(part)} alt={part.name} className="h-full w-full object-contain" />
                                        </div>
                                        <div className="flex min-w-0 flex-1 flex-col items-start">
                                            <Badge size="xs" variant="light" color="cyan" tt="uppercase">{part.category}</Badge>
                                            <Text size="sm" fw={650} lh={1.3} className="mt-2 break-words">
                                                {part.name}
                                            </Text>
                                            {facts.length > 0 && (
                                                <Text size="xs" c="dimmed" lh={1.35} className="mt-auto pt-2">
                                                    {facts.join(' · ')}
                                                </Text>
                                            )}
                                            {part.stock !== undefined && part.stock <= 5 && (
                                                <Text size="xs" c="orange" className="pt-1">Only {part.stock} left</Text>
                                            )}
                                        </div>
                                    </Group>
                                    <Group justify="space-between" align="center" wrap="nowrap" gap="xs" mt="sm" pt="sm"
                                        className={isDark ? "border-t border-white/10" : "border-t border-slate-200"}>
                                        <Text size="sm" fw={700} className="whitespace-nowrap tabular-nums">
                                            ₱{part.price.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </Text>
                                        <Button
                                            size="compact-sm"
                                            color="cyan"
                                            variant={isAdded ? "light" : "filled"}
                                            disabled={isAdded}
                                            leftSection={isAdded ? <Check size={14} /> : <Plus size={14} />}
                                            onClick={() => onAddPart(part.name, part.id)}
                                            className="shrink-0"
                                        >
                                            {isAdded ? "Added" : "Add to Build"}
                                        </Button>
                                    </Group>
                                </Paper>
                            </CarouselItem>
                        );
                    })}
                </CarouselContent>
            </Carousel>
        </section>
    );
}
