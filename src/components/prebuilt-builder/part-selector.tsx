"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Check, ChevronDown } from "lucide-react";
import type { Part } from "@/lib/types";

interface PartSelectorProps {
    category: string;
    items: Part[];
    value: string;
    onChange: (v: string) => void;
    isOpen: boolean;
    onOpenChange: (v: boolean) => void;
}

export function PartSelector({
    category,
    items,
    value,
    onChange,
    isOpen,
    onOpenChange,
}: PartSelectorProps) {
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

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
                ? sorted.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
                : sorted,
        [sorted, query]
    );

    const selectedPart = items.find((p) => p.id === value);

    return (
        <Popover open={isOpen} onOpenChange={onOpenChange} modal={true}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between bg-muted/40 border-border/60 h-9 px-3 text-sm font-normal"
                >
                    <span className="truncate">
                        {selectedPart ? selectedPart.name : `Select ${category}…`}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60 sticky top-0 bg-popover z-10">
                    <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <input
                        ref={inputRef}
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                        placeholder={`Search ${category}…`}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoComplete="off"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery("")}
                            className="text-muted-foreground hover:text-foreground text-xs"
                        >
                            ✕
                        </button>
                    )}
                </div>
                <ScrollArea className="h-60">
                    <div className="p-1">
                        {filtered.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-4">No parts found.</p>
                        ) : (
                            filtered.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                        onChange(item.id);
                                        onOpenChange(false);
                                        setQuery("");
                                    }}
                                    className={cn(
                                        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                                        value === item.id && "bg-accent text-accent-foreground"
                                    )}
                                >
                                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                        {value === item.id && <Check className="h-3.5 w-3.5" />}
                                    </span>
                                    <span className="truncate">{item.name}</span>
                                </button>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
