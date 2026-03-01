"use client";

import { useState, useTransition, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogClose,
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
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "./ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Loader2, Sparkles, Info, Zap, Cpu, BrainCircuit, Search } from "lucide-react";
import { getAiPrebuiltSuggestions } from "@/app/actions";
import type { Part } from "@/lib/types";

const formSchema = z.object({
    name: z.string().min(1, "System name is required."),
    tier: z.string().min(1, "Please select a tier."),
    description: z.string().optional(),
    price: z.coerce.number().min(0, "Price must be a positive number."),
    imageUrl: z.string().url("Must be a valid URL.").optional().or(z.literal("")),
    cpu: z.string().optional(),
    gpu: z.string().optional(),
    motherboard: z.string().optional(),
    ram: z.string().optional(),
    storage: z.string().optional(),
    psu: z.string().optional(),
    case: z.string().optional(),
    cooler: z.string().optional(),
});

export type AddPrebuiltFormSchema = z.infer<typeof formSchema>;

interface AddPrebuiltDialogProps {
    children: React.ReactNode;
    onAddPrebuilt: (data: AddPrebuiltFormSchema) => void;
    parts: Part[];
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

    const selectedName = items.find((p) => p.id === value)?.name;

    return (
        <Select
            onValueChange={(v) => {
                onChange(v);
                onOpenChange(false);
                setQuery("");
            }}
            value={value}
            open={isOpen}
            onOpenChange={(o) => {
                onOpenChange(o);
                if (!o) setQuery("");
            }}
        >
            <FormControl>
                <SelectTrigger className="bg-muted/40 border-border/60 h-9 text-sm">
                    <SelectValue placeholder={`Select ${category}…`}>
                        {selectedName || ""}
                    </SelectValue>
                </SelectTrigger>
            </FormControl>
            <SelectContent className="p-0">
                {/* Search input pinned at top */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60 sticky top-0 bg-popover z-10">
                    <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <input
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                        placeholder={`Search ${category}…`}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        // Prevent select from closing on key events
                        onKeyDown={(e) => e.stopPropagation()}
                    />
                    {query && (
                        <button
                            onClick={() => setQuery("")}
                            className="text-muted-foreground hover:text-foreground text-xs"
                        >
                            ✕
                        </button>
                    )}
                </div>
                <ScrollArea className="max-h-52">
                    {filtered.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">No parts found.</p>
                    ) : (
                        filtered.map((item) => (
                            <SelectItem key={item.id} value={item.id} className="text-sm">
                                {item.name}
                            </SelectItem>
                        ))
                    )}
                </ScrollArea>
            </SelectContent>
        </Select>
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

export function AddPrebuiltDialog({ children, onAddPrebuilt, parts }: AddPrebuiltDialogProps) {
    const [open, setOpen] = useState(false);
    const [isAiPending, startAiTransition] = useTransition();
    const [aiResult, setAiResult] = useState<{ wattage: string; summary: string } | null>(null);
    // Track which PartSelector dropdown is open
    const [openSlot, setOpenSlot] = useState<string | null>(null);
    const { toast } = useToast();

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
            name: "", tier: "", description: "", price: 0, imageUrl: "",
            cpu: "", gpu: "", motherboard: "", ram: "", storage: "", psu: "", case: "", cooler: "",
        },
    });

    const handleAiAssist = () => {
        const selectedComponents = {
            cpu: form.getValues("cpu") || undefined,
            gpu: form.getValues("gpu") || undefined,
            motherboard: form.getValues("motherboard") || undefined,
            ram: form.getValues("ram") || undefined,
            storage: form.getValues("storage") || undefined,
            psu: form.getValues("psu") || undefined,
            case: form.getValues("case") || undefined,
            cooler: form.getValues("cooler") || undefined,
        };

        if (Object.values(selectedComponents).every((c) => !c)) {
            toast({ variant: "destructive", title: "Select Components", description: "Please select at least one component to use the AI assistant." });
            return;
        }

        startAiTransition(async () => {
            setAiResult(null);
            const result = await getAiPrebuiltSuggestions({ components: selectedComponents, tier: form.getValues("tier") || undefined });
            if (result && "systemName" in result) {
                form.setValue("name", result.systemName, { shouldValidate: true });
                form.setValue("description", result.description, { shouldValidate: true });
                form.setValue("price", result.price, { shouldValidate: true });
                if (!form.getValues("imageUrl")) {
                    const seed = result.systemName.replace(/\s+/g, "").toLowerCase();
                    form.setValue("imageUrl", `https://picsum.photos/seed/${seed}/800/600`);
                }
                setAiResult({ wattage: result.estimatedWattage, summary: result.compatibilitySummary });
                toast({ title: "AI Suggestions Applied", description: "The AI has filled in the details for your pre-built system." });
            } else {
                toast({ variant: "destructive", title: "AI Error", description: (result as any).error || "Could not fetch suggestions for this build." });
            }
        });
    };

    const onSubmit = (values: AddPrebuiltFormSchema) => {
        onAddPrebuilt(values);
        toast({ title: "Prebuilt System Added!", description: `${values.name} has been added.` });
        form.reset();
        setAiResult(null);
        setOpen(false);
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) { form.reset(); setAiResult(null); }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-4xl p-0 gap-0 overflow-hidden border-primary/20 bg-background shadow-2xl [&>button.absolute]:hidden">

                {/* ── Header ── */}
                <div className="px-6 pt-6 pb-4 border-b border-border/60 bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                            <Cpu className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-headline text-xl font-bold tracking-tight">Add New Prebuilt System</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">Configure the system details and select components from inventory.</p>
                        </div>
                        <div className="ml-auto">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAiAssist}
                                disabled={isAiPending}
                                className="border-primary/30 hover:border-primary hover:bg-primary/10 text-primary gap-1.5"
                            >
                                {isAiPending ? <Loader2 className="animate-spin h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                                AI Assist
                            </Button>
                        </div>
                    </div>
                    {isAiPending && (
                        <div className="flex items-center gap-2 mt-3 text-xs text-primary animate-pulse">
                            <BrainCircuit className="h-3.5 w-3.5 shrink-0" />
                            <span>Buildbot is Generating System Details…</span>
                        </div>
                    )}
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">

                        {/* ── Scrollable Body ── */}
                        <ScrollArea className="h-[62vh]">
                            <div className="px-6 py-5 space-y-7">

                                {/* Section: System Identity */}
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70 mb-3 flex items-center gap-2">
                                        <span className="inline-block w-5 h-px bg-primary/40" />
                                        System Identity
                                        <span className="inline-block flex-1 h-px bg-primary/10" />
                                    </p>
                                    <div className="grid grid-cols-3 gap-4">

                                        {/* System Name — full width */}
                                        <div className="col-span-3">
                                            <FormField control={form.control} name="name" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">System Name</FormLabel>
                                                    <FormControl>
                                                        <Input className="bg-muted/40 border-border/60 h-9" placeholder="e.g., Ultimate Gamer V1" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        <FormField control={form.control} name="tier" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Tier</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-muted/40 border-border/60 h-9">
                                                            <SelectValue placeholder="Select tier…" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
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
                                                <FormLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Price (PHP ₱)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" className="bg-muted/40 border-border/60 h-9" placeholder="e.g., 125000" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        <FormField control={form.control} name="imageUrl" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                                    Image URL <span className="normal-case font-normal text-muted-foreground/50">(optional)</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input className="bg-muted/40 border-border/60 h-9" placeholder="https://..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        {/* Description — full width */}
                                        <div className="col-span-3">
                                            <FormField control={form.control} name="description" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Description</FormLabel>
                                                    <FormControl>
                                                        <Textarea className="bg-muted/40 border-border/60 resize-none min-h-[70px]" placeholder="Brief description of the system and its intended use case…" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
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
                                    <div className="grid grid-cols-2 gap-3 p-4 rounded-xl border border-primary/10 bg-primary/5">
                                        {PART_SLOTS.map(({ key, label }) => (
                                            <FormField
                                                key={key}
                                                control={form.control}
                                                name={key as keyof AddPrebuiltFormSchema}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</FormLabel>
                                                        <PartSelector
                                                            category={label}
                                                            items={inventory[label] || []}
                                                            value={(field.value as string) || ""}
                                                            onChange={field.onChange}
                                                            isOpen={openSlot === key}
                                                            onOpenChange={(o) => setOpenSlot(o ? key : null)}
                                                        />
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* AI Result Alerts */}
                                {aiResult && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70 flex items-center gap-2">
                                            <span className="inline-block w-5 h-px bg-primary/40" />
                                            AI Analysis
                                            <span className="inline-block flex-1 h-px bg-primary/10" />
                                        </p>
                                        <Alert className="border-primary/20 bg-primary/5">
                                            <Zap className="h-4 w-4 text-primary" />
                                            <AlertTitle className="font-headline text-sm">Estimated Wattage</AlertTitle>
                                            <AlertDescription className="text-xs">{aiResult.wattage}</AlertDescription>
                                        </Alert>
                                        <Alert className="border-border/40 bg-muted/30">
                                            <Info className="h-4 w-4" />
                                            <AlertTitle className="font-headline text-sm">Compatibility Check</AlertTitle>
                                            <AlertDescription className="text-xs">{aiResult.summary}</AlertDescription>
                                        </Alert>
                                    </div>
                                )}

                            </div>
                        </ScrollArea>

                        {/* ── Sticky Footer ── */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-border/60 bg-muted/20">
                            <p className="text-xs text-muted-foreground">
                                {PART_SLOTS.filter(({ key }) => !!form.watch(key as keyof AddPrebuiltFormSchema)).length} / {PART_SLOTS.length} components selected
                            </p>
                            <div className="flex gap-2">
                                <DialogClose asChild>
                                    <Button type="button" variant="ghost" size="sm">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" size="sm" disabled={isAiPending} className="bg-primary hover:bg-primary/90 font-headline tracking-wide px-6">
                                    Add Prebuilt System
                                </Button>
                            </div>
                        </div>

                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
