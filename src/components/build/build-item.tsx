"use client";

import { Cpu, X as CloseIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ComponentData } from "@/lib/types";

interface BuildItemProps {
  name: string;
  label?: string;
  component: ComponentData | ComponentData[] | null;
  icon: React.ComponentType<{ className?: string }>;
  onRemove: (category: string, index?: number) => void;
  onSelect?: (category: string) => void;
  isAccessory?: boolean;
  isActiveFilter?: boolean;
}

export function BuildItem({
  name,
  label,
  component,
  icon: Icon,
  onRemove,
  onSelect,
  isAccessory = false,
  isActiveFilter = false,
}: BuildItemProps) {
  const components = Array.isArray(component) ? component : (component ? [component] : []);

  if (components.length === 0) {
    return (
      <div 
        className={cn(
          "flex items-center gap-4 py-1.5 opacity-40 grayscale group transition-all hover:opacity-100 hover:grayscale-0 rounded-lg px-2 -mx-2",
          onSelect ? "cursor-pointer" : "cursor-default",
          isActiveFilter && "opacity-100 grayscale-0 bg-primary/5 border border-primary/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]"
        )}
        onClick={() => onSelect?.(name)}
      >
        <div className={cn(
          "p-2 bg-secondary/80 rounded flex items-center justify-center transition-colors",
          isActiveFilter && "bg-primary/20 text-primary"
        )}>
          <Icon className={cn("w-4 h-4", isActiveFilter ? "text-primary" : "text-muted-foreground")} />
        </div>
        <div className="flex-1">
          <p className={cn(
            "text-xs font-bold uppercase tracking-wider leading-none mb-1",
            isActiveFilter ? "text-primary" : "text-muted-foreground"
          )}>{label || name}</p>
          <p className="text-[10px] text-muted-foreground/80 italic font-medium">Click to add</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {components.map((c, idx) => (
        <div 
          key={`${name}-${idx}`} 
          className={cn(
            "flex items-center gap-4 py-1.5 animate-in fade-in slide-in-from-left-3 duration-300 group rounded-lg px-2 -mx-2 transition-all",
            isActiveFilter && "bg-primary/5 border border-primary/10 shadow-[0_0_10px_rgba(34,211,238,0.05)]"
          )}
        >
          <div
            className={cn(
              "relative p-2 rounded flex items-center justify-center border shadow-sm cursor-pointer transition-all hover:bg-destructive/20 hover:border-destructive/30 hover:scale-105 active:scale-95 group/icon",
              isAccessory ? "bg-primary/10 border-primary/10" : "bg-primary/15 border-primary/20",
              isActiveFilter && "border-primary/40 bg-primary/20"
            )}
            onClick={() => onRemove(name, name === 'Storage' ? idx : undefined)}
            title={`Remove ${name}`}
          >
            <Icon className={cn("w-4 h-4 transition-colors group-hover/icon:text-destructive", isAccessory ? "text-primary/80" : "text-primary")} />
            <div className="absolute -top-1.5 -right-1.5 lg:hidden bg-destructive text-white rounded-full p-0.5 shadow-lg border border-background">
              <CloseIcon className="w-2.5 h-2.5" />
            </div>
          </div>
          <div 
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => onSelect?.(name)}
          >
            <p className={cn(
              "text-xs font-bold uppercase tracking-wider leading-none mb-1",
              isAccessory ? "text-primary/80" : "text-primary",
              isActiveFilter && "text-primary animate-pulse"
            )}>
              {label || ((name === 'Storage' || name === 'RAM') && components.length > 1 ? `${name} ${idx + 1}` : name)}
            </p>
            <p className="text-sm font-semibold truncate leading-tight tracking-tight">{(c as any).name || c.model}</p>
          </div>
          <div className="flex items-center gap-2">
            {typeof c.wattage === 'number' && (
              <span className="text-[10px] font-bold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded shadow-inner">
                {c.wattage}W
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive text-muted-foreground"
              onClick={() => onRemove(name, name === 'Storage' ? idx : undefined)}
            >
              <CloseIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
