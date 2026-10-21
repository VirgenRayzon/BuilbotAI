"use client";

import React from "react";
import { Badge, Paper } from "@mantine/core";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn, getOptimizedStorageUrl } from "@/lib/utils";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { SlidingImage } from "@/components/ui/sliding-image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface PrebuiltImageViewProps {
    imageUrl: string;
    images?: string[];
    systemName: string;
    tier?: string;
    itemLabel?: string;
    placeholderSrc?: string;
}

export function PrebuiltImageView({
    imageUrl,
    images = [],
    systemName,
    tier,
    itemLabel = "system",
    placeholderSrc = "/placeholder-system.png",
}: PrebuiltImageViewProps) {
    const allImages = React.useMemo(
        () => Array.from(new Set([imageUrl, ...images].filter((image): image is string => Boolean(image)))),
        [imageUrl, images]
    );
    const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
    const [slideDirection, setSlideDirection] = React.useState<-1 | 1>(1);
    const [previewOpen, setPreviewOpen] = React.useState(false);

    React.useEffect(() => {
        setCurrentImageIndex(0);
    }, [imageUrl]);

    // Fetch every gallery image as soon as the product page opens. The modal uses
    // the same URLs, so previous/next navigation can swap from the browser cache
    // instead of waiting for a full-size image request after the customer clicks.
    React.useEffect(() => {
        allImages.forEach((imageUrl) => {
            const image = new window.Image();
            image.src = getOptimizedStorageUrl(imageUrl) || imageUrl;
        });
    }, [allImages]);

    const currentImage = allImages[currentImageIndex] || imageUrl;
    const coverUrl = currentImage || placeholderSrc;

    const showPrevious = () => {
        setSlideDirection(-1);
        setCurrentImageIndex((current) => (current === 0 ? allImages.length - 1 : current - 1));
    };

    const showNext = () => {
        setSlideDirection(1);
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
            className="flex aspect-square w-full flex-col overflow-hidden border-slate-200/80 bg-transparent shadow-sm select-none dark:border-white/10 md:aspect-auto md:h-full"
        >
            <div
                className="relative min-h-0 flex-1 cursor-zoom-in bg-transparent"
                role="button"
                tabIndex={0}
                aria-label={`Open full image preview for ${systemName}`}
                onClick={() => setPreviewOpen(true)}
                onKeyDown={openPreviewFromKeyboard}
            >
                <SlidingImage
                    imageKey={`system-${currentImageIndex}`}
                    direction={slideDirection}
                    src={coverUrl}
                    alt={`${systemName} photo ${currentImageIndex + 1}`}
                    fill
                    priority={currentImageIndex === 0}
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
                            aria-label={`Previous ${itemLabel} photo`}
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
                            aria-label={`Next ${itemLabel} photo`}
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
                aria-label={`${systemName} photos`}
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
                                aria-label={`View ${itemLabel} photo ${index + 1}`}
                                onClick={() => {
                                    setSlideDirection(index >= currentImageIndex ? 1 : -1);
                                    setCurrentImageIndex(index);
                                }}
                                className={cn(
                                    "relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 dark:ring-offset-[#111722]",
                                    isCurrent
                                        ? "border-cyan-500 shadow-sm shadow-cyan-500/25"
                                        : "border-slate-200 opacity-75 hover:border-cyan-400 hover:opacity-100 dark:border-white/10"
                                )}
                            >
                                <OptimizedImage
                                    src={getOptimizedStorageUrl(image) || placeholderSrc}
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
                    hideClose={true}
                    className="w-[94vw] max-w-5xl h-[88vh] max-h-[88vh] bg-black/90 dark:bg-[#0c1017]/95 border border-white/15 dark:border-white/10 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex flex-col"
                >
                    <DialogTitle className="sr-only">{systemName} full image preview</DialogTitle>
                    <button
                        type="button"
                        onClick={() => setPreviewOpen(false)}
                        aria-label="Close preview"
                        className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/85 text-white ring-1 ring-white/25 transition-all hover:bg-slate-800 hover:ring-white/50 hover:scale-105 active:scale-95 shadow-lg"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    {allImages.length > 1 && (
                        <>
                            <button
                                type="button"
                                aria-label="Previous image"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    showPrevious();
                                }}
                                className="absolute left-4 top-1/2 z-50 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/85 text-white ring-1 ring-white/20 transition-all hover:bg-slate-800 hover:ring-white/40 hover:scale-105 active:scale-95 shadow-lg backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </button>

                            <button
                                type="button"
                                aria-label="Next image"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    showNext();
                                }}
                                className="absolute right-4 top-1/2 z-50 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/85 text-white ring-1 ring-white/20 transition-all hover:bg-slate-800 hover:ring-white/40 hover:scale-105 active:scale-95 shadow-lg backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                            >
                                <ChevronRight className="h-6 w-6" />
                            </button>

                            <Badge
                                variant="filled"
                                color="dark"
                                radius="xl"
                                size="md"
                                className="absolute bottom-4 left-1/2 z-50 -translate-x-1/2 bg-slate-950/85 font-mono text-white ring-1 ring-white/10 backdrop-blur-md px-3 py-1 shadow-md"
                            >
                                {currentImageIndex + 1} / {allImages.length}
                            </Badge>
                        </>
                    )}

                    <div className="relative flex-1 min-h-0 w-full overflow-hidden rounded-xl bg-transparent">
                        <SlidingImage
                            imageKey={`preview-${currentImageIndex}`}
                            direction={slideDirection}
                            src={coverUrl}
                            alt={`${systemName} full-size photo ${currentImageIndex + 1}`}
                            fill
                            priority={currentImageIndex === 0}
                            sizes="(max-width: 1024px) 94vw, 1200px"
                            className="object-contain"
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </Paper>
    );
}
