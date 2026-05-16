"use client";

import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Plus, X, Cpu } from "lucide-react";
import { PartSelector } from "./part-selector";
import { UseFormReturn } from "react-hook-form";
import { PrebuiltBuilderAddFormSchema } from "./use-prebuilt-form";
import type { Part } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface ComponentFieldsProps {
    form: UseFormReturn<PrebuiltBuilderAddFormSchema>;
    inventory: Record<string, Part[]>;
    openSlot: string | null;
    setOpenSlot: (slot: string | null) => void;
}

export function ComponentFields({ form, inventory, openSlot, setOpenSlot }: ComponentFieldsProps) {
    const { toast } = useToast();

    const handleOpenSlot = (isOpen: boolean, slotName: string, category: string) => {
        if (isOpen) {
            const currentCase = form.getValues('case');
            const currentMobo = form.getValues('motherboard');
            const currentCpu = form.getValues('cpu');
            
            if (category !== 'Case' && !currentCase) {
                toast({ variant: 'destructive', title: 'Sequence Required', description: 'Please select a Case first to establish physical dimensions.' });
                return;
            }
            if (category !== 'Case' && category !== 'Motherboard' && !currentMobo) {
                toast({ variant: 'destructive', title: 'Sequence Required', description: 'Please select a Motherboard next to establish socket compatibility.' });
                return;
            }
            const internalComponents = ['GPU', 'RAM', 'Storage', 'PSU', 'Cooler'];
            if (internalComponents.includes(category) && !currentCpu) {
                toast({ variant: 'destructive', title: 'Sequence Required', description: 'Please select a CPU next to establish core performance baseline.' });
                return;
            }
        }
        setOpenSlot(isOpen ? slotName : null);
    };

    const renderSingleSlot = (name: keyof PrebuiltBuilderAddFormSchema, label: string, category: string) => (
        <FormField control={form.control} name={name as any} render={({ field }) => (
            <FormItem>
                <FormLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</FormLabel>
                <PartSelector
                    category={category}
                    items={inventory[category] || []}
                    value={field.value as string || ""}
                    onChange={field.onChange}
                    isOpen={openSlot === name}
                    onOpenChange={(o) => handleOpenSlot(o, name as string, category)}
                />
                <FormMessage />
            </FormItem>
        )} />
    );

    return (
        <div className="space-y-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70 mb-3 flex items-center gap-2">
                <span className="inline-block w-5 h-px bg-primary/40" />
                <Cpu className="h-3 w-3 text-primary" />
                Component Selection
                <span className="text-muted-foreground/40 normal-case font-normal tracking-normal ml-1">(sorted A–Z · type to search)</span>
                <span className="inline-block flex-1 h-px bg-primary/10" />
            </p>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 rounded-xl border border-primary/10 bg-primary/5">
                <div className="space-y-4">
                    {renderSingleSlot("case", "Case", "Case")}
                    {renderSingleSlot("motherboard", "Motherboard", "Motherboard")}
                </div>
                <div className="space-y-4">
                    {renderSingleSlot("cpu", "CPU", "CPU")}
                    {renderSingleSlot("gpu", "GPU", "GPU")}
                </div>

                <div className="col-span-2 space-y-4 pt-2">
                    {/* RAM Modules */}
                    <MultiSlotField 
                        form={form} 
                        name="ram" 
                        label="RAM Modules" 
                        category="RAM" 
                        inventory={inventory} 
                        openSlot={openSlot} 
                        onOpenSlot={handleOpenSlot} 
                    />
                    {/* Storage Drives */}
                    <MultiSlotField 
                        form={form} 
                        name="storage" 
                        label="Storage Drives" 
                        category="Storage" 
                        inventory={inventory} 
                        openSlot={openSlot} 
                        onOpenSlot={handleOpenSlot} 
                    />
                </div>

                <div className="col-span-2 grid grid-cols-2 gap-4 pt-2 border-t border-primary/10 mt-2">
                    {renderSingleSlot("psu", "PSU", "PSU")}
                    {renderSingleSlot("cooler", "Cooler", "Cooler")}
                </div>
            </div>
        </div>
    );
}

function MultiSlotField({ form, name, label, category, inventory, openSlot, onOpenSlot }: any) {
    const items = form.watch(name) || [];

    return (
        <FormItem>
            <div className="flex items-center justify-between mb-1">
                <FormLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</FormLabel>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[9px] uppercase tracking-wider text-primary hover:text-primary hover:bg-primary/10"
                    onClick={() => form.setValue(name, [...items, ""])}
                >
                    <Plus className="h-3 w-3 mr-1" /> Add {category === 'RAM' ? 'Stick' : 'Drive'}
                </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
                {items.map((_: any, index: number) => (
                    <FormField
                        key={`${name}-${index}`}
                        control={form.control}
                        name={`${name}.${index}` as any}
                        render={({ field }) => (
                            <div className="relative group">
                                <PartSelector
                                    category={`${category} ${index + 1}`}
                                    items={inventory[category] || []}
                                    value={field.value || ""}
                                    onChange={field.onChange}
                                    isOpen={openSlot === `${name}-${index}`}
                                    onOpenChange={(o) => onOpenSlot(o, `${name}-${index}`, category)}
                                />
                                {items.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const next = [...items];
                                            next.splice(index, 1);
                                            form.setValue(name, next);
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
    );
}
