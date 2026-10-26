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
import { useProductSaveOperation } from '@/hooks/use-product-save-operation';
import type { CreatedProduct } from '@/lib/product-identity';
import { ToastAction } from './ui/toast';
import { ScrollArea } from "./ui/scroll-area";
import { MultiImageUpload } from "./parts/multi-image-upload";
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
import { AiActionButton } from "./ui/ai-action-button";
import { ThemeIcon, Text, Paper, ActionIcon, Badge } from "@mantine/core";
import type { ComponentData, Part, PrebuiltSystem } from "@/lib/types";
import { checkCompatibility, checkFullBuildCompatibility, type CompatibilityResult } from "@/lib/compatibility";

const formSchema = z.object({
    name: z.string().min(1, "System name is required."),
    tier: z.string().min(1, "Please select a tier."),
    description: z.string().optional(),
    price: z.coerce.number().min(0, "Price must be a positive number."),
    imageUrl: z.string().optional().or(z.literal("")),
    images: z.array(z.string()).optional(),
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

function getMissingAiAssistComponents(values: AddPrebuiltFormSchema): string[] {
    const missing: string[] = [];
    if (!values.cpu) missing.push("CPU");
    if (!values.motherboard) missing.push("motherboard");
    if (!values.gpu) missing.push("GPU");
    if (!values.cooler) missing.push("cooler");
    if (!values.psu) missing.push("power supply");
    if (!values.case) missing.push("case");
    if (!(values.ram || []).some(Boolean)) missing.push("RAM");
    if (!(values.storage || []).some(Boolean)) missing.push("storage");
    return missing;
}

function getSelectedPartIds(values: AddPrebuiltFormSchema): string[] {
    return [
        values.cpu,
        values.gpu,
        values.motherboard,
        ...(values.ram || []),
        ...(values.storage || []),
        values.psu,
        values.case,
        values.cooler,
    ].filter((id): id is string => Boolean(id));
}

interface AddPrebuiltDialogProps {
    children?: React.ReactNode;
    onSave: (data: AddPrebuiltFormSchema, operationId?: string) => Promise<CreatedProduct | void>;
    parts: Part[];
    initialData?: PrebuiltSystem;
    title?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

/** Inline searchable part selector — sits inside a FormField */
function PartSelector({
    category,
    items,
    value,
    onChange,
    isOpen,
    onOpenChange,
    getCompatibility,
}: {
    category: string;
    items: Part[];
    value: string;
    onChange: (v: string) => void;
    isOpen: boolean;
    onOpenChange: (v: boolean) => void;
    getCompatibility?: (part: Part) => CompatibilityResult;
}) {
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
                ? sorted.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
                : sorted,
        [sorted, query]
    );

    const selectedPart = items.find((p) => p.id === value);

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
                collisionBoundary={triggerRef.current?.closest<HTMLElement>('[data-radix-scroll-area-viewport]')}
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
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{category} Inventory</span>
                    <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400">{filtered.length} Results</span>
                </div>
                <ScrollArea className="h-[min(340px,calc(var(--radix-popover-content-available-height)-96px))]">
                    <div className="p-1.5">
                        {filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                                <Search className="h-8 w-8 text-slate-400/40 mb-2" />
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">No components found</p>
                                <p className="text-[10px] text-slate-400 mt-1 italic">Try a different search term</p>
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
                                                !isIncompatible && "hover:bg-cyan-500/10 hover:border-cyan-500/20 group",
                                                isIncompatible && "cursor-not-allowed border-rose-500/20 bg-rose-500/5 opacity-60",
                                                value === item.id ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300" : "text-slate-800 dark:text-slate-200"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 w-full">
                                                <div className={cn(
                                                    "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300",
                                                    value === item.id 
                                                        ? "bg-cyan-600 text-white shadow-sm" 
                                                        : "bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 group-hover:bg-cyan-500/20 group-hover:text-cyan-600 dark:group-hover:text-cyan-400"
                                                )}>
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                
                                                <div className="flex flex-col items-start gap-0.5 text-left flex-1 min-w-0">
                                                    <span className={cn(
                                                        "font-bold text-[12px] leading-tight tracking-tight truncate w-full transition-colors",
                                                        value === item.id ? "text-cyan-700 dark:text-cyan-300" : "text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400"
                                                    )}>
                                                        {item.name}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400 dark:text-slate-500">{item.brand}</span>
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

export function AddPrebuiltDialog({
    children,
    onSave,
    parts,
    initialData,
    title,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
}: AddPrebuiltDialogProps) {
    const isControlled = controlledOpen !== undefined;
    const [internalOpen, setInternalOpen] = useState(false);
    const open = isControlled ? controlledOpen : internalOpen;
    const [isSaving, setIsSaving] = useState(false);
    const [isAiPending, setIsAiPending] = useState(false);
    const [aiDuration, setAiDuration] = useState<number | null>(null);
    const [tokensUsed, setTokensUsed] = useState<number | null>(null);
    const aiAbortRef = useRef(false);
    // Track which PartSelector dropdown is open
    const [openSlot, setOpenSlot] = useState<string | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [justAutofilled, setJustAutofilled] = useState(false);
    const [showTelemetry, setShowTelemetry] = useState(false);
    const startTimeRef = useRef<number>(0);
    const { toast } = useToast();
    const { getOperation, resetOperation } = useProductSaveOperation();

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
            images: initialData?.images || (initialData?.imageUrl ? [initialData.imageUrl] : []),
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

    const componentValues = form.watch();
    const missingAiAssistComponents = getMissingAiAssistComponents(componentValues);
    const isComponentSelectionComplete = missingAiAssistComponents.length === 0;
    const selectedPartsPrice = useMemo(() => {
        const total = getSelectedPartIds(componentValues).reduce((sum, id) => {
            return sum + (parts.find((part) => part.id === id)?.price || 0);
        }, 0);
        return Math.round(total * 100) / 100;
    }, [componentValues, parts]);

    const toComponentData = (part: Part): ComponentData => ({
        id: part.id,
        model: part.name,
        description: part.description || "",
        price: part.price,
        image: part.imageUrl,
        images: part.images,
        imageHint: part.name.toLowerCase().split(" ").slice(0, 2).join(" "),
        icon: MousePointer2,
        wattage: part.wattage,
        socket: part.specifications?.["Socket"]?.toString() || part.specifications?.["socket"]?.toString() || part.socket,
        ramType: part.specifications?.["Memory Type"]?.toString() || part.specifications?.["RAM Type"]?.toString() || part.ramType,
        performanceScore: part.performanceScore,
        performanceTier: part.performanceTier,
        specifications: part.specifications,
        dimensions: part.dimensions,
    });

    const buildFromValues = (values: AddPrebuiltFormSchema) => {
        const findSelected = (category: string, id?: string) => {
            if (!id) return null;
            const part = inventory[category]?.find((candidate) => candidate.id === id);
            return part ? toComponentData(part) : null;
        };

        return {
            CPU: findSelected("CPU", values.cpu),
            GPU: findSelected("GPU", values.gpu),
            Motherboard: findSelected("Motherboard", values.motherboard),
            RAM: (values.ram || []).map((id) => findSelected("RAM", id)).filter((part): part is ComponentData => Boolean(part)),
            Storage: (values.storage || []).map((id) => findSelected("Storage", id)).filter((part): part is ComponentData => Boolean(part)),
            PSU: findSelected("PSU", values.psu),
            Case: findSelected("Case", values.case),
            Cooler: findSelected("Cooler", values.cooler),
        } satisfies Record<string, ComponentData | ComponentData[] | null>;
    };

    const compatibilityBuild: Record<string, ComponentData | ComponentData[] | null> = useMemo(
        () => buildFromValues(componentValues),
        [componentValues, inventory]
    );

    const getCompatibilityForPart = (part: Part, currentValue = "") => {
        const build = { ...compatibilityBuild };

        if (part.category === "RAM" || part.category === "Storage") {
            const selected = [...((build[part.category] as ComponentData[]) || [])];
            const currentIndex = selected.findIndex((component) => component.id === currentValue);
            if (currentIndex >= 0) selected.splice(currentIndex, 1);
            build[part.category] = selected;
        } else {
            build[part.category] = null;
        }

        return checkCompatibility(part, build);
    };

    // Re-reset form if initialData changes or dialog opens
    useEffect(() => {
        if (open && initialData) {
            form.reset({
                name: initialData.name,
                tier: initialData.tier,
                description: initialData.description,
                price: Math.round((initialData.price || 0) * 100) / 100,
                imageUrl: initialData.imageUrl,
                images: initialData.images || (initialData.imageUrl ? [initialData.imageUrl] : []),
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
                name: "", tier: "", description: "", price: 0, imageUrl: "", images: [],
                cpu: "", gpu: "", motherboard: "", ram: [], storage: [], psu: "", case: "", cooler: "",
            });
        }
    }, [open, initialData, form]);

    useEffect(() => {
        if (!open || form.getValues("price") === selectedPartsPrice) return;
        form.setValue("price", selectedPartsPrice, { shouldValidate: true, shouldDirty: true });
    }, [form, open, selectedPartsPrice]);

    const handleAiAssist = async () => {
        if (isAiKillSwitch) {
            toast({
                title: "AI Disabled",
                description: "AI is disable by Administrator.",
                variant: "destructive"
            });
            return;
        }

        const missingComponents = getMissingAiAssistComponents(form.getValues());
        if (missingComponents.length > 0) {
            toast({
                variant: "destructive",
                title: "Complete Component Selection",
                description: `Select a ${missingComponents.join(", ")} before using AI Assist.`,
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

        const selectedPartIds = getSelectedPartIds(form.getValues());
        const inventoryPrice = selectedPartIds.reduce((total, id) => {
            return total + (parts.find((part) => part.id === id)?.price || 0);
        }, 0);
        const productHighlights = selectedPartIds
            .map((id) => parts.find((part) => part.id === id))
            .filter((part): part is Part => Boolean(part))
            .map((part) => {
                const maxChars = ["CPU", "GPU", "Motherboard"].includes(part.category) ? 900 : 280;
                const highlights = part.description?.trim().slice(0, maxChars);
                return highlights ? `${part.category} — ${part.name}:\n${highlights}` : `${part.category} — ${part.name}`;
            })
            .join("\n\n");

        setIsAiPending(true);
        aiAbortRef.current = false;
        setAiDuration(null);
        setTokensUsed(null);
        const startTime = performance.now();

        try {
            const result = await getAiPrebuiltSuggestions({ 
                components: {
                    ...selectedComponents,
                    ram: (selectedComponents.ram as string[]).join(", "),
                    storage: (selectedComponents.storage as string[]).join(", ")
                }, 
                tier: form.getValues("tier") || undefined,
                inventoryPrice: inventoryPrice || undefined,
                productHighlights: productHighlights || undefined,
            });

            if (aiAbortRef.current) return;

            const endTime = performance.now();
            setAiDuration((endTime - startTime) / 1000);
            if (result) {
                setTokensUsed(Math.round(JSON.stringify(result).length / 4));
            }

            if (result && "description" in result && result.description) {
                let fieldsUpdated = [];

                form.setValue("description", result.description, { shouldValidate: true, shouldDirty: true });
                fieldsUpdated.push("Description");
                
                if (fieldsUpdated.length > 0) {
                    setJustAutofilled(true);
                    setTimeout(() => setJustAutofilled(false), 2500);
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
        setAiDuration(null);
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
        if (isSaving) return;
        try {
            const compatibilityIssues = checkFullBuildCompatibility(buildFromValues(values));
            const blockingIssue = compatibilityIssues.find((issue) => issue.severity === "critical");

            if (blockingIssue) {
                toast({
                    variant: "destructive",
                    title: "Compatibility Error",
                    description: blockingIssue.message,
                });
                return;
            }

            setIsSaving(true);

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

            const saved = await onSave(values, getOperation(values));
            toast({ title: initialData ? "Prebuilt Updated!" : "Prebuilt System Added!", description: `${values.name} has been ${initialData ? 'updated' : 'added'}.`,
              action: saved ? <ToastAction altText="View item" onClick={() => window.location.assign(saved.adminUrl)}>View item</ToastAction> : undefined });
            if (!initialData) form.reset();
            handleOpenChange(false);
            resetOperation();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Save Failed",
                description: error.message || "An unexpected error occurred while saving."
            });
        } finally {
            setIsSaving(false);
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

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isAiPending) {
            setElapsedTime(0);
            startTimeRef.current = Date.now();
            interval = setInterval(() => {
                setElapsedTime(Math.round((Date.now() - startTimeRef.current) / 1000));
            }, 100);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isAiPending]);

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen && (isAiPending || isSaving)) return;
        if (!isOpen) setOpenSlot(null);
        if (!isControlled) {
            setInternalOpen(isOpen);
        }
        controlledOnOpenChange?.(isOpen);
        if (!isOpen) { 
            form.reset(); 
            setAiDuration(null);
            setShowTelemetry(false);
        }
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

    const highlightClass = justAutofilled
        ? "ring-2 ring-cyan-500/50 bg-cyan-500/10 dark:bg-cyan-500/10 transition-all duration-700"
        : "";
    const watchedImages = form.watch("images");
    const watchedImageUrl = form.watch("imageUrl");
    const images = watchedImages?.length ? watchedImages : (watchedImageUrl ? [watchedImageUrl] : []);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent
                onEscapeKeyDown={(event) => { if (isSaving) event.preventDefault(); }}
                onPointerDownOutside={(event) => { if (isSaving) event.preventDefault(); }}
                className="w-[90vw] max-w-[90vw] max-h-[calc(100vh-24px)] p-0 gap-0 overflow-hidden border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#111722] shadow-lg rounded-xl [&>button.absolute]:hidden"
            >

                {/* ── Header ── */}
                <DialogHeader className="p-3 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] flex flex-row items-center justify-between gap-3 space-y-0">
                    <div className="flex items-center gap-3">
                        <ThemeIcon size={46} radius="xl" variant="light" color="cyan" className="shadow-sm">
                            <Cpu className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                        </ThemeIcon>
                        <div>
                            <DialogTitle className="text-xl font-headline font-extrabold tracking-tight text-slate-900 dark:text-white">
                                {title || (initialData ? "Edit Prebuilt System" : "Add New Prebuilt System")}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {initialData ? "Refine system details, pricing, and component configuration." : "Configure new system inventory with AI-assisted identity generation."}
                            </DialogDescription>
                        </div>
                    </div>

                    <div className="ml-auto">
                        <AiActionButton
                            label="AI ASSIST"
                            isPending={isAiPending}
                            onTrigger={handleAiAssist}
                            onCancel={handleCancelAiAssist}
                            elapsedTime={elapsedTime}
                            aiDuration={aiDuration}
                            tokensUsed={tokensUsed}
                            mode="prebuilt"
                            disabled={isAiKillSwitch || !isComponentSelectionComplete || isSaving}
                            className={!isComponentSelectionComplete ? "disabled:bg-slate-200 disabled:text-slate-500 disabled:border-slate-300 dark:disabled:bg-white/5 dark:disabled:text-slate-500 dark:disabled:border-white/10 disabled:shadow-none" : undefined}
                        />
                    </div>
                </DialogHeader>

                {isAiPending && (
                    <div className="relative overflow-hidden bg-cyan-500/10 dark:bg-cyan-500/10 border-b border-cyan-500/20">
                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-cyan-500/20">
                            <div className="h-full bg-cyan-500 animate-progress-glow w-[35%]" />
                        </div>
                        <div className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ThemeIcon size={32} radius="lg" variant="light" color="cyan">
                                    <BrainCircuit className="h-4 w-4 text-cyan-600 dark:text-cyan-400 animate-pulse" />
                                </ThemeIcon>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-cyan-800 dark:text-cyan-300 uppercase tracking-wider">
                                        Buildbot Intelligence Active
                                    </span>
                                    <span className="text-[11px] text-slate-600 dark:text-slate-400">
                                        Researching market tiers, pricing benchmarks, and system identities...
                                    </span>
                                </div>
                            </div>
                            <Badge variant="filled" color="cyan" size="sm" className="font-mono font-bold animate-pulse">
                                Processing
                            </Badge>
                        </div>
                    </div>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit, onFormError)} className="flex flex-col">

                        {/* ── Scrollable Body ── */}
                        <ScrollArea className="h-[70vh]">
                            <div className="p-3 space-y-3">

                                {/* Section: System Identity */}
                                <div className="grid grid-cols-12 gap-8 items-start">
                                    
                                    {/* Left Column: Image Preview */}
                                    <div className="col-span-12 md:col-span-4 md:sticky md:top-0">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-400 mb-4 flex items-center gap-2.5">
                                            <span className="inline-block w-3.5 h-0.5 bg-cyan-500/60 rounded-full" />
                                            Visual Identity
                                        </p>
                                        <Paper
                                            withBorder
                                            radius="xl"
                                            p="xs"
                                            className="bg-slate-50/70 dark:bg-[#111722]/60 border-slate-200 dark:border-white/10 shadow-sm"
                                        >
                                            <MultiImageUpload
                                                images={images}
                                                coverImage={watchedImageUrl || ""}
                                                onImagesChange={(updatedImages) => {
                                                    form.setValue("images", updatedImages, { shouldValidate: true, shouldDirty: true });
                                                    const currentCover = form.getValues("imageUrl") || "";
                                                    if (!currentCover || !updatedImages.includes(currentCover)) {
                                                        form.setValue("imageUrl", updatedImages[0] || "", { shouldValidate: true, shouldDirty: true });
                                                    }
                                                }}
                                                onCoverImageChange={(coverImage) => {
                                                    form.setValue("imageUrl", coverImage, { shouldValidate: true, shouldDirty: true });
                                                }}
                                            />
                                        </Paper>
                                    </div>

                                    {/* Right Column: Identity Fields */}
                                    <div className="col-span-12 md:col-span-8 space-y-6">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-400 mb-4 flex items-center gap-2.5">
                                            <span className="inline-block w-3.5 h-0.5 bg-cyan-500/60 rounded-full" />
                                            System Details
                                        </p>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <FormField control={form.control} name="name" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                            System Name
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input 
                                                                className={cn(
                                                                    "bg-slate-50 dark:bg-[#141a23] border-slate-200 dark:border-white/10 h-10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all shadow-sm",
                                                                    highlightClass
                                                                )} 
                                                                placeholder="e.g., Ultimate Gamer V1" 
                                                                {...field} 
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                            </div>

                                            <FormField control={form.control} name="tier" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                        Tier
                                                    </FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className={cn(
                                                                "bg-slate-50 dark:bg-[#141a23] border-slate-200 dark:border-white/10 h-10 rounded-xl text-slate-900 dark:text-white",
                                                                highlightClass
                                                            )}>
                                                                <SelectValue placeholder="Select tier…" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="rounded-xl bg-white dark:bg-[#141a23] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-xl">
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
                                                    <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                        Price (PHP ₱)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input 
                                                            type="number" 
                                                            readOnly
                                                            aria-readonly="true"
                                                            className={cn(
                                                                "cursor-default bg-slate-100 dark:bg-white/[0.04] border-slate-200 dark:border-white/10 h-10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all shadow-sm font-mono",
                                                                highlightClass
                                                            )} 
                                                            placeholder="e.g., 125000" 
                                                            {...field} 
                                                            onKeyDown={(e) => {
                                                                if (["e", "E", "+", "-", "."].includes(e.key)) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <Text size="xs" c="dimmed" mt={4}>Calculated from selected components.</Text>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        {/* Description */}
                                        <div className="pt-2">
                                            <FormField control={form.control} name="description" render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex items-center justify-between mb-2.5">
                                                        <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                            Description
                                                        </FormLabel>
                                                        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 shadow-sm">
                                                            <ActionIcon
                                                                variant="subtle"
                                                                color="gray"
                                                                size="sm"
                                                                className="hover:text-cyan-600 dark:hover:text-cyan-400"
                                                                onClick={() => {
                                                                    const val = field.value || "";
                                                                    field.onChange(`**${val}**`);
                                                                }}
                                                                title="Bold"
                                                            >
                                                                <Bold className="h-3.5 w-3.5" />
                                                            </ActionIcon>
                                                            <ActionIcon
                                                                variant="subtle"
                                                                color="gray"
                                                                size="sm"
                                                                className="hover:text-cyan-600 dark:hover:text-cyan-400"
                                                                onClick={() => {
                                                                    const val = field.value || "";
                                                                    field.onChange(`*${val}*`);
                                                                }}
                                                                title="Italic"
                                                            >
                                                                <Italic className="h-3.5 w-3.5" />
                                                            </ActionIcon>
                                                            <div className="w-px h-4 bg-slate-300 dark:bg-white/10 mx-0.5" />
                                                            <ActionIcon
                                                                variant="subtle"
                                                                color="gray"
                                                                size="sm"
                                                                className="hover:text-cyan-600 dark:hover:text-cyan-400"
                                                                onClick={() => {
                                                                    const val = field.value || "";
                                                                    field.onChange(`# ${val}`);
                                                                }}
                                                                title="Heading 1"
                                                            >
                                                                <Heading1 className="h-3.5 w-3.5" />
                                                            </ActionIcon>
                                                            <ActionIcon
                                                                variant="subtle"
                                                                color="gray"
                                                                size="sm"
                                                                className="hover:text-cyan-600 dark:hover:text-cyan-400"
                                                                onClick={() => {
                                                                    const val = field.value || "";
                                                                    field.onChange(`## ${val}`);
                                                                }}
                                                                title="Heading 2"
                                                            >
                                                                <Heading2 className="h-3.5 w-3.5" />
                                                            </ActionIcon>
                                                            <div className="w-px h-4 bg-slate-300 dark:bg-white/10 mx-0.5" />
                                                            <ActionIcon
                                                                variant="subtle"
                                                                color="gray"
                                                                size="sm"
                                                                className="hover:text-cyan-600 dark:hover:text-cyan-400"
                                                                onClick={() => {
                                                                    const val = field.value || "";
                                                                    const lines = val.split('\n');
                                                                    const listVal = lines.map(line => line.startsWith('- ') ? line : `- ${line}`).join('\n');
                                                                    field.onChange(listVal);
                                                                }}
                                                                title="Bullet List"
                                                            >
                                                                <List className="h-3.5 w-3.5" />
                                                            </ActionIcon>
                                                            <ActionIcon
                                                                variant="subtle"
                                                                color="gray"
                                                                size="sm"
                                                                className="hover:text-cyan-600 dark:hover:text-cyan-400"
                                                                onClick={() => {
                                                                    const val = field.value || "";
                                                                    field.onChange(`\`${val}\``);
                                                                }}
                                                                title="Code"
                                                            >
                                                                <Code className="h-3.5 w-3.5" />
                                                            </ActionIcon>
                                                        </div>
                                                    </div>
                                                    <FormControl>
                                                        <textarea 
                                                            className={cn(
                                                                "flex min-h-[130px] w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#141a23] p-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 focus-visible:outline-none transition-all duration-300 font-mono leading-relaxed",
                                                                highlightClass
                                                            )}
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
                                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-400 mb-4 flex items-center gap-2.5">
                                        <span className="inline-block w-3.5 h-0.5 bg-cyan-500/60 rounded-full" />
                                        Component Selection
                                        <span className="text-slate-400 dark:text-slate-500 normal-case font-normal tracking-normal ml-1">(sorted A–Z · type to search)</span>
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {/* CPU Card */}
                                        <Paper withBorder radius="xl" p="md" className="bg-slate-50/70 dark:bg-[#141a23]/70 border-slate-200 dark:border-white/10 shadow-sm space-y-2.5 transition-all hover:border-cyan-500/30">
                                            <FormField control={form.control} name="cpu" render={({ field }) => (
                                                <FormItem className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <ThemeIcon size={24} radius="md" variant="light" color="cyan">
                                                                <Cpu className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                                                            </ThemeIcon>
                                                            <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 m-0">CPU</FormLabel>
                                                        </div>
                                                        <Badge size="xs" variant="light" color="cyan" className="font-mono text-[9px] uppercase">Core</Badge>
                                                    </div>
                                                    <PartSelector
                                                        category="CPU"
                                                        items={inventory["CPU"] || []}
                                                        value={field.value || ""}
                                                        onChange={field.onChange}
                                                        getCompatibility={(part) => getCompatibilityForPart(part, field.value || "")}
                                                        isOpen={openSlot === "cpu"}
                                                        onOpenChange={(o) => setOpenSlot(o ? "cpu" : null)}
                                                    />
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </Paper>

                                        {/* Motherboard Card */}
                                        <Paper withBorder radius="xl" p="md" className="bg-slate-50/70 dark:bg-[#141a23]/70 border-slate-200 dark:border-white/10 shadow-sm space-y-2.5 transition-all hover:border-cyan-500/30">
                                            <FormField control={form.control} name="motherboard" render={({ field }) => (
                                                <FormItem className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <ThemeIcon size={24} radius="md" variant="light" color="cyan">
                                                                <CircuitBoard className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                                                            </ThemeIcon>
                                                            <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 m-0">Motherboard</FormLabel>
                                                        </div>
                                                        <Badge size="xs" variant="light" color="cyan" className="font-mono text-[9px] uppercase">Base</Badge>
                                                    </div>
                                                    <PartSelector
                                                        category="Motherboard"
                                                        items={inventory["Motherboard"] || []}
                                                        value={field.value || ""}
                                                        onChange={field.onChange}
                                                        getCompatibility={(part) => getCompatibilityForPart(part, field.value || "")}
                                                        isOpen={openSlot === "motherboard"}
                                                        onOpenChange={(o) => setOpenSlot(o ? "motherboard" : null)}
                                                    />
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </Paper>

                                        {/* GPU Card */}
                                        <Paper withBorder radius="xl" p="md" className="bg-slate-50/70 dark:bg-[#141a23]/70 border-slate-200 dark:border-white/10 shadow-sm space-y-2.5 transition-all hover:border-cyan-500/30">
                                            <FormField control={form.control} name="gpu" render={({ field }) => (
                                                <FormItem className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <ThemeIcon size={24} radius="md" variant="light" color="cyan">
                                                                <Monitor className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                                                            </ThemeIcon>
                                                            <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 m-0">GPU</FormLabel>
                                                        </div>
                                                        <Badge size="xs" variant="light" color="cyan" className="font-mono text-[9px] uppercase">Graphics</Badge>
                                                    </div>
                                                    <PartSelector
                                                        category="GPU"
                                                        items={inventory["GPU"] || []}
                                                        value={field.value || ""}
                                                        onChange={field.onChange}
                                                        getCompatibility={(part) => getCompatibilityForPart(part, field.value || "")}
                                                        isOpen={openSlot === "gpu"}
                                                        onOpenChange={(o) => setOpenSlot(o ? "gpu" : null)}
                                                    />
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </Paper>

                                        {/* Cooler Card */}
                                        <Paper withBorder radius="xl" p="md" className="bg-slate-50/70 dark:bg-[#141a23]/70 border-slate-200 dark:border-white/10 shadow-sm space-y-2.5 transition-all hover:border-cyan-500/30">
                                            <FormField control={form.control} name="cooler" render={({ field }) => (
                                                <FormItem className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <ThemeIcon size={24} radius="md" variant="light" color="cyan">
                                                                <Fan className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                                                            </ThemeIcon>
                                                            <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 m-0">Cooler</FormLabel>
                                                        </div>
                                                        <Badge size="xs" variant="light" color="cyan" className="font-mono text-[9px] uppercase">Thermal</Badge>
                                                    </div>
                                                    <PartSelector
                                                        category="Cooler"
                                                        items={inventory["Cooler"] || []}
                                                        value={field.value || ""}
                                                        onChange={field.onChange}
                                                        getCompatibility={(part) => getCompatibilityForPart(part, field.value || "")}
                                                        isOpen={openSlot === "cooler"}
                                                        onOpenChange={(o) => setOpenSlot(o ? "cooler" : null)}
                                                    />
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </Paper>

                                        {/* PSU Card */}
                                        <Paper withBorder radius="xl" p="md" className="bg-slate-50/70 dark:bg-[#141a23]/70 border-slate-200 dark:border-white/10 shadow-sm space-y-2.5 transition-all hover:border-cyan-500/30">
                                            <FormField control={form.control} name="psu" render={({ field }) => (
                                                <FormItem className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <ThemeIcon size={24} radius="md" variant="light" color="cyan">
                                                                <Zap className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                                                            </ThemeIcon>
                                                            <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 m-0">Power Supply</FormLabel>
                                                        </div>
                                                        <Badge size="xs" variant="light" color="cyan" className="font-mono text-[9px] uppercase">Power</Badge>
                                                    </div>
                                                    <PartSelector
                                                        category="PSU"
                                                        items={inventory["PSU"] || []}
                                                        value={field.value || ""}
                                                        onChange={field.onChange}
                                                        getCompatibility={(part) => getCompatibilityForPart(part, field.value || "")}
                                                        isOpen={openSlot === "psu"}
                                                        onOpenChange={(o) => setOpenSlot(o ? "psu" : null)}
                                                    />
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </Paper>

                                        {/* Case Card */}
                                        <Paper withBorder radius="xl" p="md" className="bg-slate-50/70 dark:bg-[#141a23]/70 border-slate-200 dark:border-white/10 shadow-sm space-y-2.5 transition-all hover:border-cyan-500/30">
                                            <FormField control={form.control} name="case" render={({ field }) => (
                                                <FormItem className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <ThemeIcon size={24} radius="md" variant="light" color="cyan">
                                                                <Box className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                                                            </ThemeIcon>
                                                            <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 m-0">Chassis / Case</FormLabel>
                                                        </div>
                                                        <Badge size="xs" variant="light" color="cyan" className="font-mono text-[9px] uppercase">Case</Badge>
                                                    </div>
                                                    <PartSelector
                                                        category="Case"
                                                        items={inventory["Case"] || []}
                                                        value={field.value || ""}
                                                        onChange={field.onChange}
                                                        getCompatibility={(part) => getCompatibilityForPart(part, field.value || "")}
                                                        isOpen={openSlot === "case"}
                                                        onOpenChange={(o) => setOpenSlot(o ? "case" : null)}
                                                    />
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </Paper>
                                    </div>

                                    {/* Multi-slot Arrays (RAM & Storage) */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
                                        {/* RAM Card */}
                                        <Paper withBorder radius="xl" p="md" className="bg-slate-50/70 dark:bg-[#141a23]/70 border-slate-200 dark:border-white/10 shadow-sm space-y-3 transition-all hover:border-cyan-500/30">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <ThemeIcon size={24} radius="md" variant="light" color="cyan">
                                                        <MemoryStick className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                                                    </ThemeIcon>
                                                    <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 m-0">RAM Configuration</FormLabel>
                                                </div>
                                                <Badge size="xs" variant="light" color="cyan" className="font-mono text-[9px] uppercase">{ramSlots} Slots</Badge>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {ramFields.map((fieldData, visualIndex) => {
                                                    if (fieldData.isBlocked) {
                                                        return (
                                                            <div key={`ram-blocked-${visualIndex}`} className="flex items-center justify-center h-10 rounded-xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-100/50 dark:bg-white/[0.02]">
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Unavailable</span>
                                                            </div>
                                                        );
                                                    }
                                                    if (fieldData.isPlaceholder) {
                                                        return (
                                                            <div key={`ram-placeholder-${visualIndex}`} className="flex items-center justify-center h-10 px-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 overflow-hidden">
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 truncate">Occupied ({fieldData.part?.name})</span>
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
                                                                        getCompatibility={(part) => getCompatibilityForPart(part, field.value || "")}
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
                                                                            className="absolute -right-2 -top-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-20"
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
                                        </Paper>

                                        {/* Storage Card */}
                                        <Paper withBorder radius="xl" p="md" className="bg-slate-50/70 dark:bg-[#141a23]/70 border-slate-200 dark:border-white/10 shadow-sm space-y-3 transition-all hover:border-cyan-500/30">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <ThemeIcon size={24} radius="md" variant="light" color="cyan">
                                                        <HardDrive className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                                                    </ThemeIcon>
                                                    <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 m-0">Storage Array</FormLabel>
                                                </div>
                                                <Badge size="xs" variant="light" color="cyan" className="font-mono text-[9px] uppercase">{totalStorageSlots} Slots</Badge>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
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
                                                                    getCompatibility={(part) => getCompatibilityForPart(part, field.value || "")}
                                                                    isOpen={openSlot === `storage-${index}`}
                                                                    onOpenChange={(o) => setOpenSlot(o ? `storage-${index}` : null)}
                                                                />
                                                                {field.value && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => field.onChange("")}
                                                                        className="absolute -right-2 -top-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-20"
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    />
                                                )})}
                                            </div>
                                        </Paper>
                                    </div>
                                </div>

                            </div>
                        </ScrollArea>

                        {/* ── Sticky Footer ── */}
                        <DialogFooter className="relative z-[60] p-3 border-t border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-[#111722] flex-row justify-between items-center sm:justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                onPointerDown={() => setOpenSlot(null)}
                                onClick={() => handleOpenChange(false)}
                                disabled={isSaving}
                                className="h-10 px-6 rounded-xl font-bold uppercase tracking-wider text-xs border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isAiPending || isSaving}
                                className="h-10 px-8 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold uppercase tracking-wider text-xs shadow-md shadow-cyan-500/20 transition-all duration-200"
                            >
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSaving
                                    ? (initialData ? "Updating, please wait" : "Saving, please wait")
                                    : (initialData ? "Update Prebuilt" : "Deploy System")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog >
    );
}
