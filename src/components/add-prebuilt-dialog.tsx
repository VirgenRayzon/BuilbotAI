"use client";

import { useState, useTransition, useMemo, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn, formatCurrency } from "@/lib/utils";
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
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "./image-upload";
import { 
    Loader2, 
    Sparkles, 
    Cpu, 
    BrainCircuit, 
    Search, 
    Check, 
    ChevronDown, 
    Plus, 
    X, 
    Bold, 
    Italic, 
    Heading1, 
    Heading2, 
    List, 
    Code,
    CircuitBoard,
    MemoryStick,
    HardDrive,
    Box,
    Zap,
    Fan,
    Thermometer,
    Layers,
    Monitor,
    MousePointer2
} from "lucide-react";
import { getAiPrebuiltSuggestions } from "@/app/actions";
import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { SparkleButton } from "./ui/sparkle-button";
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
    ram: z.array(z.string().optional().or(z.literal(""))).refine(items => items.filter(Boolean).length > 0, {
        message: "At least one RAM module is required."
    }),
    storage: z.array(z.string().optional().or(z.literal(""))).refine(items => items.filter(Boolean).length > 0, {
        message: "At least one storage drive is required."
    }),
    psu: z.string().optional(),
    case: z.string().optional(),
    cooler: z.string().optional(),
});

export type AddPrebuiltFormSchema = z.infer<typeof formSchema>;

interface AddPrebuiltDialogProps {
    children: React.ReactNode;
    onSave: (data: AddPrebuiltFormSchema) => void;
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
        <Popover open={isOpen} onOpenChange={onOpenChange} modal={true}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between bg-muted/40 border-border/60 h-9 px-3 text-sm font-normal hover:scale-100 active:scale-100 transition-none"
                >
                    <span className="truncate">
                        {selectedPart ? selectedPart.name : `Select ${category}…`}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent 
                className="w-[var(--radix-popover-trigger-width)] p-0 border-border/40 shadow-2xl rounded-2xl overflow-hidden data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-100 data-[state=open]:slide-in-from-top-0 duration-0" 
                align="start"
                sideOffset={8}
            >
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-muted/20 backdrop-blur-md sticky top-0 z-20">
                    <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                        <Search className="h-4 w-4 text-primary" />
                    </div>
                    <input
                        ref={inputRef}
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40 font-bold tracking-tight"
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
                <div className="px-4 py-2 bg-muted/5 flex items-center justify-between border-b border-border/20">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{category} Inventory</span>
                    <span className="text-[10px] font-bold text-primary/60">{filtered.length} Results</span>
                </div>
                <ScrollArea className="h-[340px]">
                    <div className="p-1">
                        {filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                                <Search className="h-8 w-8 text-muted-foreground/20 mb-2" />
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40">No components found</p>
                                <p className="text-[10px] text-muted-foreground/40 mt-1 italic">Try a different search term</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filtered.map((item) => {
                                    const Icon = category === "CPU" ? Cpu : 
                                                 category === "GPU" ? Monitor : 
                                                 category === "Motherboard" ? CircuitBoard : 
                                                 category === "RAM" ? MemoryStick : 
                                                 category === "Storage" ? HardDrive : 
                                                 category === "Case" ? Box : 
                                                 category === "Power Supply" ? Zap : 
                                                 category === "Cooler" ? Fan : 
                                                 category === "OS" ? Layers : MousePointer2;
                                    
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => {
                                                onChange(item.id);
                                                onOpenChange(false);
                                                setQuery("");
                                            }}
                                            className={cn(
                                                "relative flex w-full cursor-default select-none items-center rounded-xl py-3 px-3 text-sm outline-none transition-all duration-200 border border-transparent",
                                                "hover:bg-primary/10 hover:border-primary/20 group",
                                                value === item.id ? "bg-primary/5 border-primary/20 ring-1 ring-primary/10" : ""
                                            )}
                                        >
                                            <div className="flex items-center gap-4 w-full">
                                                <div className={cn(
                                                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300",
                                                    value === item.id 
                                                        ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.3)]" 
                                                        : "bg-muted/30 text-muted-foreground/60 group-hover:bg-primary/20 group-hover:text-primary"
                                                )}>
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                
                                                <div className="flex flex-col items-start gap-0.5 text-left flex-1 min-w-0">
                                                    <span className={cn(
                                                        "font-bold text-[13px] leading-tight tracking-tight truncate w-full transition-colors",
                                                        value === item.id ? "text-primary" : "text-foreground group-hover:text-primary"
                                                    )}>
                                                        {item.name}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground/40">{item.brand}</span>
                                                        <div className="h-1 w-1 rounded-full bg-muted-foreground/20" />
                                                        <span className="text-[11px] font-bold text-primary/80 font-mono">
                                                            {formatCurrency(item.price)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {value === item.id && (
                                                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                                                        <Check className="h-3.5 w-3.5 text-primary-foreground" />
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

export function AddPrebuiltDialog({ children, onSave, parts, initialData, title }: AddPrebuiltDialogProps) {
    const [open, setOpen] = useState(false);
    const [isAiPending, setIsAiPending] = useState(false);
    const aiAbortRef = useRef(false);
    // Track which PartSelector dropdown is open
    const [openSlot, setOpenSlot] = useState<string | null>(null);
    const { toast } = useToast();

    const firestore = useFirestore();
    const settingsDocRef = useMemo(() => {
        if (firestore) return doc(firestore, 'siteSettings', 'main');
        return null;
    }, [firestore]);
    const { data: settings } = useDoc<any>(settingsDocRef);
    const isAiKillSwitch = settings?.isAiKillSwitch || false;

    // Group parts by category, sorted alphabetically within each category
    const inventory = useMemo(() => {
        const grouped: Record<string, Part[]> = {};
        for (const part of parts || []) {
            if (!grouped[part.category]) grouped[part.category] = [];
            grouped[part.category].push(part);
        }
        // Sort each category alphabetically
        for (const cat of Object.keys(grouped)) {
            grouped[cat].sort((a, b) => a.name.localeCompare(b.name));
        }
        return grouped;
    }, [parts]);

    const form = useForm<AddPrebuiltFormSchema>({
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

    const handleAiAssist = async () => {
        if (isAiKillSwitch) {
            toast({
                title: "AI Disabled",
                description: "AI is disable by Administrator.",
                variant: "destructive"
            });
            return;
        }

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

        setIsAiPending(true);
        aiAbortRef.current = false;

        try {
            const result = await getAiPrebuiltSuggestions({ 
                components: {
                    ...selectedComponents,
                    ram: (selectedComponents.ram as string[]).join(", "),
                    storage: (selectedComponents.storage as string[]).join(", ")
                }, 
                tier: form.getValues("tier") || undefined 
            });

            if (aiAbortRef.current) return;

            if (result && "systemName" in result) {
                const currentName = form.getValues("name");
                const currentDesc = form.getValues("description");
                const currentPrice = form.getValues("price");
                const currentTier = form.getValues("tier");

                let fieldsUpdated = [];

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

                // Add placeholder image if empty
                if (!form.getValues("imageUrl")) {
                    // Using a high-quality Unsplash image of a premium PC build for better aesthetics
                    form.setValue("imageUrl", `https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=800&auto=format&fit=crop`, { shouldValidate: true, shouldDirty: true });
                    fieldsUpdated.push("Image Placeholder");
                }
                
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
            if (!aiAbortRef.current) {
                toast({ 
                    variant: "destructive", 
                    title: "AI Assist Failed", 
                    description: err.message || "An unexpected error occurred while communicating with the AI." 
                });
            }
        } finally {
            setIsAiPending(false);
        }
    };

    const handleCancelAiAssist = () => {
        aiAbortRef.current = true;
        setIsAiPending(false);
        toast({
            title: "AI Assist Cancelled",
            description: "The AI suggestion generation has been aborted.",
        });
    };

    useEffect(() => {
        const rawRamIds = form.getValues("ram") || [];
        const ramIds = rawRamIds.filter(Boolean);
        if (rawRamIds.length !== ramIds.length) {
            form.setValue("ram", ramIds);
        }
    }, [form.watch("ram")]);

    const onSubmit = async (values: AddPrebuiltFormSchema) => {
        try {
            const mobo = inventory["Motherboard"]?.find(m => m.id === values.motherboard);
            const rSlots = mobo ? parseInt(mobo.specifications?.['Memory Slots']?.toString() || "4") : 4;
            const nSlots = mobo ? parseInt(mobo.specifications?.['NVMe Slots']?.toString() || "1") : 1;
            const sSlots = mobo ? parseInt(mobo.specifications?.['SATA Slots']?.toString() || "2") : 1;
            
            let currentSticks = 0;
            const validRam = [];
            for (const rId of values.ram) {
                if (!rId) continue;
                const part = inventory["RAM"]?.find(r => r.id === rId);
                const sticks = part ? parseInt(part.specifications?.['Stick Count']?.toString() || "1") : 1;
                if (currentSticks + sticks <= rSlots) {
                    validRam.push(rId);
                    currentSticks += sticks;
                } else {
                    break;
                }
            }
            values.ram = validRam;
            values.storage = values.storage.slice(0, nSlots + sSlots).filter(Boolean);

            await onSave(values);
            toast({ title: initialData ? "Prebuilt Updated!" : "Prebuilt System Added!", description: `${values.name} has been ${initialData ? 'updated' : 'added'}.` });
            if (!initialData) form.reset();
            setOpen(false);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Save Failed",
                description: error.message || "An unexpected error occurred while saving."
            });
        }
    };

    const onFormError = (errors: any) => {
        console.error("Form Validation Errors:", errors);
        
        // Handle nested errors (like arrays) or standard field errors
        const getErrorMessage = (err: any): string | null => {
            if (!err) return null;
            if (err.message) return err.message;
            if (Array.isArray(err)) return getErrorMessage(err.find(Boolean));
            if (typeof err === 'object') {
                const firstKey = Object.keys(err)[0];
                return getErrorMessage(err[firstKey]);
            }
            return "Invalid field";
        };

        const errorMsg = getErrorMessage(errors);
        if (errorMsg) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: errorMsg
            });
        }
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen && isAiPending) return;
        setOpen(isOpen);
        if (!isOpen) { form.reset(); }
    };

    const selectedMoboId = form.watch("motherboard");
    const selectedMobo = inventory["Motherboard"]?.find(m => m.id === selectedMoboId);
    
    const ramSlots = selectedMobo ? parseInt(selectedMobo.specifications?.['Memory Slots']?.toString() || "4") : 4;
    const nvmeSlots = selectedMobo ? parseInt(selectedMobo.specifications?.['NVMe Slots']?.toString() || "1") : 1;
    const sataSlots = selectedMobo ? parseInt(selectedMobo.specifications?.['SATA Slots']?.toString() || "2") : 1;
    const totalStorageSlots = nvmeSlots + sataSlots;

    const ramIds = (form.watch("ram") || []).filter(Boolean);
    const ramFields = [];
    let currentSticks = 0;
    
    for (let i = 0; i < ramIds.length; i++) {
        const id = ramIds[i];
        const part = inventory["RAM"]?.find(r => r.id === id);
        const sticks = part ? parseInt(part.specifications?.['Stick Count']?.toString() || "1") : 1;
        
        if (currentSticks + sticks <= ramSlots) {
            ramFields.push({ fieldIndex: i, isPlaceholder: false, part, sticks, isEmpty: false, isBlocked: false });
            currentSticks += sticks;
            for (let s = 1; s < sticks; s++) {
                ramFields.push({ fieldIndex: i, isPlaceholder: true, part, sticks, isEmpty: false, isBlocked: false });
            }
        }
    }
    
    const nextFieldIndex = ramIds.length;
    if (currentSticks < ramSlots) {
        ramFields.push({ fieldIndex: nextFieldIndex, isPlaceholder: false, isEmpty: true, isBlocked: false });
        currentSticks++;
    }
    
    while (currentSticks < ramSlots) {
        ramFields.push({ fieldIndex: -1, isPlaceholder: true, isEmpty: false, isBlocked: true });
        currentSticks++;
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[75vw] p-0 gap-0 overflow-hidden border-primary/20 bg-background/95 backdrop-blur-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] rounded-3xl [&>button.absolute]:hidden">

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
                            {initialData ? "Refine system details, pricing, and component configuration." : "Configure new system inventory with AI-assisted identity generation."}
                        </DialogDescription>
                    </div>
                    <div className="ml-auto">
                        <SparkleButton
                            type="button"
                            onClick={isAiPending ? handleCancelAiAssist : handleAiAssist}
                            isLoading={isAiPending}
                            loadingChildren="CANCEL"
                            icon={<Sparkles className="h-4 w-4" />}
                            className="h-11 px-6 shadow-lg transition-all duration-300 text-xs font-black uppercase tracking-widest"
                        >
                            AI ASSIST
                        </SparkleButton>
                    </div>
                </DialogHeader>
                {isAiPending && (
                    <div className="relative overflow-hidden bg-primary/5 border-b border-primary/10">
                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary/20">
                            <div className="h-full bg-primary animate-progress-glow w-[30%]" />
                        </div>
                        <div className="px-8 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                                    <BrainCircuit className="h-4 w-4 text-primary animate-pulse" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-primary uppercase tracking-widest">Buildbot Intelligence Active</span>
                                    <span className="text-[10px] text-primary/60 font-medium">Researching market tiers, pricing benchmarks, and system identities...</span>
                                </div>
                            </div>
                            <Badge variant="outline" className="animate-pulse bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-bold px-3 py-1">
                                Processing
                            </Badge>
                        </div>
                    </div>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit, onFormError)} className="flex flex-col">

                        {/* ── Scrollable Body ── */}
                        <ScrollArea className="h-[70vh]">
                            <div className="px-10 py-8 space-y-10">

                                {/* Section: System Identity */}
                                <div className="grid grid-cols-12 gap-8 items-start">
                                    
                                    {/* Left Column: Image Preview */}
                                    <div className="col-span-12 md:col-span-4 sticky top-0">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70 mb-4 flex items-center gap-3">
                                            <span className="inline-block w-4 h-px bg-primary/40" />
                                            Visual Identity
                                        </p>
                                        <div className="p-2 rounded-3xl border border-primary/10 bg-primary/5 shadow-inner">
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

                                    {/* Right Column: Identity Fields */}
                                    <div className="col-span-12 md:col-span-8 space-y-6">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70 mb-4 flex items-center gap-3">
                                            <span className="inline-block w-4 h-px bg-primary/40" />
                                            System Details
                                        </p>
                                        
                                        <div className="grid grid-cols-2 gap-4">
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
                                                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Tier</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-muted/30 border-border/40 h-10 rounded-xl">
                                                                <SelectValue placeholder="Select tier…" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="rounded-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-100 data-[state=open]:slide-in-from-top-0 duration-0">
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
                                                        <Input 
                                                            type="number" 
                                                            className="bg-muted/30 border-border/40 h-10 rounded-xl" 
                                                            placeholder="e.g., 125000" 
                                                            {...field} 
                                                            onKeyDown={(e) => {
                                                                if (["e", "E", "+", "-", "."].includes(e.key)) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        {/* Description */}
                                        <div className="pt-4">
                                            <FormField control={form.control} name="description" render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70 flex items-center gap-2">
                                                            Description
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
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200"
                                                                onClick={() => {
                                                                    const val = field.value || "";
                                                                    field.onChange(`\`${val}\``);
                                                                }}
                                                                title="Code"
                                                            >
                                                                <Code className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <FormControl>
                                                        <textarea 
                                                            className="flex min-h-[140px] w-full rounded-2xl border border-border/40 bg-muted/20 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground/50 focus:bg-background focus:border-primary/40 focus:ring-1 focus:ring-primary/20 focus-visible:outline-none transition-all duration-300 font-mono leading-relaxed"
                                                            placeholder="Use Markdown for formatting...
- The Midnight Apex
- 4K Gaming Beast

**System Overview:** A high-end capable build..."
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Components */}
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70 mb-4 flex items-center gap-3">
                                        <span className="inline-block w-4 h-px bg-primary/40" />
                                        Component Selection
                                        <span className="text-muted-foreground/40 normal-case font-normal tracking-normal ml-1">(sorted A–Z · type to search)</span>
                                        <span className="inline-block flex-1 h-px bg-primary/10" />
                                    </p>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-6 p-6 rounded-3xl border border-primary/10 bg-primary/5">
                                        {/* Row 1: CPU & Motherboard */}
                                        <div className="space-y-5">
                                            <FormField control={form.control} name="cpu" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">CPU</FormLabel>
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
                                            <FormField control={form.control} name="motherboard" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Motherboard</FormLabel>
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
                                        
                                        {/* Row 1b: GPU & Cooler */}
                                        <div className="space-y-5">
                                            <FormField control={form.control} name="gpu" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">GPU</FormLabel>
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
                                            <FormField control={form.control} name="cooler" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Cooler</FormLabel>
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

                                        {/* Row 2: PSU & Case */}
                                        <div className="space-y-5">
                                            <FormField control={form.control} name="psu" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Power Supply</FormLabel>
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
                                        </div>
                                        <div className="space-y-5">
                                            <FormField control={form.control} name="case" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Chassis / Case</FormLabel>
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

                                        <div className="col-span-2 space-y-6 pt-4 border-t border-primary/10">
                                            {/* RAM (Multi) */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">RAM Configuration</FormLabel>
                                                    <span className="text-[10px] font-bold text-primary">{ramSlots} Slots Available</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {ramFields.map((fieldData, visualIndex) => {
                                                        if (fieldData.isBlocked) {
                                                            return (
                                                                <div key={`ram-blocked-${visualIndex}`} className="flex items-center justify-center h-10 rounded-lg border border-dashed border-muted bg-muted/10">
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Unavailable</span>
                                                                </div>
                                                            );
                                                        }
                                                        if (fieldData.isPlaceholder) {
                                                            return (
                                                                <div key={`ram-placeholder-${visualIndex}`} className="flex items-center justify-center h-10 px-3 rounded-lg border border-primary/20 bg-primary/5 overflow-hidden">
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70 truncate">Occupied by {fieldData.part?.name}</span>
                                                                </div>
                                                            );
                                                        }
                                                        return (
                                                            <FormField
                                                                key={`ram-${fieldData.fieldIndex}`}
                                                                control={form.control}
                                                                name={`ram.${fieldData.fieldIndex}` as any}
                                                                render={({ field }) => (
                                                                    <div className="relative group">
                                                                        <PartSelector
                                                                            category={`RAM Module ${fieldData.fieldIndex + 1}`}
                                                                            items={inventory["RAM"] || []}
                                                                            value={field.value || ""}
                                                                            onChange={field.onChange}
                                                                            isOpen={openSlot === `ram-${fieldData.fieldIndex}`}
                                                                            onOpenChange={(o) => setOpenSlot(o ? `ram-${fieldData.fieldIndex}` : null)}
                                                                        />
                                                                        {field.value && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    field.onChange("");
                                                                                    const current = form.getValues("ram");
                                                                                    const next = [...current];
                                                                                    next.splice(fieldData.fieldIndex, 1);
                                                                                    form.setValue("ram", next);
                                                                                }}
                                                                                className="absolute -right-2 -top-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20"
                                                                            >
                                                                                <X className="h-3 w-3" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Storage (Multi) */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Storage Array</FormLabel>
                                                    <span className="text-[10px] font-bold text-primary">{totalStorageSlots} Slots Available</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {Array.from({ length: totalStorageSlots }).map((_, index) => {
                                                        const isNvme = index < nvmeSlots;
                                                        const slotLabel = isNvme ? `NVMe M.2 Slot ${index + 1}` : `SATA Slot ${index - nvmeSlots + 1}`;
                                                        return (
                                                        <FormField
                                                            key={`storage-${index}`}
                                                            control={form.control}
                                                            name={`storage.${index}` as any}
                                                            render={({ field }) => (
                                                                <div className="relative group">
                                                                    <PartSelector
                                                                        category={slotLabel}
                                                                        items={inventory["Storage"]?.filter(s => {
                                                                            if (!s.specifications) return true;
                                                                            const isPartNvme = s.specifications['Type']?.toString().toLowerCase().includes('nvme') || s.name.toLowerCase().includes('nvme');
                                                                            return isNvme ? isPartNvme : !isPartNvme;
                                                                        }) || []}
                                                                        value={field.value || ""}
                                                                        onChange={field.onChange}
                                                                        isOpen={openSlot === `storage-${index}`}
                                                                        onOpenChange={(o) => setOpenSlot(o ? `storage-${index}` : null)}
                                                                    />
                                                                    {field.value && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => field.onChange("")}
                                                                            className="absolute -right-2 -top-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20"
                                                                        >
                                                                            <X className="h-3 w-3" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        />
                                                    )})}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </ScrollArea>

                        {/* ── Sticky Footer ── */}
                        <DialogFooter className="px-8 py-6 border-t border-border/40 bg-muted/20 flex-row justify-between items-center sm:justify-between">
                            <DialogClose asChild>
                                <Button type="button" variant="ghost" size="lg" className="rounded-xl px-6 font-bold uppercase tracking-wider text-xs hover:bg-destructive/10 hover:text-destructive">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                size="lg"
                                disabled={isAiPending}
                                className="rounded-xl px-10 font-bold uppercase tracking-[0.15em] text-xs h-12 shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all duration-200"
                            >
                                {isAiPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {initialData ? "Update Prebuilt" : "Deploy System"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog >
    );
}
