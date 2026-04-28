"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatCurrency, formatToPHP, cn } from "@/lib/utils";
import type { Part } from "@/lib/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Sparkles, X, BrainCircuit, Bold, Italic, List, Heading1, Heading2, Code, Type } from "lucide-react";
import { getAiPartDetails } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "./ui/scroll-area";
import { ImageUpload } from "./image-upload";
import { SparkleButton } from "./ui/sparkle-button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { useMemo } from "react";
import Image from "next/image";

const componentCategories = [
  "CPU", "GPU", "Motherboard", "RAM", "Storage", "PSU", "Case", "Cooler",
  "Monitor", "Keyboard", "Mouse", "Headset",
];

const CATEGORY_SPECS: Record<string, { key: string; placeholder: string }[]> = {
  CPU: [
    { key: "Architecture", placeholder: "e.g., Zen 4" },
    { key: "Cores", placeholder: "e.g., 8" },
    { key: "Threads", placeholder: "e.g., 16" },
    { key: "Base Clock (GHz)", placeholder: "e.g., 4.5 GHz" },
    { key: "Boost Clock (GHz)", placeholder: "e.g., 5.4 GHz" },
    { key: "Socket", placeholder: "e.g., AM5" },
    { key: "TDP / Peak Power", placeholder: "e.g., 105 W" },
    { key: "L3 Cache", placeholder: "e.g., 32 MB" },
    { key: "Memory Support", placeholder: "e.g., DDR5" },
    { key: "Integrated Graphics", placeholder: "e.g., Yes / No" },
  ],
  GPU: [
    { key: "Chipset", placeholder: "e.g., RTX 4070" },
    { key: "VRAM Capacity", placeholder: "e.g., 12 GB" },
    { key: "Memory Type", placeholder: "e.g., GDDR6X" },
    { key: "TGP / Power Draw (W)", placeholder: "e.g., 200 W" },
    { key: "Length (Depth) (mm)", placeholder: "e.g., 336 mm" },
    { key: "Slot Thickness", placeholder: "e.g., 3" },
    { key: "Interface", placeholder: "e.g., PCIe 4.0 x16" },
    { key: "CUDA Cores", placeholder: "e.g., 5888 (NVIDIA) / Stream Processors" },
  ],
  Motherboard: [
    { key: "Chipset", placeholder: "e.g., B650" },
    { key: "Socket", placeholder: "e.g., AM5" },
    { key: "Form Factor", placeholder: "e.g., ATX" },
    { key: "RAM Type", placeholder: "e.g., DDR5" },
    { key: "SATA Slots", placeholder: "e.g., 6" },
    { key: "NVMe Slots", placeholder: "e.g., 3" },
    { key: "Memory Slots", placeholder: "e.g., 4" },
    { key: "Memory Type", placeholder: "e.g., DDR5" },
  ],
  RAM: [
    { key: "Generation", placeholder: "e.g., DDR5" },
    { key: "Capacity", placeholder: "e.g., 32 GB, 16 GB, 8 GB" },
    { key: "Speed", placeholder: "e.g., 6000 MT/s" },
    { key: "CAS Latency", placeholder: "e.g., CL30" },
    { key: "Stick Count", placeholder: "e.g., 1 or 2" },
  ],
  Storage: [
    { key: "Interface", placeholder: "e.g., NVMe M.2 / SATA" },
    { key: "Capacity", placeholder: "e.g., 1 TB" },
    { key: "Read Speed", placeholder: "e.g., 7000 MB/s" },
    { key: "Write Speed", placeholder: "e.g., 6500 MB/s" },
    { key: "TBW Rating", placeholder: "e.g., 600 TBW" },
    { key: "Form Factor", placeholder: "e.g., M.2 2280" },
    { key: "Type", placeholder: "e.g., NVMe SSD" },
  ],
  PSU: [
    { key: "Wattage (W)", placeholder: "e.g., 850 W" },
    { key: "Efficiency Rating", placeholder: "e.g., 80+ Gold" },
    { key: "Modularity", placeholder: "e.g., Fully Modular" },
    { key: "12VHPWR Support", placeholder: "e.g., Native ATX 3.0 / ATX 3.1" },
    { key: "Form Factor", placeholder: "e.g., ATX / SFX" },
    { key: "Width (mm)", placeholder: "150" },
    { key: "Depth (mm)", placeholder: "140" },
    { key: "Height (mm)", placeholder: "86" },
  ],
  Case: [
    { key: "Width (mm)", placeholder: "e.g., 210" },
    { key: "Depth (mm)", placeholder: "e.g., 450" },
    { key: "Height (mm)", placeholder: "e.g., 480" },
    { key: "Mobo Support", placeholder: "Motherboard compatibility" },
    { key: "Radiator Support (mm)", placeholder: "Radiator size support" },
    { key: "Type", placeholder: "Case form factor type" },
    { key: "Case Type", placeholder: "Fish Tank / High Air Flow" },
    { key: "Back-Connect Cutout", placeholder: "Yes / No" },
    { key: "PSU Form Factor", placeholder: "e.g., ATX / SFX" },
  ],
  Cooler: [
    { key: "TDP Rating", placeholder: "e.g., 250 W" },
    { key: "Socket Support", placeholder: "e.g., AM4, AM5, LGA1700" },
    { key: "Height", placeholder: "e.g., 165 mm" },
    { key: "Radiator Size", placeholder: "e.g., 360 mm" },
    { key: "Type", placeholder: "e.g., Air / AIO Liquid" },
  ],
  Monitor: [
    { key: "Screen Size", placeholder: "e.g., 27 inch" },
    { key: "Resolution", placeholder: "e.g., 2560 x 1440" },
    { key: "Refresh Rate", placeholder: "e.g., 144 Hz" },
    { key: "Panel Type", placeholder: "e.g., IPS / VA / OLED" },
    { key: "Response Time", placeholder: "e.g., 1ms GtG" },
  ],
  Keyboard: [
    { key: "Type", placeholder: "e.g., Mechanical / Membrane" },
    { key: "Switches", placeholder: "e.g., Cherry MX Red" },
    { key: "Layout", placeholder: "e.g., Full Size / TKL / 60%" },
    { key: "Backlighting", placeholder: "e.g., RGB / Single Color" },
  ],
  Mouse: [
    { key: "Sensor", placeholder: "e.g., Hero 25K" },
    { key: "DPI", placeholder: "e.g., 25600" },
    { key: "Connectivity", placeholder: "e.g., Wired / Wireless" },
    { key: "Weight", placeholder: "e.g., 63g" },
  ],
  Headset: [
    { key: "Type", placeholder: "e.g., Over-Ear / In-Ear" },
    { key: "Connectivity", placeholder: "e.g., Wired / Wireless / Bluetooth" },
    { key: "Driver Size", placeholder: "e.g., 50mm" },
    { key: "Microphone", placeholder: "e.g., Detachable / Built-in" },
  ],
};

const specificationSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
});

const formSchema = z.object({
  partName: z.string().min(1, "Part name is required."),
  category: z.string().min(1, "Please select a category."),
  brand: z.string().min(1, "Brand is required."),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  stockCount: z.coerce.number().int().min(0, "Stock must be a positive integer."),
  imageUrl: z.string().optional().or(z.literal("")),
  wattage: z.coerce.number().min(0).optional(),
  performanceScore: z.coerce.number().min(0).max(100).optional(),
  dimensions: z.object({
    width: z.coerce.number().min(0),
    height: z.coerce.number().min(0),
    depth: z.coerce.number().min(0),
  }).optional(),
  specifications: z.array(specificationSchema),
  description: z.string().optional(),
  packageType: z.enum(['TRAY', 'BOX']).optional().or(z.literal("")),
});

export type AddPartFormSchema = z.infer<typeof formSchema>;

interface AddPartDialogProps {
  children: React.ReactNode;
  onSave: (data: AddPartFormSchema) => Promise<void>;
  initialData?: Part;
  title?: string;
}

export function AddPartDialog({ children, onSave, initialData, title }: AddPartDialogProps) {
  const [open, setOpen] = useState(false);
  const [isAiPending, startAiTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const firestore = useFirestore();
  const settingsDocRef = useMemo(() => {
    if (firestore) return doc(firestore, 'siteSettings', 'main');
    return null;
  }, [firestore]);
  const { data: settings } = useDoc<any>(settingsDocRef);
  const isAiKillSwitch = settings?.isAiKillSwitch || false;

  const [customSpecKey, setCustomSpecKey] = useState("");
  const [customSpecValue, setCustomSpecValue] = useState("");

  const form = useForm<AddPartFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      partName: initialData?.name || "",
      category: initialData?.category || "",
      brand: initialData?.brand || "",
      price: initialData?.price || 0,
      stockCount: initialData?.stock || 0,
      imageUrl: initialData?.imageUrl || "",
      wattage: initialData?.wattage,
      performanceScore: initialData?.performanceScore || 50,
      dimensions: initialData?.dimensions || { width: 0, height: 0, depth: 0 },
      specifications: initialData?.specifications
        ? Object.entries(initialData.specifications).map(([key, value]) => ({ key, value: String(value) }))
        : [],
      description: initialData?.description || "",
      packageType: initialData?.packageType || "",
    },
  });

  // Re-reset form if initialData changes or dialog opens
  useEffect(() => {
    if (open && initialData) {
      form.reset({
        partName: initialData.name,
        category: initialData.category,
        brand: initialData.brand,
        price: initialData.price,
        stockCount: initialData.stock,
        imageUrl: initialData.imageUrl,
        wattage: initialData.wattage,
        performanceScore: initialData.performanceScore,
        dimensions: initialData.dimensions || { width: 0, height: 0, depth: 0 },
        specifications: Object.entries(initialData.specifications || {}).map(([key, value]) => ({ key, value: String(value) })),
        description: initialData.description || "",
        packageType: initialData.packageType || "",
      });
    } else if (open && !initialData) {
      form.reset({
        partName: "",
        category: "",
        brand: "",
        price: 0,
        stockCount: 0,
        imageUrl: "",
        wattage: undefined,
        performanceScore: 50,
        dimensions: { width: 0, height: 0, depth: 0 },
        specifications: [],
        description: "",
        packageType: "",
      });
    }
  }, [open, initialData, form]);

  const specifications = form.watch("specifications");
  const selectedCategory = form.watch("category");

  const getSpecValue = (key: string): string =>
    specifications.find((s) => s.key === key)?.value ?? "";

  const setSpecValue = (key: string, value: string) => {
    const current = form.getValues("specifications");
    const idx = current.findIndex((s) => s.key === key);
    let updated = [...current];

    if (value === "") {
      updated = current.filter((s) => s.key !== key);
    } else if (idx >= 0) {
      updated[idx] = { key, value };
    } else {
      updated.push({ key, value });
    }

    // Auto-populate PSU dimensions
    if (selectedCategory === "PSU" && key === "Form Factor") {
      const val = value.toLowerCase();
      if (val === "atx") {
        updated = updateOrAddSpec(updated, "Width (mm)", "150 mm");
        updated = updateOrAddSpec(updated, "Depth (mm)", "140 mm");
        updated = updateOrAddSpec(updated, "Height (mm)", "86 mm");
        form.setValue("dimensions", { width: 150, depth: 140, height: 86 });
      } else if (val === "sfx") {
        updated = updateOrAddSpec(updated, "Width (mm)", "125 mm");
        updated = updateOrAddSpec(updated, "Depth (mm)", "100 mm");
        updated = updateOrAddSpec(updated, "Height (mm)", "64 mm");
        form.setValue("dimensions", { width: 125, depth: 100, height: 64 });
      }
    }

    form.setValue("specifications", updated);
  };

  const updateOrAddSpec = (specs: { key: string; value: string }[], key: string, value: string) => {
    const existingIdx = specs.findIndex((s) => s.key === key);
    if (existingIdx >= 0) {
      const copy = [...specs];
      copy[existingIdx] = { key, value };
      return copy;
    }
    return [...specs, { key, value }];
  };

  const handleCategoryChange = (newCategory: string) => {
    form.setValue("category", newCategory, { shouldValidate: true });
    const categoryKeys = (CATEGORY_SPECS[newCategory] || []).map((s) => s.key);
    const current = form.getValues("specifications");
    form.setValue("specifications", current.filter((s) => categoryKeys.includes(s.key)));
  };

  const handleGetAiDetails = () => {
    if (isAiKillSwitch) {
      toast({
        title: "AI Disabled",
        description: "AI is disable by Administrator.",
        variant: "destructive"
      });
      return;
    }

    const partName = form.getValues("partName");
    if (!partName) {
      form.setError("partName", { message: "Please enter a part name first." });
      return;
    }
    startAiTransition(async () => {
      const result = (await getAiPartDetails({ partName })) as any;
      if (result && !("error" in result)) {
        form.setValue("partName", result.partName, { shouldValidate: true });
        form.setValue("category", result.category, { shouldValidate: true });
        form.setValue("brand", result.brand, { shouldValidate: true });
        if (result.packageType) {
          form.setValue("packageType", result.packageType, { shouldValidate: true });
        }
        if (result.description && !form.getValues("description")) {
          form.setValue("description", result.description, { shouldValidate: true });
        }
        form.setValue("price", result.price, { shouldValidate: true });
        form.setValue("wattage", result.wattage, { shouldValidate: true });
        form.setValue(
          "performanceScore",
          result.performanceScore || (result.performanceTier ? result.performanceTier * 10 : 50),
          { shouldValidate: true }
        );
        form.setValue("dimensions", result.dimensions || { width: 0, height: 0, depth: 0 }, {
          shouldValidate: true,
        });

        // Robust merging of specifications to ensure they appear in the UI fields
        const finalSpecs = [...(form.getValues("specifications") || [])];
        const updateSpec = (k: string, v: any) => {
          if (v === undefined || v === null || v === "") return;
          let valStr = String(v);

          // Normalize values for specific dropdowns (e.g. Form Factor, Case Type, Cutout)
          if (k === "Form Factor" && (result.category === "Motherboard" || result.category === "PSU")) {
            const lower = valStr.toLowerCase();
            if (lower.includes("eatx") || lower.includes("e-atx")) valStr = "eatx";
            else if (lower.includes("matx") || lower.includes("m-atx") || lower.includes("micro")) valStr = "matx";
            else if (lower.includes("itx") || lower.includes("mini")) valStr = "itx";
            else if (lower.includes("atx")) valStr = "atx";
          } else if (result.category === "Case") {
            const lower = valStr.toLowerCase();
            if (k === "Type") {
              if (lower.includes("full")) valStr = "full tower";
              else if (lower.includes("mid")) valStr = "mid tower";
              else if (lower.includes("mini")) valStr = "mini tower";
              else if (lower.includes("sff") || lower.includes("small")) valStr = "sff";
            } else if (k === "Back-Connect Cutout") {
              valStr = lower.includes("yes") ? "yes" : "no";
            } else if (k === "Mobo Support") {
              valStr = valStr.split(",").map(s => s.trim().toLowerCase()).filter(s => ["eatx", "atx", "matx", "itx"].includes(s)).join(",");
            } else if (k === "Radiator Support (mm)") {
              valStr = valStr.split(",").map(s => s.trim()).filter(s => ["120", "140", "240", "280", "360", "480"].includes(s)).join(",");
            } else if (k === "Slot Thickness") {
              const num = valStr.match(/\d+/)?.[0];
              if (num) valStr = `${num} Slot`;
            }
          } else if (result.category === "Storage" && k === "Type") {
            const lower = valStr.toLowerCase();
            if (lower.includes("nvme")) valStr = "NVME";
            else if (lower.includes("sata")) valStr = "SATA";
          }

          const i = finalSpecs.findIndex((s) => s.key === k);
          if (i >= 0) finalSpecs[i] = { key: k, value: valStr };
          else finalSpecs.push({ key: k, value: valStr });
        };

        // 1. Process explicit specifications array from AI (primary source)
        if (result.specifications?.length > 0) {
          result.specifications.forEach((aiSpec: { key: string; value: string }) => {
            updateSpec(aiSpec.key, aiSpec.value);
          });
        }

        // 2. Mirror top-level fields into category-specific specs if missing
        if (result.wattage) {
          if (result.category === "CPU") updateSpec("TDP / Peak Power", `${result.wattage} W`);
          else if (result.category === "GPU") updateSpec("TGP / Power Draw (W)", `${result.wattage} W`);
          else if (result.category === "PSU") updateSpec("Wattage (W)", `${result.wattage} W`);
          else if (result.category === "Cooler") updateSpec("TDP Rating", `${result.wattage} W`);
        }

        if (result.dimensions) {
          if (result.category === "GPU") updateSpec("Length (Depth) (mm)", `${result.dimensions.depth} mm`);
          else if (result.category === "Case") {
            updateSpec("Width (mm)", `${result.dimensions.width} mm`);
            updateSpec("Depth (mm)", `${result.dimensions.depth} mm`);
            updateSpec("Height (mm)", `${result.dimensions.height} mm`);
            updateSpec("Max GPU Length", `${result.dimensions.depth} mm`);
          }
        }

        form.setValue("specifications", finalSpecs, { shouldValidate: true });
      } else {
        toast({
          variant: "destructive",
          title: "AI Error",
          description: (result as any)?.error || "Could not fetch details for this part.",
        });
      }
    });
  };

  const addCustomSpec = () => {
    if (customSpecKey && customSpecValue) {
      setSpecValue(customSpecKey, customSpecValue);
      setCustomSpecKey("");
      setCustomSpecValue("");
    }
  };

  const categorySpecKeys = (CATEGORY_SPECS[selectedCategory] || []).map((s) => s.key);
  const customSpecs = specifications.filter((s) => !categorySpecKeys.includes(s.key));

  const removeSpec = (key: string) => {
    form.setValue("specifications", specifications.filter((s) => s.key !== key));
  };

  const onSubmit = async (values: AddPartFormSchema) => {
    setIsSubmitting(true);
    try {
      await onSave(values);
      toast({ title: initialData ? "Part Updated!" : "Part Added!", description: `${values.partName} has been ${initialData ? 'updated' : 'added to'} the inventory.` });
      if (!initialData) form.reset();
      setOpen(false);

    } catch (error: any) {
      toast({ variant: "destructive", title: initialData ? "Error updating part" : "Error adding part", description: error.message || "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && isAiPending) return;
        setOpen(isOpen);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[70vw] p-0 gap-0 overflow-hidden border-primary/20 bg-background/95 backdrop-blur-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] rounded-3xl [&>button.absolute]:hidden">

        {/* ── Header ── */}
        <DialogHeader className="px-8 pt-8 pb-6 border-b border-border/40 bg-muted/20 flex-row items-center gap-4 space-y-0">
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-inner">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <DialogTitle className="font-headline text-2xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              {title || (initialData ? "Edit Component" : "Add New Component")}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground font-medium mt-1">
              {initialData ? "Refine component details and performance metrics." : "Configure new inventory with AI-assisted specification pre-filling."}
            </DialogDescription>
          </div>
          <div className="ml-auto">
            <SparkleButton
              type="button"
              onClick={handleGetAiDetails}
              isLoading={isAiPending}
              className="h-11 px-6 shadow-lg transition-all duration-300"
            >
              AI Autofill
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
                  <span className="text-[10px] text-primary/60 font-medium">Researching real-world specs, pricing, and compatibility metrics...</span>
                </div>
              </div>
              <Badge variant="outline" className="animate-pulse bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-bold px-3 py-1">
                Processing
              </Badge>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">

            {/* ── Scrollable Body ── */}
            <ScrollArea className="h-[70vh]">
              <div className="px-10 py-8 space-y-10">

                {/* Section: Identity */}
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

                  {/* Right Column: Fields */}
                  <div className="col-span-12 md:col-span-8 space-y-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70 mb-4 flex items-center gap-3">
                      <span className="inline-block w-4 h-px bg-primary/40" />
                      Core Details
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Full width row */}
                      <div className="col-span-2">
                        <FormField control={form.control} name="partName" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Part Name</FormLabel>
                            <FormControl>
                              <Input className="bg-muted/30 border-border/40 h-10 rounded-xl focus:bg-background transition-colors shadow-sm" placeholder="e.g., AMD Ryzen 7 7700X" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <FormField control={form.control} name="category" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Category</FormLabel>
                          <Select onValueChange={handleCategoryChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-muted/30 border-border/40 h-10 rounded-xl">
                                <SelectValue placeholder="Select…" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl">
                              {componentCategories.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="brand" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Brand</FormLabel>
                          <FormControl>
                            <Input className="bg-muted/30 border-border/40 h-10 rounded-xl" placeholder="e.g., AMD" {...field} />
                          </FormControl>
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
                              placeholder="e.g., 17500"
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

                      <FormField control={form.control} name="stockCount" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Inventory Stock</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="bg-muted/30 border-border/40 h-10 rounded-xl font-mono"
                              placeholder="e.g., 10"
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

                      <FormField control={form.control} name="performanceScore" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Performance Rank (0–100)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="bg-muted/30 border-border/40 h-10 rounded-xl"
                              placeholder="e.g., 75"
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

                      {selectedCategory === "CPU" && (
                        <FormField control={form.control} name="packageType" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-1.5">
                              Package
                              <Badge variant="outline" className="text-[8px] py-0 px-1 border-primary/30 text-primary uppercase font-bold tracking-tight">CPU</Badge>
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-muted/30 border-border/40 h-10 rounded-xl">
                                  <SelectValue placeholder="BOX / TRAY" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="BOX">BOX (Retail)</SelectItem>
                                <SelectItem value="TRAY">TRAY (OEM)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      )}
                    </div>

                    {/* Description — Part of Right Column */}
                    <div className="pt-4">
                      <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between mb-3">
                            <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70 flex items-center gap-2">
                              <Type className="h-3 w-3" /> Description
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
                              placeholder="Supports Markdown... - High-performance architecture - Real-world verified metrics"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>

                </div>


                {/* Section: Category Specs */}
                {selectedCategory && CATEGORY_SPECS[selectedCategory] && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70 mb-3 flex items-center gap-2">
                      <span className="inline-block w-5 h-px bg-primary/40" />
                      <Sparkles className="h-3 w-3 text-primary" />
                      {selectedCategory} Specifications
                      <span className="inline-block flex-1 h-px bg-primary/10" />
                    </p>
                    <div className="grid grid-cols-3 gap-3 p-4 rounded-xl border border-primary/10 bg-primary/5">
                      {CATEGORY_SPECS[selectedCategory].map(({ key, placeholder }) => (
                        <div key={key} className={
                          (selectedCategory === "Case" && (key === "Mobo Support" || key === "Radiator Support (mm)"))
                            ? "col-span-3 space-y-2 py-2"
                            : "space-y-1.5"
                        }>
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-1">{key}</label>

                          {/* Case: Mobo Support (Checkboxes) */}
                          {selectedCategory === "Case" && key === "Mobo Support" ? (
                            <div className="flex flex-wrap gap-4 p-3 rounded-xl border border-primary/20 bg-primary/5 shadow-inner">
                              {["eatx", "atx", "matx", "itx"].map((val) => {
                                const checked = getSpecValue(key).split(",").filter(Boolean).includes(val);
                                return (
                                  <div key={val} className="flex items-center gap-2 group cursor-pointer">
                                    <Checkbox
                                      id={`mobo-${val}`}
                                      checked={checked}
                                      onCheckedChange={(checked) => {
                                        const current = getSpecValue(key).split(",").filter(Boolean);
                                        if (checked) setSpecValue(key, [...current, val].join(","));
                                        else setSpecValue(key, current.filter(v => v !== val).join(","));
                                      }}
                                      className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                    />
                                    <Label htmlFor={`mobo-${val}`} className="text-[10px] font-bold uppercase tracking-wider cursor-pointer group-hover:text-primary transition-colors">
                                      {val}
                                    </Label>
                                  </div>
                                );
                              })}
                            </div>
                          ) : /* Case: Radiator Support (Checkboxes) */
                            selectedCategory === "Case" && key === "Radiator Support (mm)" ? (
                              <div className="flex flex-wrap gap-4 p-3 rounded-xl border border-primary/20 bg-primary/5 shadow-inner">
                                {["120", "140", "240", "280", "360", "480"].map((val) => {
                                  const checked = getSpecValue(key).split(",").filter(Boolean).includes(val);
                                  return (
                                    <div key={val} className="flex items-center gap-2 group cursor-pointer">
                                      <Checkbox
                                        id={`rad-${val}`}
                                        checked={checked}
                                        onCheckedChange={(checked) => {
                                          const current = getSpecValue(key).split(",").filter(Boolean);
                                          if (checked) setSpecValue(key, [...current, val].join(","));
                                          else setSpecValue(key, current.filter(v => v !== val).join(","));
                                        }}
                                        className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                      />
                                      <Label htmlFor={`rad-${val}`} className="text-[10px] font-bold uppercase tracking-wider cursor-pointer group-hover:text-primary transition-colors">
                                        {val}mm
                                      </Label>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : /* Case/Mobo: Dropdowns */
                              ((selectedCategory === "Case" && (key === "Type" || key === "Case Type" || key === "Back-Connect Cutout" || key === "PSU Form Factor")) ||
                                (selectedCategory === "PSU" && key === "Form Factor") ||
                                (selectedCategory === "Motherboard" && key === "Form Factor") ||
                                (selectedCategory === "Storage" && key === "Type")) ? (
                                <Select
                                  value={getSpecValue(key)}
                                  onValueChange={(v) => setSpecValue(key, v)}
                                >
                                  <SelectTrigger className="h-8 text-sm bg-background/60 border-border/50 focus:border-primary/50">
                                    <SelectValue placeholder="Select..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {key === "Back-Connect Cutout" ? (
                                      ["yes", "no"].map(v => <SelectItem key={v} value={v}>{v.toUpperCase()}</SelectItem>)
                                    ) : key === "Case Type" ? (
                                      ["fish tank", "high air flow"].map(v => <SelectItem key={v} value={v}>{v.toUpperCase()}</SelectItem>)
                                    ) : key === "Type" && selectedCategory === "Case" ? (
                                      ["full tower", "mid tower", "mini tower", "sff"].map(v => <SelectItem key={v} value={v}>{v.toUpperCase()}</SelectItem>)
                                    ) : key === "Type" && selectedCategory === "Storage" ? (
                                      ["NVME", "SATA"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)
                                    ) : (key === "Form Factor" && selectedCategory === "PSU") || key === "PSU Form Factor" ? (
                                      ["atx", "sfx"].map(v => <SelectItem key={v} value={v}>{v.toUpperCase()}</SelectItem>)
                                    ) : (
                                      ["eatx", "atx", "matx", "itx"].map(v => <SelectItem key={v} value={v}>{v.toUpperCase()}</SelectItem>)
                                    )}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  placeholder={placeholder}
                                  readOnly={selectedCategory === "PSU" && (key === "Width (mm)" || key === "Depth (mm)" || key === "Height (mm)")}
                                  value={(() => {
                                    const currentVal = getSpecValue(key);
                                    if (key === "Slot Thickness") return currentVal.replace(/\s*slot\s*/gi, "");
                                    if (key.includes("(mm)") || key === "Height" || key === "Radiator Size" || key === "Driver Size") return currentVal.replace(/\s*mm\s*/gi, "");
                                    if (key.includes("(W)") || key.includes("Power") || key === "TDP Rating") return currentVal.replace(/\s*w\s*/gi, "");
                                    if (key.includes("(GHz)") || key === "Screen Size" || key.includes("Speed") || key === "L3 Cache" || key === "TBW Rating" || key === "DPI" || key === "Refresh Rate" || key === "Weight") {
                                      return currentVal.replace(/[^\d.]/g, '');
                                    }
                                    if (key === "Cores" || key === "Threads" || key === "CUDA Cores") return currentVal.replace(/\D/g, '');
                                    return currentVal;
                                  })()}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (key === "Slot Thickness") {
                                      setSpecValue(key, val ? `${val} Slot` : "");
                                    } else if (key.includes("(mm)") || key === "Height" || key === "Radiator Size" || key === "Driver Size") {
                                      const intVal = val.replace(/\D/g, '').slice(0, 3);
                                      setSpecValue(key, intVal ? `${intVal} mm` : "");
                                    } else if (key.includes("(W)") || key.includes("Power") || key === "TDP Rating") {
                                      const intVal = val.replace(/\D/g, '');
                                      setSpecValue(key, intVal ? `${intVal} W` : "");
                                    } else if (key.includes("(GHz)")) {
                                      const floatVal = val.replace(/[^\d.]/g, '');
                                      setSpecValue(key, floatVal ? `${floatVal} GHz` : "");
                                    } else if (key === "Screen Size") {
                                      const floatVal = val.replace(/[^\d.]/g, '');
                                      setSpecValue(key, floatVal ? `${floatVal} inch` : "");
                                    } else if (key === "Read Speed" || key === "Write Speed") {
                                      const intVal = val.replace(/\D/g, '');
                                      setSpecValue(key, intVal ? `${intVal} MB/s` : "");
                                    } else if (key === "L3 Cache") {
                                      const intVal = val.replace(/\D/g, '');
                                      setSpecValue(key, intVal ? `${intVal} MB` : "");
                                    } else if (key === "TBW Rating") {
                                      const intVal = val.replace(/\D/g, '');
                                      setSpecValue(key, intVal ? `${intVal} TBW` : "");
                                    } else if (key === "Refresh Rate") {
                                      const intVal = val.replace(/\D/g, '');
                                      setSpecValue(key, intVal ? `${intVal} Hz` : "");
                                    } else if (key === "Weight") {
                                      const intVal = val.replace(/\D/g, '');
                                      setSpecValue(key, intVal ? `${intVal}g` : "");
                                    } else if (key === "DPI") {
                                      const intVal = val.replace(/\D/g, '');
                                      setSpecValue(key, intVal);
                                    } else if (key === "Cores" || key === "Threads" || key === "CUDA Cores") {
                                      const intVal = val.replace(/\D/g, '');
                                      setSpecValue(key, intVal);
                                    } else {
                                      setSpecValue(key, val);
                                    }
                                  }}
                                  type={
                                    key.includes("Slots") ||
                                      key.includes("Count") ||
                                      key === "Slot Thickness" ||
                                      key.includes("(mm)") ||
                                      key === "Height" ||
                                      key === "Radiator Size" ||
                                      key === "Driver Size" ||
                                      key.includes("(W)") ||
                                      key.includes("Power") ||
                                      key === "TDP Rating" ||
                                      key === "Cores" ||
                                      key === "Threads" ||
                                      key === "CUDA Cores" ||
                                      key === "DPI" ||
                                      key === "Refresh Rate" ||
                                      key === "Read Speed" ||
                                      key === "Write Speed" ||
                                      key === "L3 Cache" ||
                                      key === "TBW Rating" ||
                                      key.includes("(GHz)") ||
                                      key === "Screen Size"
                                      ? "number" : "text"
                                  }
                                  step="any"
                                  className={cn(
                                    "h-8 text-sm bg-background/60 border-border/50 focus:border-primary/50",
                                    selectedCategory === "PSU" && (key === "Width (mm)" || key === "Depth (mm)" || key === "Height (mm)") && "bg-muted/40 cursor-not-allowed opacity-80"
                                  )}
                                />
                              )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                    {/* Section: Custom Specs */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mb-3 flex items-center gap-2">
                        <span className="inline-block w-5 h-px bg-border" />
                        Custom Specs
                        <span className="inline-block flex-1 h-px bg-border/40" />
                      </p>
                      <div className="flex gap-2 mb-3">
                        <Input
                          placeholder="Key (e.g., PCIe Version)"
                          value={customSpecKey}
                          onChange={(e) => setCustomSpecKey(e.target.value)}
                          className="h-8 text-sm bg-muted/40 border-border/60"
                        />
                        <Input
                          placeholder="Value (e.g., 5.0 x16)"
                          value={customSpecValue}
                          onChange={(e) => setCustomSpecValue(e.target.value)}
                          className="h-8 text-sm bg-muted/40 border-border/60"
                        />
                        <Button
                          type="button" size="icon"
                          className="h-8 w-8 shrink-0 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
                          onClick={addCustomSpec}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {customSpecs.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {customSpecs.map((spec) => (
                            <Badge key={spec.key} variant="secondary" className="gap-1.5 pr-1 text-xs bg-secondary/60 border border-border/40">
                              <span className="text-muted-foreground font-normal">{spec.key}:</span>
                              <span className="font-medium">{spec.value}</span>
                              <button type="button" onClick={() => removeSpec(spec.key)} className="ml-1 hover:text-destructive transition-colors">
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
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
                disabled={isSubmitting}
                onClick={form.handleSubmit(onSubmit)}
                className="rounded-xl px-10 font-bold uppercase tracking-[0.15em] text-xs h-12 shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all duration-200"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Update Component" : "Save to Inventory"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog >
  );
}
