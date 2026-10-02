import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Check } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

interface ChatRecommendationsCarouselProps {
    partsList: any[];
    isDark: boolean;
    addedPartIds: Record<string, boolean>;
    onAddPart: (partName: string, partId: string) => void;
}

export function ChatRecommendationsCarousel({
    partsList,
    isDark,
    addedPartIds,
    onAddPart
}: ChatRecommendationsCarouselProps) {
    if (!partsList || !Array.isArray(partsList) || partsList.length === 0) {
        return null;
    }

    const recommendations = partsList.slice(0, 4);

    return (
        <div className="mt-3 mb-1 relative w-[94%] mx-auto min-w-0 px-1">
            <Carousel className="w-full">
                <CarouselContent className="-ml-2">
                    {recommendations.map((partItem: any, idx) => {
                        const partName = partItem.name || partItem.model || 'Hardware Component';
                        const partId = partItem.id || `rec-${idx}`;
                        const partPrice = partItem.price || 0;
                        const category = partItem.category || '';
                        const isAdded = !!addedPartIds[partId];

                        const formattedPrice = typeof partPrice === 'number'
                            ? partPrice.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                            : partPrice;

                        let partImageUrl = partItem.imageUrl || undefined;
                        if (partImageUrl && partImageUrl.includes('firebasestorage.googleapis.com') && partImageUrl.includes('/o/') && partImageUrl.includes('?')) {
                            const urlParts = partImageUrl.split('/o/');
                            const afterO = urlParts[1].split('?');
                            const path = afterO[0];
                            const query = afterO[1];
                            if (path.includes('/')) {
                                const encodedPath = path.split('/').join('%2F');
                                partImageUrl = `${urlParts[0]}/o/${encodedPath}?${query}`;
                            }
                        }

                        const placeholderImage = PlaceHolderImages.find(p => p.id.toLowerCase() === category.toLowerCase())?.imageUrl || PlaceHolderImages.find(p => p.id === 'case')?.imageUrl;
                        const finalImage = partImageUrl && partImageUrl.startsWith('http') ? partImageUrl : placeholderImage;

                        return (
                            <CarouselItem key={partId || idx} className="pl-2 basis-[80%] sm:basis-[200px] shrink-0 h-full">
                                <div className={cn(
                                    "rounded-xl overflow-hidden shadow-lg group/card transition-all duration-300 flex flex-col h-[260px] border relative",
                                    isDark
                                        ? "bg-gradient-to-b from-white/[0.06] to-white/[0.02] border-white/10 hover:border-cyan-500/50 hover:shadow-[0_0_24px_rgba(6,182,212,0.2)]"
                                        : "bg-gradient-to-b from-card to-muted/30 border-border/60 hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                                )}>
                                    {/* Shimmer sweep */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent -translate-x-full group-hover/card:animate-shinesweep pointer-events-none z-10" />

                                    {/* Image Box */}
                                    <div className={cn(
                                        "relative w-full h-[145px] overflow-hidden flex items-center justify-center shrink-0",
                                        isDark ? "bg-white/[0.03]" : "bg-muted/20"
                                    )}>
                                        <img
                                            src={finalImage}
                                            alt={partName}
                                            className={cn(
                                                "max-w-full max-h-full object-contain p-2 transition-transform duration-500 group-hover/card:scale-110",
                                                isDark ? "opacity-95" : "opacity-90 mix-blend-multiply"
                                            )}
                                        />
                                        <div className={cn(
                                            "absolute inset-x-0 bottom-0 h-8 pointer-events-none",
                                            isDark ? "bg-gradient-to-t from-black/50 to-transparent" : "bg-gradient-to-t from-white/60 to-transparent"
                                        )} />
                                        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded-md border border-white/10 text-[8px] font-black text-cyan-400 uppercase tracking-widest">
                                            {category}
                                        </div>
                                    </div>

                                    {/* Content Info */}
                                    <div className="px-2.5 pt-2 pb-2.5 flex flex-col gap-1.5 flex-1 justify-between min-h-0">
                                        <div className="flex flex-col gap-0.5 min-h-0">
                                            <h4 className={cn(
                                                "text-[11px] font-bold leading-tight line-clamp-2 min-h-[28px] transition-colors",
                                                isDark ? "text-zinc-200 group-hover/card:text-white" : "text-zinc-800 group-hover/card:text-foreground"
                                            )} title={partName}>
                                                {partName}
                                            </h4>

                                            {partPrice > 0 && (
                                                <div className="text-[13px] font-black text-cyan-400 tabular-nums tracking-tight">
                                                    ₱{formattedPrice}
                                                </div>
                                            )}
                                        </div>

                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            disabled={isAdded}
                                            className={cn(
                                                "h-7 w-full border-none rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all duration-200 justify-center",
                                                isAdded
                                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-none cursor-default"
                                                    : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-md shadow-cyan-500/15 hover:scale-[1.02] active:scale-95"
                                            )}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                onAddPart(partName, partId);
                                            }}
                                        >
                                            {isAdded ? (
                                                <>
                                                    <Check className="w-3 h-3 text-emerald-400 animate-in zoom-in-50" /> Added ✓
                                                </>
                                            ) : (
                                                <>
                                                    <PlusCircle className="w-3 h-3" /> Add to Build
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </CarouselItem>
                        );
                    })}
                </CarouselContent>

                {recommendations.length > 1 && (
                    <>
                        <CarouselPrevious className="absolute -left-3 top-1/2 -translate-y-1/2 h-7 w-7 bg-black/70 border-white/10 hover:bg-cyan-500/20 hover:text-cyan-400 hover:border-cyan-500/40 backdrop-blur-xl shadow-xl z-20 flex items-center justify-center rounded-full" />
                        <CarouselNext className="absolute -right-3 top-1/2 -translate-y-1/2 h-7 w-7 bg-black/70 border-white/10 hover:bg-cyan-500/20 hover:text-cyan-400 hover:border-cyan-500/40 backdrop-blur-xl shadow-xl z-20 flex items-center justify-center rounded-full" />
                    </>
                )}
            </Carousel>
        </div>
    );
}
