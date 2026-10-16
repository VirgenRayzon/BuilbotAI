"use client";

import React, { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";

interface OptimizedImageProps extends ImageProps {
    fallbackIcon?: React.ReactNode;
}

export function OptimizedImage({ 
    className, 
    src, 
    alt, 
    fallbackIcon,
    fill,
    priority,
    unoptimized,
    sizes,
    ...props 
}: OptimizedImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    // Reset the loading treatment when a card or gallery swaps to another image.
    useEffect(() => {
        setIsLoading(true);
        setError(false);
    }, [src]);

    // Fail-safe: if image hasn't loaded in 3 seconds, clear the loading state
    useEffect(() => {
        if (isLoading && src) {
            const timer = setTimeout(() => setIsLoading(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isLoading, src]);

    // If no src is provided, show error state immediately
    if (!src) {
        return (
            <div className={cn("relative overflow-hidden bg-muted/30 flex items-center justify-center", className)}>
                <div className="text-muted-foreground flex flex-col items-center gap-2">
                    <ImageIcon className="w-8 h-8 opacity-20" />
                    <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">No Image</span>
                </div>
            </div>
        );
    }

    return (
        <div className={cn(
            "relative overflow-hidden", 
            fill && "absolute inset-0",
            !fill && "w-full h-full",
            className
        )}>
            {/* Lightweight shimmer for every card image, including prioritized LCP images. */}
            {isLoading && !error && (
                <div className="absolute inset-0 z-20 flex items-center justify-center overflow-hidden bg-slate-100/85 pointer-events-none dark:bg-slate-900/80" aria-hidden="true">
                    <div className="absolute inset-0 animate-shimmer bg-[linear-gradient(105deg,transparent_25%,rgba(6,182,212,0.16)_45%,rgba(255,255,255,0.55)_50%,rgba(6,182,212,0.16)_55%,transparent_75%)] bg-[length:220%_100%] dark:bg-[linear-gradient(105deg,transparent_25%,rgba(34,211,238,0.08)_45%,rgba(255,255,255,0.12)_50%,rgba(34,211,238,0.08)_55%,transparent_75%)]" />
                    <div className="relative h-12 w-12 rounded-xl border border-slate-300/70 bg-white/50 p-3 text-slate-400 shadow-sm animate-pulse dark:border-white/10 dark:bg-white/5 dark:text-slate-500">
                        {fallbackIcon || <ImageIcon className="h-full w-full" />}
                    </div>
                </div>
            )}

            {/* Error Placeholder Overlay */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/30 z-30">
                    <div className="text-muted-foreground flex flex-col items-center gap-2">
                        <ImageIcon className="w-8 h-8 opacity-20" />
                        <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">Load Failed</span>
                    </div>
                </div>
            )}

            <Image
                src={src}
                alt={alt}
                fill={fill}
                priority={priority}
                fetchPriority={priority ? 'high' : undefined}
                unoptimized={unoptimized}
                sizes={sizes}
                className={cn(
                    "transition-opacity duration-300 ease-out",
                    "opacity-100",
                    className
                )}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                    setIsLoading(false);
                    setError(true);
                }}
                {...props}
            />
        </div>
    );
}
