"use client";

import { useState, useMemo } from "react";
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
import { SparkleButton } from "./ui/sparkle-button";
import { Form } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Sparkles, Cpu } from "lucide-react";
import type { Part, PrebuiltSystem } from "@/lib/types";

// Refactored Modules
import { usePrebuiltForm, type PrebuiltBuilderAddFormSchema } from "./prebuilt-builder/use-prebuilt-form";
export type { PrebuiltBuilderAddFormSchema };
import { IdentityFields } from "./prebuilt-builder/identity-fields";
import { ComponentFields } from "./prebuilt-builder/component-fields";

interface PrebuiltBuilderAddDialogProps {
    children: React.ReactNode;
    onSave: (data: PrebuiltBuilderAddFormSchema) => void;
    parts: Part[];
    initialData?: PrebuiltSystem;
    title?: string;
}

/**
 * Prebuilt Builder Add/Edit Dialog Orchestrator
 * This component manages the dialog state and coordinates form logic, 
 * identity fields, and component selection modules.
 */
export function PrebuiltBuilderAddDialog({ children, onSave, parts, initialData, title }: PrebuiltBuilderAddDialogProps) {
    const [open, setOpen] = useState(false);
    const [openSlot, setOpenSlot] = useState<string | null>(null);

    const { form, isAiPending, handleAiAssist, onSubmit } = usePrebuiltForm({
        parts,
        initialData,
        onSave,
        onClose: () => setOpen(false)
    });

    const inventory = useMemo(() => {
        const grouped: Record<string, Part[]> = {};
        for (const part of parts || []) {
            if (part.isArchived) continue;
            if (!grouped[part.category]) grouped[part.category] = [];
            grouped[part.category].push(part);
        }
        for (const cat of Object.keys(grouped)) {
            grouped[cat].sort((a, b) => a.name.localeCompare(b.name));
        }
        return grouped;
    }, [parts]);

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen && isAiPending) return;
        setOpen(isOpen);
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
                        <SparkleButton
                            type="button"
                            onClick={handleAiAssist}
                            isLoading={isAiPending}
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
                            <div className="h-full bg-primary animate-progress-glow w-[35%]" />
                        </div>
                        <div className="px-8 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
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
                                <IdentityFields form={form} />
                                <ComponentFields 
                                    form={form} 
                                    inventory={inventory} 
                                    openSlot={openSlot} 
                                    setOpenSlot={setOpenSlot} 
                                />
                            </div>
                        </ScrollArea>

                        <DialogFooter className="px-8 py-6 border-t border-border/40 bg-muted/20 flex-row justify-between items-center sm:justify-between">
                            <FormStats form={form} />
                            <div className="flex gap-3">
                                <DialogClose asChild>
                                    <Button type="button" variant="ghost" size="lg" className="rounded-xl px-6 font-bold uppercase tracking-wider text-xs hover:bg-destructive/10 hover:text-destructive">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    size="lg"
                                    className="rounded-xl px-10 font-bold uppercase tracking-[0.15em] text-xs h-12 shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all duration-200"
                                >
                                    {initialData ? "Update Selection" : "Complete Build"}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function FormStats({ form }: { form: any }) {
    const vals = form.watch();
    const baseKeys = ['cpu', 'gpu', 'motherboard', 'psu', 'case', 'cooler'];
    const filledBase = baseKeys.filter(k => !!(vals as any)[k]).length;
    const filledRam = (vals.ram || []).filter((r: any) => !!r).length;
    const filledStorage = (vals.storage || []).filter((s: any) => !!s).length;
    const totalFilled = filledBase + filledRam + filledStorage;

    return (
        <div className="flex flex-col">
            <p className="text-xs text-muted-foreground font-medium">
                {totalFilled} components selected
            </p>
            <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-[10px] text-muted-foreground/60 hover:text-primary justify-start"
                onClick={() => form.reset()}
            >
                Clear all fields
            </Button>
        </div>
    );
}
