"use client";

import React from "react";
import { Badge, Paper } from "@mantine/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn, getOptimizedStorageUrl } from "@/lib/utils";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface PrebuiltImageViewProps {
    imageUrl: string;
    images?: string[];
    systemName: string;
    tier?: string;
}

export function PrebuiltImageView({ imageUrl, images = [], systemName, tier }: PrebuiltImageViewProps) {
    const allImages = React.useMemo(
        () => Array.from(new Set([imageUrl, ...images].filter((image): image is string => Boolean(image)))),
        [imageUrl, images]
    );
    const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
    const [previewOpen, setPreviewOpen] = React.useState(false);

    React.useEffect(() => {
        setCurrentImageIndex(0);
    }, [imageUrl]);

    const currentImage = allImages[currentImageIndex] || imageUrl;
    const coverUrl = currentImage || "/placeholder-system.png";

    const showPrevious = () => {
        setCurrentImageIndex((current) => (current === 0 ? allImages.length - 1 : current - 1));
    };

    const showNext = () => {
        setCurrentImageIndex((current) => (current === allImages.length - 1 ? 0 : current + 1));
    };

    const openPreviewFromKeyboard = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setPreviewOpen(true);
        }
    };

    return (
        <Paper
            radius="md"
            p={0}
            withBorder
            style={{ display: "flex" }}
            className="flex aspect-square w-full flex-col overflow-hidden border-slate-200/80 bg-white/85 shadow-sm select-none dark:border-white/10 dark:bg-[#111722]"
        >
            <div
                className="relative min-h-0 flex-1 cursor-zoom-in bg-white"
                role="button"
                tabIndex={0}
                aria-label={`Open full image preview for ${systemName}`}
                onClick={() => setPreviewOpen(true)}
                onKeyDown={openPreviewFromKeyboard}
            >
                <OptimizedImage
                    src={coverUrl}
                    alt={`${systemName} photo ${currentImageIndex + 1}`}
                    fill
                    priority
                    unoptimized
                    sizes="(max-width: 768px) calc(100vw - 32px), 50vw"
                    className="object-contain p-3 sm:p-5"
                />

                {tier && (
                    <Badge
                        variant="filled"
                        color="cyan"
                        radius="sm"
                        size="sm"
                        className="absolute left-3 top-3 z-10 font-bold uppercase tracking-wider"
                    >
                        {tier}
                    </Badge>
                )}

                {allImages.length > 1 && (
                    <>
                        <button
                            type="button"
                            aria-label="Previous system photo"
                            onClick={(event) => {
                                event.stopPropagation();
                                showPrevious();
                            }}
                            className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/70 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-slate-950/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            aria-label="Next system photo"
                            onClick={(event) => {
                                event.stopPropagation();
                                showNext();
                            }}
                            className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/70 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-slate-950/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                        <Badge
                            variant="filled"
                            color="dark"
                            radius="xl"
                            size="sm"
                            className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 bg-slate-950/75 font-mono text-white backdrop-blur-sm"
                        >
                            {currentImageIndex + 1} / {allImages.length}
                        </Badge>
                    </>
                )}
            </div>

            <div
                className="shrink-0 border-t border-slate-200/80 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-[#111722]"
                aria-label="System photos"
                role="tablist"
            >
                <div className="mx-auto flex w-max min-w-full justify-center gap-2 overflow-x-auto pb-0.5 [scrollbar-color:rgb(6_182_212)_transparent] [scrollbar-width:thin]">
                    {allImages.map((image, index) => {
                        const isCurrent = index === currentImageIndex;

                        return (
                            <button
                                key={`${image}-${index}`}
                                type="button"
                                role="tab"
                                aria-selected={isCurrent}
                                aria-label={`View system photo ${index + 1}`}
                                onClick={() => setCurrentImageIndex(index)}
                                className={cn(
                                    "relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 dark:ring-offset-[#111722]",
                                    isCurrent
                                        ? "border-cyan-500 shadow-sm shadow-cyan-500/25"
                                        : "border-slate-200 opacity-75 hover:border-cyan-400 hover:opacity-100 dark:border-white/10"
                                )}
                            >
                                <OptimizedImage
                                    src={getOptimizedStorageUrl(image) || "/placeholder-system.png"}
                                    alt={`${systemName} thumbnail ${index + 1}`}
                                    fill
                                    sizes="64px"
                                    className="object-contain p-1"
                                />
                            </button>
                        );
                    })}
                </div>
            </div>

            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent
                    hideClose={false}
                    className="h-[calc(100vh-24px)] max-w-[calc(100vw-24px)] bg-black/95 p-3"
                >
                    <DialogTitle className="sr-only">{systemName} full image preview</DialogTitle>
                    <div className="relative min-h-0 w-full overflow-hidden rounded-md bg-white">
                        <OptimizedImage
                            src={coverUrl}
                            alt={`${systemName} full-size photo ${currentImageIndex + 1}`}
                            fill
                            priority
                            unoptimized
                            sizes="100vw"
                            className="object-contain"
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </Paper>
    );
}
