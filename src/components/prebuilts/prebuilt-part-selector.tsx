"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Box,
  Check,
  ChevronDown,
  CircuitBoard,
  Cpu,
  Fan,
  HardDrive,
  Layers,
  MemoryStick,
  Monitor,
  MousePointer2,
  Search,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatCurrency } from "@/lib/utils";
import type { Part } from "@/lib/types";
import type { CompatibilityResult } from "@/lib/compatibility";

interface PartSelectorProps {
  category: string;
  items: Part[];
  value: string;
  onChange: (v: string) => void;
  isOpen: boolean;
  onOpenChange: (v: boolean) => void;
  getCompatibility?: (part: Part) => CompatibilityResult;
}

export function PrebuiltPartSelector({
  category,
  items,
  value,
  onChange,
  isOpen,
  onOpenChange,
  getCompatibility,
}: PartSelectorProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  );

  const filtered = useMemo(
    () =>
      query.trim()
        ? sorted.filter((p) =>
            p.name.toLowerCase().includes(query.toLowerCase())
          )
        : sorted,
    [sorted, query]
  );

  const selectedPart = items.find((p) => p.id === value);

  const Icon =
    category === "CPU"
      ? Cpu
      : category === "GPU"
        ? Monitor
        : category === "Motherboard"
          ? CircuitBoard
          : category === "RAM"
            ? MemoryStick
            : category === "Storage"
              ? HardDrive
              : category === "Case"
                ? Box
                : category === "Power Supply"
                  ? Zap
                  : category === "Cooler"
                    ? Fan
                    : category === "OS"
                      ? Layers
                      : MousePointer2;

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange} modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          type="button"
          aria-label={`Select ${category}`}
          ref={triggerRef}
          className="w-full justify-between bg-slate-50 dark:bg-[#141a23] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white h-10 px-3 text-sm font-normal rounded-xl hover:border-cyan-500/50 transition-colors shadow-sm hover:scale-100 active:scale-100"
        >
          <span className="truncate">
            {selectedPart ? selectedPart.name : `Select ${category}…`}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        portalled={false}
        collisionBoundary={
          triggerRef.current?.closest<HTMLElement>(
            "[data-radix-scroll-area-viewport]"
          ) ?? undefined
        }
        collisionPadding={12}
        className="z-[200] w-[var(--radix-popover-trigger-width)] p-0 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111722] text-slate-900 dark:text-white shadow-2xl rounded-2xl overflow-hidden data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-100 data-[state=open]:slide-in-from-top-0 duration-0"
        align="start"
        sideOffset={8}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.03] backdrop-blur-md sticky top-0 z-20">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white font-bold tracking-tight"
            placeholder={`Search ${category}…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 rounded-full hover:bg-muted/60 text-muted-foreground/40 hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="px-4 py-2 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between border-b border-slate-200 dark:border-white/10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {category} Inventory
          </span>
          <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
            {filtered.length} Results
          </span>
        </div>
        <ScrollArea className="h-[min(340px,calc(var(--radix-popover-content-available-height)-96px))]">
          <div className="p-1.5">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <Search className="h-8 w-8 text-slate-400/40 mb-2" />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  No components found
                </p>
                <p className="text-[10px] text-slate-400 mt-1 italic">
                  Try a different search term
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filtered.map((item) => {
                  const compatibility = getCompatibility?.(item);
                  const isIncompatible = compatibility && !compatibility.compatible;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={isIncompatible}
                      onClick={() => {
                        if (isIncompatible) return;
                        onChange(item.id);
                        onOpenChange(false);
                        setQuery("");
                      }}
                      className={cn(
                        "relative flex w-full cursor-default select-none items-center rounded-xl py-2.5 px-3 text-sm outline-none transition-all duration-200 border border-transparent",
                        !isIncompatible &&
                          "hover:bg-cyan-500/10 hover:border-cyan-500/20 group",
                        isIncompatible &&
                          "cursor-not-allowed border-rose-500/20 bg-rose-500/5 opacity-60",
                        value === item.id
                          ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300"
                          : "text-slate-800 dark:text-slate-200"
                      )}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div
                          className={cn(
                            "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300",
                            value === item.id
                              ? "bg-cyan-600 text-white shadow-sm"
                              : "bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 group-hover:bg-cyan-500/20 group-hover:text-cyan-600 dark:group-hover:text-cyan-400"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="flex flex-col items-start gap-0.5 text-left flex-1 min-w-0">
                          <span
                            className={cn(
                              "font-bold text-[12px] leading-tight tracking-tight truncate w-full transition-colors",
                              value === item.id
                                ? "text-cyan-700 dark:text-cyan-300"
                                : "text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400"
                            )}
                          >
                            {item.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400 dark:text-slate-500">
                              {item.brand}
                            </span>
                            <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/20" />
                            <span className="text-[11px] font-bold text-cyan-700 dark:text-cyan-400 font-mono">
                              {formatCurrency(item.price)}
                            </span>
                          </div>
                          {isIncompatible && (
                            <span className="mt-1 text-[10px] font-medium leading-snug text-rose-600 dark:text-rose-400">
                              {compatibility.message}
                            </span>
                          )}
                        </div>

                        {value === item.id && (
                          <div className="h-5 w-5 rounded-full bg-cyan-600 flex items-center justify-center text-white shadow-sm shrink-0">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

