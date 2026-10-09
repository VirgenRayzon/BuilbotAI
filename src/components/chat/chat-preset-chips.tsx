import React from "react";
import { motion } from "framer-motion";
import { Monitor, Cpu, HardDrive, Zap, CheckCircle2, Gauge, Scale, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    type CarouselApi,
} from "@/components/ui/carousel";

interface ChatPresetChipsProps {
    hasBuildParts: boolean;
    isDark: boolean;
    onPresetClick: (text: string) => void;
}

export function ChatPresetChips({ hasBuildParts, isDark, onPresetClick }: ChatPresetChipsProps) {
    const [api, setApi] = React.useState<CarouselApi>();
    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);

    const buildPresets = [
        { text: "Check my current build for compatibility", icon: <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> },
        { text: "Calculate CPU/GPU bottleneck for my build", icon: <Gauge className="w-3.5 h-3.5 text-amber-400 shrink-0" /> },
        { text: "Is my power supply wattage sufficient?", icon: <Zap className="w-3.5 h-3.5 text-yellow-400 shrink-0" /> },
        { text: "What component should I upgrade next?", icon: <Scale className="w-3.5 h-3.5 text-blue-400 shrink-0" /> },
    ];

    const generalPresets = [
        { text: "Recommend me a GPU", icon: <Monitor className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> },
        { text: "Best CPU for gaming?", icon: <Cpu className="w-3.5 h-3.5 text-blue-400 shrink-0" /> },
        { text: "SSD vs HDD for my build", icon: <HardDrive className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> },
        { text: "Check part compatibility rules", icon: <Zap className="w-3.5 h-3.5 text-yellow-400 shrink-0" /> },
    ];

    const presets = hasBuildParts ? buildPresets : generalPresets;

    React.useEffect(() => {
        if (!api) return;
        const onSelect = () => {
            setCanScrollPrev(api.canScrollPrev());
            setCanScrollNext(api.canScrollNext());
        };
        onSelect();
        api.on("select", onSelect);
        api.on("reInit", onSelect);
        return () => {
            api.off("select", onSelect);
        };
    }, [api]);

    return (
        <div className="w-full relative py-0.5 group/carousel">
            <Carousel
                setApi={setApi}
                opts={{
                    align: "start",
                    dragFree: true,
                    containScroll: "trimSnaps",
                }}
                className="w-full"
            >
                <CarouselContent className="-ml-1.5 flex items-center">
                    {presets.map((preset, idx) => (
                        <CarouselItem key={preset.text} className="pl-1.5 basis-auto">
                            <motion.button
                                type="button"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.04, duration: 0.2 }}
                                onClick={() => onPresetClick(preset.text)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer whitespace-nowrap select-none",
                                    isDark
                                        ? "bg-white/[0.06] border-white/10 text-zinc-200 hover:bg-cyan-500/15 hover:border-cyan-500/40 hover:text-cyan-200 shadow-sm"
                                        : "bg-white border-slate-200 text-slate-700 hover:bg-cyan-50 hover:border-cyan-400/50 hover:text-cyan-800 shadow-sm"
                                )}
                            >
                                {preset.icon}
                                <span>{preset.text}</span>
                            </motion.button>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>

            {/* Left Scroll Button */}
            {canScrollPrev && (
                <button
                    type="button"
                    onClick={() => api?.scrollPrev()}
                    className={cn(
                        "absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center shadow-md z-10 border transition-all",
                        isDark
                            ? "bg-slate-900/90 border-white/20 text-white hover:bg-slate-800"
                            : "bg-white/95 border-slate-300 text-slate-800 hover:bg-slate-50"
                    )}
                    aria-label="Previous suggestions"
                >
                    <ChevronLeft className="w-3.5 h-3.5" />
                </button>
            )}

            {/* Right Scroll Button */}
            {canScrollNext && (
                <button
                    type="button"
                    onClick={() => api?.scrollNext()}
                    className={cn(
                        "absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center shadow-md z-10 border transition-all",
                        isDark
                            ? "bg-slate-900/90 border-white/20 text-white hover:bg-slate-800"
                            : "bg-white/95 border-slate-300 text-slate-800 hover:bg-slate-50"
                    )}
                    aria-label="Next suggestions"
                >
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}
