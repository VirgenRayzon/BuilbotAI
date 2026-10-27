"use client";

import React, { useState, useEffect, useRef } from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { ImageIcon, LoaderCircle } from "lucide-react";

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
    const previousSrcRef = useRef(src);

    // Reset only when an already-mounted image changes. Resetting after the
    // initial mount can turn the loader back on after a cached image has loaded.
    useEffect(() => {
        if (previousSrcRef.current === src) return;

        previousSrcRef.current = src;
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
            {/* One quiet rotating indicator keeps image loading feedback consistent. */}
            {isLoading && !error && (
                <div
                    className="absolute inset-0 z-20 flex items-center justify-center bg-slate-100/85 text-cyan-600 pointer-events-none dark:bg-slate-900/80 dark:text-cyan-400"
                    role="status"
                    aria-label="Loading image"
                >
                    {fallbackIcon || <LoaderCircle className="h-6 w-6 animate-spin" aria-hidden="true" />}
                </div>
            )}

            {/* Error Placeholder Overlay */}
            {error && (
                <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-muted/30">
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
