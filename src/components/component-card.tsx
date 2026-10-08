/**
 * ComponentCard — Generic card for displaying a single PC component in the build summary.
 * Shows image, model name, description, price, and an "NOT IN INVENTORY" badge for AI-suggested parts.
 */
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ComponentData } from "@/lib/types";
import Image from "next/image";
import { Info } from "lucide-react";
import { formatCurrency, getOptimizedStorageUrl } from "@/lib/utils";
import { getComponentPlaceholderImage } from "@/lib/placeholder-images";

interface ComponentCardProps {
  name: string;
  component: ComponentData;
  icon: React.ComponentType<{ className?: string }>;
}

export function ComponentCard({ name, component, icon: Icon }: ComponentCardProps) {
  const fallback = getComponentPlaceholderImage(name, component.model);
  const rawImage = component.image;
  const isPicsum = !rawImage || rawImage.includes('picsum.photos');
  const initialSrc = isPicsum ? fallback : (getOptimizedStorageUrl(rawImage) || fallback);

  const [imgSrc, setImgSrc] = useState(initialSrc);

  useEffect(() => {
    const freshFallback = getComponentPlaceholderImage(name, component.model);
    const freshRaw = component.image;
    const freshIsPicsum = !freshRaw || freshRaw.includes('picsum.photos');
    setImgSrc(freshIsPicsum ? freshFallback : (getOptimizedStorageUrl(freshRaw) || freshFallback));
  }, [component.image, component.model, name]);

  return (
    <Card className="flex flex-col h-full overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 ease-in-out">
      <CardHeader className="flex-row items-center gap-3">
        <Icon className="w-8 h-8 text-primary" />
        <div>
          <CardTitle className="font-headline">{name}</CardTitle>
          <CardDescription>{component.model}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="aspect-square relative w-full overflow-hidden rounded-md group">
            <Image
                src={imgSrc}
                alt={component.description || component.model || name}
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                data-ai-hint={component.imageHint}
                onError={() => {
                  setImgSrc(fallback);
                }}
            />
            {component.id.startsWith('ai-suggested-') && (
                <div className="absolute top-2 right-2 z-20">
                    <div className="bg-amber-500/90 dark:bg-amber-600/90 text-white text-[10px] font-bold tracking-tight px-2 py-1 rounded-md shadow-md backdrop-blur-sm border border-amber-400/40 flex items-center gap-1.5 animate-in fade-in zoom-in duration-300">
                        <Info className="w-3 h-3 shrink-0" />
                        Market Part (External)
                    </div>
                </div>
            )}
        </div>
        <p className="text-sm text-muted-foreground">{component.description}</p>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2">
        <div className="text-lg font-semibold text-foreground">
          {formatCurrency(component.price)}
        </div>
        {component.id.startsWith('ai-suggested-') && (
          <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/20 dark:border-amber-500/30">
            Est. Market Price
          </span>
        )}
      </CardFooter>
    </Card>
  );
}
