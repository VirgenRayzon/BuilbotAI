"use client";

import React from "react";
import { Paper } from "@mantine/core";
import { getOptimizedStorageUrl } from "@/lib/utils";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface PrebuiltImageViewProps {
    imageUrl: string;
    systemName: string;
    tier?: string;
}

export function PrebuiltImageView({ imageUrl, systemName }: PrebuiltImageViewProps) {
    const optimizedUrl = getOptimizedStorageUrl(imageUrl) || "/placeholder-system.png";

    return (
        <Paper
            radius="2xl"
            p="md"
            withBorder
            className="w-full aspect-square relative overflow-hidden bg-slate-50 dark:bg-[#141a23] border-slate-200/80 dark:border-white/10 shadow-sm flex items-center justify-center select-none"
        >
            <div className="relative w-full h-full">
                <OptimizedImage
                    src={optimizedUrl}
                    alt={systemName}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 500px"
                    className="object-contain p-2 sm:p-4"
                />
            </div>
        </Paper>
    );
}
