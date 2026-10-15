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
    const [isLoading, setIsLoading] = useState(!priority);
    const [error, setError] = useState(false);

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
            {/* Loading Placeholder Overlay (only displayed when non-priority and loading) */}
            {isLoading && !priority && !error && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className="w-full h-full flex items-center justify-center bg-white/[0.02] backdrop-blur-[2px] animate-pulse">
                        <div className="w-1/4 h-1/4 opacity-10">
                            {fallbackIcon || <ImageIcon className="w-full h-full" />}
                        </div>
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
                unoptimized={unoptimized}
                sizes={sizes}
                className={cn(
                    "transition-opacity duration-300 ease-out",
                    priority ? "opacity-100" : (isLoading ? "opacity-80" : "opacity-100"),
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
