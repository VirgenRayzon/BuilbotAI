"use client";

import { useState, useTransition, useMemo, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogClose,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "./ui/scroll-area";
import { Loader2, Sparkles, Cpu, BrainCircuit, Search, Check, ChevronDown, Plus, X, Bold, Italic, Heading1, Heading2, List, Code } from "lucide-react";
import { getAiPrebuiltSuggestions } from "@/app/actions";
import { ImageUpload } from "./image-upload";
import Image from "next/image";
import type { Part, PrebuiltSystem } from "@/lib/types";

const formSchema = z.object({
    name: z.string().min(1, "System name is required."),
    tier: z.string().min(1, "Please select a tier."),
    description: z.string().optional(),
    price: z.coerce.number().min(0, "Price must be a positive number."),
    imageUrl: z.string().optional().or(z.literal("")),
    cpu: z.string().optional(),
    gpu: z.string().optional(),
    motherboard: z.string().optional(),
    ram: z.array(z.string()).min(1, "At least one RAM module is required."),
    storage: z.array(z.string()).min(1, "At least one storage drive is required."),
    psu: z.string().optional(),
    case: z.string().optional(),
    cooler: z.string().optional(),
});

export type PrebuiltBuilderAddFormSchema = z.infer<typeof formSchema>;

interface PrebuiltBuilderAddDialogProps {
    children: React.ReactNode;
    onSave: (data: PrebuiltBuilderAddFormSchema) => void;
    parts: Part[];
    initialData?: PrebuiltSystem;
    title?: string;
}

/** Inline searchable part selector — sits inside a FormField */
function PartSelector({
    category,
    items,
    value,
    onChange,
    isOpen,
    onOpenChange,
}: {
    category: string;
    items: Part[];
    value: string;
    onChange: (v: string) => void;
    isOpen: boolean;
    onOpenChange: (v: boolean) => void;
}) {
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
        <Popover open={isOpen} onOpenChange={onOpenChange}>
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

const PART_SLOTS = [
    { key: "cpu", label: "CPU" },
    { key: "gpu", label: "GPU" },
    { key: "motherboard", label: "Motherboard" },
    { key: "ram", label: "RAM" },
    { key: "storage", label: "Storage" },
    { key: "psu", label: "PSU" },
    { key: "case", label: "Case" },
    { key: "cooler", label: "Cooler" },
] as const;

export function PrebuiltBuilderAddDialog({ children, onSave, parts, initialData, title }: PrebuiltBuilderAddDialogProps) {
    const [open, setOpen] = useState(false);
    const [isAiPending, startAiTransition] = useTransition();
    // Track which PartSelector dropdown is open
    const [openSlot, setOpenSlot] = useState<string | null>(null);
    const { toast } = useToast();

    // Group parts by category, sorted alphabetically within each category
    const inventory = useMemo(() => {
        const grouped: Record<string, Part[]> = {};
        for (const part of parts || []) {
            // Only include non-archived parts in the selection list
            if (part.isArchived) continue;
            
            if (!grouped[part.category]) grouped[part.category] = [];
            grouped[part.category].push(part);
        }
        // Sort each category alphabetically
        for (const cat of Object.keys(grouped)) {
            grouped[cat].sort((a, b) => a.name.localeCompare(b.name));
        }
        return grouped;
    }, [parts]);

    const form = useForm<PrebuiltBuilderAddFormSchema>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || "",
            tier: initialData?.tier || "",
            description: initialData?.description || "",
            price: initialData?.price || 0,
            imageUrl: initialData?.imageUrl || "",
            cpu: initialData?.components.cpu || "",
            gpu: initialData?.components.gpu || "",
            motherboard: initialData?.components.motherboard || "",
            ram: initialData?.components.ram || [],
            storage: initialData?.components.storage || [],
            psu: initialData?.components.psu || "",
            case: initialData?.components.case || "",
            cooler: initialData?.components.cooler || "",
        },
    });

    // Re-reset form if initialData changes or dialog opens
    useEffect(() => {
        if (open && initialData) {
            form.reset({
                name: initialData.name,
                tier: initialData.tier,
                description: initialData.description,
                price: Math.round((initialData.price || 0) * 100) / 100,
                imageUrl: initialData.imageUrl,
                cpu: initialData.components.cpu,
                gpu: initialData.components.gpu,
                motherboard: initialData.components.motherboard,
                ram: initialData.components.ram || [],
                storage: initialData.components.storage || [],
                psu: initialData.components.psu,
                case: initialData.components.case,
                cooler: initialData.components.cooler,
            });
        } else if (open && !initialData) {
            form.reset({
                name: "", tier: "", description: "", price: 0, imageUrl: "",
                cpu: "", gpu: "", motherboard: "", ram: [], storage: [], psu: "", case: "", cooler: "",
            });
        }
    }, [open, initialData, form]);

    const handleAiAssist = () => {
        // More robust part lookup with trimming and type safety
        const getPartName = (id?: string) => {
            if (!id || id.trim() === "") return undefined;
            const targetId = id.trim();
            const part = parts.find(p => p.id === targetId || p.id === id);
            return part?.name || undefined;
        };

        const selectedComponents = {
            cpu: getPartName(form.getValues("cpu")),
            gpu: getPartName(form.getValues("gpu")),
            motherboard: getPartName(form.getValues("motherboard")),
            ram: (form.getValues("ram") || []).map(id => getPartName(id)).filter((name): name is string => !!name),
            storage: (form.getValues("storage") || []).map(id => getPartName(id)).filter((name): name is string => !!name),
            psu: getPartName(form.getValues("psu")),
            case: getPartName(form.getValues("case")),
            cooler: getPartName(form.getValues("cooler")),
        };

        // Check if we actually found any component names to send to AI
        const hasComponents = Object.values(selectedComponents).some(c => 
            Array.isArray(c) ? c.length > 0 : !!c
        );

        if (!hasComponents) {
            toast({ 
                variant: "destructive", 
                title: "No Components Found", 
                description: "The AI needs at least one selected component name to generate an identity. Please ensure parts are selected from the dropdowns." 
            });
            return;
        }

        startAiTransition(async () => {
            try {
                const result = await getAiPrebuiltSuggestions({ 
                    components: {
                        ...selectedComponents,
                        ram: (selectedComponents.ram as string[]).join(", "),
                        storage: (selectedComponents.storage as string[]).join(", ")
                    }, 
                    tier: form.getValues("tier") || undefined 
                });

                if (result && "systemName" in result) {
                    const currentName = form.getValues("name");
                    const currentDesc = form.getValues("description");
                    const currentPrice = form.getValues("price");
                    const currentTier = form.getValues("tier");

                    let fieldsUpdated = [];

                    // Simplify logic entirely, mimicking AddPartDialog
                    if (result.systemName && !form.getValues("name")) {
                        form.setValue("name", result.systemName, { shouldValidate: true, shouldDirty: true });
                        fieldsUpdated.push("Name");
                    }
                    if (result.description && !form.getValues("description")) {
                        form.setValue("description", result.description, { shouldValidate: true, shouldDirty: true });
                        fieldsUpdated.push("Description");
                    }
                    if (result.price !== undefined && (!form.getValues("price") || form.getValues("price") === 0)) {
                        form.setValue("price", Math.round(result.price * 100) / 100, { shouldValidate: true, shouldDirty: true });
                        fieldsUpdated.push("Price");
                    }
                    if (!form.getValues("tier")) {
                        form.setValue("tier", result.tier || "Mid-Range", { shouldValidate: true, shouldDirty: true });
                        fieldsUpdated.push("Tier");
                    }

                    // Image is now handled via file upload, no auto-fill needed
                    if (fieldsUpdated.length > 0) {
                        toast({ title: "AI Suggestions Applied", description: `Successfully filled: ${fieldsUpdated.join(", ")}.` });
                    } else {
                        toast({ title: "Assist Complete", description: "Identity fields were already filled and were not overwritten." });
                    }
                } else {
                    toast({ 
                        variant: "destructive", 
                        title: "AI Response Error", 
                        description: (result as any)?.error || "The AI returned an empty response. Please try again." 
                    });
                }
            } catch (err: any) {
                toast({ 
                    variant: "destructive", 
                    title: "AI Assist Failed", 
                    description: err.message || "An unexpected error occurred while communicating with the AI." 
                });
            }
        });
    };

    const onSubmit = (values: PrebuiltBuilderAddFormSchema) => {
        onSave(values);
        toast({ title: initialData ? "Prebuilt Updated!" : "Prebuilt System Added!", description: `${values.name} has been ${initialData ? 'updated' : 'added'}.` });
        if (!initialData) form.reset();
        setOpen(false);

        // Refresh the UI to show the latest changes immediately
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen && isAiPending) return;
        setOpen(isOpen);
        if (!isOpen) { form.reset(); }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-5xl p-0 gap-0 overflow-hidden border-primary/20 bg-background/95 backdrop-blur-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] rounded-3xl [&>button.absolute]:hidden">

                {/* ── Header ── */}
                <DialogHeader className="px-8 pt-8 pb-6 border-b border-border/40 bg-muted/20 flex-row items-center gap-4 space-y-0">
                    <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-inner">
                        <Cpu className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                        <DialogTitle className="font-headline text-2xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                            {title || (initialData ? "Edit Prebuilt System" : "Add New Prebuilt System")}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground font-medium mt-1">
                            {initialData ? "Fine-tune system specifications and performance tiers." : "Design a curated pre-built rig with AI optimization assist."}
                        </DialogDescription>
                    </div>
                    <div className="ml-auto">
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={handleAiAssist}
                            disabled={isAiPending}
                            className="relative overflow-hidden group border-primary/30 hover:border-primary hover:bg-primary/10 text-primary gap-2 h-11 px-6 font-bold uppercase tracking-wider text-xs shadow-lg shadow-primary/5 transition-all duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 animate-shimmer pointer-events-none" />
                            {isAiPending ? (
                                <Loader2 className="animate-spin h-4 w-4" />
                            ) : (
                                <Sparkles className="h-4 w-4 transition-transform group-hover:scale-125 group-hover:rotate-12 duration-300" />
                            )}
                            AI Assist
                        </Button>
                    </div>
                </DialogHeader>

                {isAiPending && (
                    <div className="relative overflow-hidden bg-primary/5 border-b border-primary/10">
                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary/20">
                            <div className="h-full bg-primary animate-progress-glow w-[35%]" />
                        </div>
                        <div className="px-8 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                                    <BrainCircuit className="h-4 w-4 text-primary animate-pulse" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-primary uppercase tracking-widest">Buildbot Creator Active</span>
                                    <span className="text-[10px] text-primary/60 font-medium">Calculating optimal pricing strategy and generated product identity...</span>
                                </div>
                            </div>
                            <Badge variant="outline" className="animate-pulse bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-bold px-3 py-1">
                                Thinking
                            </Badge>
                        </div>
                    </div>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">

                        <ScrollArea className="h-[68vh]">
                            <div className="px-10 py-8 space-y-10">

                                {/* Section: System Identity */}
                                <div className="grid grid-cols-12 gap-8 items-start">
                                    
                                    {/* Left Column: Image Preview */}
                                    <div className="col-span-12 md:col-span-4 sticky top-0">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70 mb-4 flex items-center gap-3">
                                            <span className="inline-block w-4 h-px bg-primary/40" />
                                            Visual Identity
                                        </p>
                                        <div className="p-6 rounded-3xl border border-primary/10 bg-primary/5 shadow-inner">
                                            <FormField control={form.control} name="imageUrl" render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <ImageUpload 
                                                            value={field.value || ""} 
                                                            onChange={field.onChange} 
                                                            variant="large"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                    </div>

                                    {/* Right Column: Fields */}
                                    <div className="col-span-12 md:col-span-8 space-y-6">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70 mb-4 flex items-center gap-3">
                                            <span className="inline-block w-4 h-px bg-primary/40" />
                                            System Details
                                        </p>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Full width System Name */}
                                            <div className="col-span-2">
                                                <FormField control={form.control} name="name" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">System Name</FormLabel>
                                                        <FormControl>
                                                            <Input className="bg-muted/30 border-border/40 h-10 rounded-xl focus:bg-background transition-colors shadow-sm" placeholder="e.g., Ultimate Gamer V1" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                            </div>

                                            <FormField control={form.control} name="tier" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Performance Tier</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-muted/30 border-border/40 h-10 rounded-xl">
                                                                <SelectValue placeholder="Select tier…" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="rounded-xl">
                                                            <SelectItem value="Entry">Entry</SelectItem>
                                                            <SelectItem value="Mid-Range">Mid-Range</SelectItem>
                                                            <SelectItem value="High-End">High-End</SelectItem>
                                                            <SelectItem value="Workstation">Workstation</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />

                                            <FormField control={form.control} name="price" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Price (PHP ₱)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" className="bg-muted/30 border-border/40 h-10 rounded-xl font-mono" placeholder="e.g., 125000" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />

                                            {/* Description — Full Width */}
                                            <div className="col-span-2 space-y-3">
                                                <FormField control={form.control} name="description" render={({ field }) => (
                                                    <FormItem>
                                                        <div className="flex items-center justify-between mb-3">
                                                            <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70 flex items-center gap-2">
                                                                <Type className="h-3 w-3" /> System Overview
                                                            </FormLabel>
                                                            <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border/40 shadow-sm">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200"
                                                                    onClick={() => {
                                                                        const val = field.value || "";
                                                                        field.onChange(`**${val}**`);
                                                                    }}
                                                                    title="Bold"
                                                                >
                                                                    <Bold className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200"
                                                                    onClick={() => {
                                                                        const val = field.value || "";
                                                                        field.onChange(`*${val}*`);
                                                                    }}
                                                                    title="Italic"
                                                                >
                                                                    <Italic className="h-4 w-4" />
                                                                </Button>
                                                                <div className="w-px h-5 bg-border/60 mx-1" />
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200"
                                                                    onClick={() => {
                                                                        const val = field.value || "";
                                                                        field.onChange(`# ${val}`);
                                                                    }}
                                                                    title="Heading 1"
                                                                >
                                                                    <Heading1 className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200"
                                                                    onClick={() => {
                                                                        const val = field.value || "";
                                                                        field.onChange(`## ${val}`);
                                                                    }}
                                                                    title="Heading 2"
                                                                >
                                                                    <Heading2 className="h-4 w-4" />
                                                                </Button>
                                                                <div className="w-px h-5 bg-border/60 mx-1" />
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200"
                                                                    onClick={() => {
                                                                        const val = field.value || "";
                                                                        const lines = val.split('\n');
                                                                        const listVal = lines.map(line => line.startsWith('- ') ? line : `- ${line}`).join('\n');
                                                                        field.onChange(listVal);
                                                                    }}
                                                                    title="Bullet List"
                                                                >
                                                                    <List className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <FormControl>
                                                            <textarea 
                                                                className="flex min-h-[140px] w-full rounded-2xl border border-border/40 bg-muted/20 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground/50 focus:bg-background focus:border-primary/40 focus:ring-1 focus:ring-primary/20 focus-visible:outline-none transition-all duration-300 font-mono leading-relaxed"
                                                                placeholder="Craft a compelling system story...
- Top-tier compatibility
- Zero bottleneck guarantee
"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Components */}
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70 mb-3 flex items-center gap-2">
                                        <span className="inline-block w-5 h-px bg-primary/40" />
                                        <Cpu className="h-3 w-3 text-primary" />
                                        Component Selection
                                        <span className="text-muted-foreground/40 normal-case font-normal tracking-normal ml-1">(sorted A–Z · type to search)</span>
                                        <span className="inline-block flex-1 h-px bg-primary/10" />
                                    </p>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 rounded-xl border border-primary/10 bg-primary/5">
                                        {/* Row 1: CPU & GPU */}
                                        <div className="space-y-4">
                                            {/* CPU */}
                                            <FormField control={form.control} name="cpu" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">CPU</FormLabel>
                                                    <PartSelector
                                                        category="CPU"
                                                        items={inventory["CPU"] || []}
                                                        value={field.value || ""}
                                                        onChange={field.onChange}
                                                        isOpen={openSlot === "cpu"}
                                                        onOpenChange={(o) => setOpenSlot(o ? "cpu" : null)}
                                                    />
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            {/* Motherboard */}
                                            <FormField control={form.control} name="motherboard" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Motherboard</FormLabel>
                                                    <PartSelector
                                                        category="Motherboard"
                                                        items={inventory["Motherboard"] || []}
                                                        value={field.value || ""}
                                                        onChange={field.onChange}
                                                        isOpen={openSlot === "motherboard"}
                                                        onOpenChange={(o) => setOpenSlot(o ? "motherboard" : null)}
                                                    />
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                        <div className="space-y-4">
                                            {/* GPU */}
                                            <FormField control={form.control} name="gpu" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">GPU</FormLabel>
                                                    <PartSelector
                                                        category="GPU"
                                                        items={inventory["GPU"] || []}
                                                        value={field.value || ""}
                                                        onChange={field.onChange}
                                                        isOpen={openSlot === "gpu"}
                                                        onOpenChange={(o) => setOpenSlot(o ? "gpu" : null)}
                                                    />
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            {/* Cooler */}
                                            <FormField control={form.control} name="cooler" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Cooler</FormLabel>
                                                    <PartSelector
                                                        category="Cooler"
                                                        items={inventory["Cooler"] || []}
                                                        value={field.value || ""}
                                                        onChange={field.onChange}
                                                        isOpen={openSlot === "cooler"}
                                                        onOpenChange={(o) => setOpenSlot(o ? "cooler" : null)}
                                                    />
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        <div className="col-span-2 space-y-4 pt-2">
                                            {/* RAM (Multi) */}
                                            <FormItem>
                                                <div className="flex items-center justify-between mb-1">
                                                    <FormLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">RAM Modules</FormLabel>
                                                    <Button 
                                                        type="button" 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-6 text-[9px] uppercase tracking-wider text-primary hover:text-primary hover:bg-primary/10"
                                                        onClick={() => {
                                                            const current = form.getValues("ram");
                                                            form.setValue("ram", [...current, ""]);
                                                        }}
                                                    >
                                                        <Plus className="h-3 w-3 mr-1" /> Add Stick
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {form.watch("ram").map((_, index) => (
                                                        <FormField
                                                            key={`ram-${index}`}
                                                            control={form.control}
                                                            name={`ram.${index}` as any}
                                                            render={({ field }) => (
                                                                <div className="relative group">
                                                                    <PartSelector
                                                                        category={`RAM Stick ${index + 1}`}
                                                                        items={inventory["RAM"] || []}
                                                                        value={field.value || ""}
                                                                        onChange={field.onChange}
                                                                        isOpen={openSlot === `ram-${index}`}
                                                                        onOpenChange={(o) => setOpenSlot(o ? `ram-${index}` : null)}
                                                                    />
                                                                    {form.watch("ram").length > 1 && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const current = form.getValues("ram");
                                                                                const next = [...current];
                                                                                next.splice(index, 1);
                                                                                form.setValue("ram", next);
                                                                            }}
                                                                            className="absolute -right-2 -top-2 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-20 flex items-center justify-center"
                                                                        >
                                                                            <X className="h-2.5 w-2.5" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                            </FormItem>

                                            {/* Storage (Multi) */}
                                            <FormItem>
                                                <div className="flex items-center justify-between mb-1">
                                                    <FormLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Storage Drives</FormLabel>
                                                    <Button 
                                                        type="button" 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-6 text-[9px] uppercase tracking-wider text-primary hover:text-primary hover:bg-primary/10"
                                                        onClick={() => {
                                                            const current = form.getValues("storage");
                                                            form.setValue("storage", [...current, ""]);
                                                        }}
                                                    >
                                                        <Plus className="h-3 w-3 mr-1" /> Add Drive
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {form.watch("storage").map((_, index) => (
                                                        <FormField
                                                            key={`storage-${index}`}
                                                            control={form.control}
                                                            name={`storage.${index}` as any}
                                                            render={({ field }) => (
                                                                <div className="relative group">
                                                                    <PartSelector
                                                                        category={`Storage ${index + 1}`}
                                                                        items={inventory["Storage"] || []}
                                                                        value={field.value || ""}
                                                                        onChange={field.onChange}
                                                                        isOpen={openSlot === `storage-${index}`}
                                                                        onOpenChange={(o) => setOpenSlot(o ? `storage-${index}` : null)}
                                                                    />
                                                                    {form.watch("storage").length > 1 && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const current = form.getValues("storage");
                                                                                const next = [...current];
                                                                                next.splice(index, 1);
                                                                                form.setValue("storage", next);
                                                                            }}
                                                                            className="absolute -right-2 -top-2 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-20 flex items-center justify-center"
                                                                        >
                                                                            <X className="h-2.5 w-2.5" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                            </FormItem>
                                        </div>

                                        <div className="col-span-2 grid grid-cols-3 gap-4 pt-2 border-t border-primary/10 mt-2">
                                            {/* PSU */}
                                            <FormField control={form.control} name="psu" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">PSU</FormLabel>
                                                    <PartSelector
                                                        category="PSU"
                                                        items={inventory["PSU"] || []}
                                                        value={field.value || ""}
                                                        onChange={field.onChange}
                                                        isOpen={openSlot === "psu"}
                                                        onOpenChange={(o) => setOpenSlot(o ? "psu" : null)}
                                                    />
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            {/* Case */}
                                            <FormField control={form.control} name="case" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Case</FormLabel>
                                                    <PartSelector
                                                        category="Case"
                                                        items={inventory["Case"] || []}
                                                        value={field.value || ""}
                                                        onChange={field.onChange}
                                                        isOpen={openSlot === "case"}
                                                        onOpenChange={(o) => setOpenSlot(o ? "case" : null)}
                                                    />
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </ScrollArea>

                        {/* ── Sticky Footer ── */}
                        <DialogFooter className="flex items-center justify-between px-6 py-4 border-t border-border/60 bg-muted/20 sm:justify-between space-x-0">
                            <p className="text-xs text-muted-foreground">
                                {(() => {
                                    const vals = form.watch();
                                    const baseKeys = ['cpu', 'gpu', 'motherboard', 'psu', 'case', 'cooler'];
                                    const filledBase = baseKeys.filter(k => !!(vals as any)[k]).length;
                                    const filledRam = (vals.ram || []).filter(r => !!r).length;
                                    const filledStorage = (vals.storage || []).filter(s => !!s).length;
                                    return filledBase + filledRam + filledStorage;
                                })()} components selected
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        form.reset({
                                            name: "", tier: "", description: "", price: 0, imageUrl: "",
                                            cpu: "", gpu: "", motherboard: "", ram: [], storage: [], psu: "", case: "", cooler: "",
                                        });
                                        toast({ title: "Form Cleared", description: "All fields have been reset." });
                        <DialogFooter className="px-8 py-6 border-t border-border/40 bg-muted/20 flex-row justify-between items-center sm:justify-between">
                            <DialogClose asChild>
                                <Button type="button" variant="ghost" size="lg" className="rounded-xl px-6 font-bold uppercase tracking-wider text-xs hover:bg-destructive/10 hover:text-destructive">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                size="lg"
                                onClick={form.handleSubmit(onSubmit)}
                                className="rounded-xl px-10 font-bold uppercase tracking-[0.15em] text-xs h-12 shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all duration-200"
                            >
                                {initialData ? "Update Selection" : "Complete Build"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
