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

interface ComponentCardProps {
  name: string;
  component: ComponentData;
  icon: React.ComponentType<{ className?: string }>;
}

export function ComponentCard({ name, component, icon: Icon }: ComponentCardProps) {

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
                src={getOptimizedStorageUrl(component.image) || "/placeholder-part.png"}
                alt={component.description}
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                data-ai-hint={component.imageHint}
            />
            {component.id.startsWith('ai-suggested-') && (
                <div className="absolute top-2 right-2 z-20">
                    <div className="bg-amber-500/90 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-lg backdrop-blur-sm border border-amber-400/50 flex items-center gap-1.5 animate-in fade-in zoom-in duration-300">
                        <Info className="w-3 h-3" />
                        NOT IN INVENTORY
                    </div>
                </div>
            )}
        </div>
        <p className="text-sm text-muted-foreground">{component.description}</p>
      </CardContent>
      <CardFooter>
        <div className="text-lg font-semibold text-foreground">
          {formatCurrency(component.price)}
        </div>
      </CardFooter>
    </Card>
  );
}
