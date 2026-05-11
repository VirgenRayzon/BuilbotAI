"use client";

import { useTransition, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { getAiPrebuiltSuggestions } from "@/app/actions";
import type { Part, PrebuiltSystem } from "@/lib/types";

export const prebuiltFormSchema = z.object({
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

export type PrebuiltBuilderAddFormSchema = z.infer<typeof prebuiltFormSchema>;

interface UsePrebuiltFormParams {
    parts: Part[];
    initialData?: PrebuiltSystem;
    onSave: (data: PrebuiltBuilderAddFormSchema) => void;
    onClose: () => void;
}

export function usePrebuiltForm({ parts, initialData, onSave, onClose }: UsePrebuiltFormParams) {
    const [isAiPending, startAiTransition] = useTransition();
    const { toast } = useToast();
    const firestore = useFirestore();

    const settingsDocRef = useMemo(() => {
        if (firestore) return doc(firestore, 'siteSettings', 'main');
        return null;
    }, [firestore]);
    const { data: settings } = useDoc<any>(settingsDocRef);
    const isAiKillSwitch = settings?.isAiKillSwitch || false;

    const form = useForm<PrebuiltBuilderAddFormSchema>({
        resolver: zodResolver(prebuiltFormSchema),
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

    useEffect(() => {
        if (initialData) {
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
        } else {
            form.reset({
                name: "", tier: "", description: "", price: 0, imageUrl: "",
                cpu: "", gpu: "", motherboard: "", ram: [], storage: [], psu: "", case: "", cooler: "",
            });
        }
    }, [initialData, form]);

    const handleAiAssist = () => {
        if (isAiKillSwitch) {
            toast({
                title: "AI Disabled",
                description: "AI is disabled by Administrator.",
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
                description: "The AI needs at least one selected component name to generate an identity."
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

                    if (fieldsUpdated.length > 0) {
                        toast({ title: "AI Suggestions Applied", description: `Successfully filled: ${fieldsUpdated.join(", ")}.` });
                    } else {
                        toast({ title: "Assist Complete", description: "Identity fields were already filled." });
                    }
                }
            } catch (err: any) {
                toast({
                    variant: "destructive",
                    title: "AI Assist Failed",
                    description: err.message || "An unexpected error occurred."
                });
            }
        });
    };

    const onSubmit = (values: PrebuiltBuilderAddFormSchema) => {
        onSave(values);
        toast({ title: initialData ? "Prebuilt Updated!" : "Prebuilt System Added!", description: `${values.name} has been processed.` });
        if (!initialData) form.reset();
        onClose();

        setTimeout(() => {
            window.location.reload();
        }, 1000);
    };

    return {
        form,
        isAiPending,
        handleAiAssist,
        onSubmit,
        isAiKillSwitch
    };
}
