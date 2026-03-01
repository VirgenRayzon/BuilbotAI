"use client";

import { useState, useTransition } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Sparkles, X, BrainCircuit } from "lucide-react";
import { getAiPartDetails } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "./ui/scroll-area";

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
    { key: "Slot Thickness", placeholder: "e.g., 2.5-slot" },
    { key: "Interface", placeholder: "e.g., PCIe 4.0 x16" },
    { key: "Bus Width", placeholder: "e.g., 192-bit" },
    { key: "CUDA Cores", placeholder: "e.g., 5888 (NVIDIA) / Stream Processors" },
  ],
  Motherboard: [
    { key: "Chipset", placeholder: "e.g., B650" },
    { key: "Socket", placeholder: "e.g., AM5" },
    { key: "Form Factor", placeholder: "e.g., ATX" },
    { key: "RAM Type", placeholder: "e.g., DDR5" },
    { key: "M.2 Slots", placeholder: "e.g., 3x Gen4" },
    { key: "Back-Connect Support", placeholder: "e.g., Yes / No (BTF, Project Stealth)" },
    { key: "Connectivity", placeholder: "e.g., Wi-Fi 6E, 2.5Gb Ethernet" },
    { key: "Memory Slots", placeholder: "e.g., 4" },
    { key: "Memory Type", placeholder: "e.g., DDR5" },
  ],
  RAM: [
    { key: "Generation", placeholder: "e.g., DDR5" },
    { key: "Capacity", placeholder: "e.g., 32 GB (2×16 GB)" },
    { key: "Speed", placeholder: "e.g., 6000 MT/s" },
    { key: "CAS Latency", placeholder: "e.g., CL30" },
    { key: "Height", placeholder: "e.g., 44 mm" },
    { key: "Type", placeholder: "e.g., DDR5" },
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
  ],
  Case: [
    { key: "Max GPU Length", placeholder: "e.g., 400 mm" },
    { key: "Max Cooler Height", placeholder: "e.g., 170 mm" },
    { key: "Max Radiator Size (mm)", placeholder: "e.g., 360" },
    { key: "Mobo Support", placeholder: "e.g., ATX, M-ATX, ITX" },
    { key: "Radiator Support", placeholder: "e.g., 360mm Top, 240mm Front" },
    { key: "Back-Connect Cutout", placeholder: "e.g., Yes / No" },
    { key: "Type", placeholder: "e.g., ATX Mid Tower" },
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
  imageUrl: z.string().url("Must be a valid URL.").optional().or(z.literal("")),
  wattage: z.coerce.number().min(0).optional(),
  performanceScore: z.coerce.number().min(0).max(100).optional(),
  dimensions: z.object({
    width: z.coerce.number().min(0),
    height: z.coerce.number().min(0),
    depth: z.coerce.number().min(0),
  }).optional(),
  specifications: z.array(specificationSchema),
});

export type AddPartFormSchema = z.infer<typeof formSchema>;

interface AddPartDialogProps {
  children: React.ReactNode;
  onAddPart: (data: AddPartFormSchema) => Promise<void>;
}

export function AddPartDialog({ children, onAddPart }: AddPartDialogProps) {
  const [open, setOpen] = useState(false);
  const [isAiPending, startAiTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [customSpecKey, setCustomSpecKey] = useState("");
  const [customSpecValue, setCustomSpecValue] = useState("");

  const form = useForm<AddPartFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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
    },
  });

  const specifications = form.watch("specifications");
  const selectedCategory = form.watch("category");

  const getSpecValue = (key: string): string =>
    specifications.find((s) => s.key === key)?.value ?? "";

  const setSpecValue = (key: string, value: string) => {
    const current = form.getValues("specifications");
    const idx = current.findIndex((s) => s.key === key);
    if (value === "") {
      form.setValue("specifications", current.filter((s) => s.key !== key));
    } else if (idx >= 0) {
      const updated = [...current];
      updated[idx] = { key, value };
      form.setValue("specifications", updated);
    } else {
      form.setValue("specifications", [...current, { key, value }]);
    }
  };

  const handleCategoryChange = (newCategory: string) => {
    form.setValue("category", newCategory, { shouldValidate: true });
    const categoryKeys = (CATEGORY_SPECS[newCategory] || []).map((s) => s.key);
    const current = form.getValues("specifications");
    form.setValue("specifications", current.filter((s) => categoryKeys.includes(s.key)));
  };

  const handleGetAiDetails = () => {
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
        if (result.specifications?.length > 0) {
          const current = form.getValues("specifications");
          const merged = [...current];
          result.specifications.forEach((aiSpec: { key: string; value: string }) => {
            const i = merged.findIndex((s) => s.key === aiSpec.key);
            if (i >= 0) merged[i] = aiSpec;
            else merged.push(aiSpec);
          });
          form.setValue("specifications", merged, { shouldValidate: true });
        }
        if (!form.getValues("imageUrl")) {
          const seed = result.partName.replace(/\s+/g, "").toLowerCase();
          form.setValue("imageUrl", `https://picsum.photos/seed/${seed}/800/600`, {
            shouldValidate: true,
          });
        }
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
      await onAddPart(values);
      toast({ title: "Part Added!", description: `${values.partName} has been added to the inventory.` });
      form.reset();
      setOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error adding part", description: error.message || "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl p-0 gap-0 overflow-hidden border-primary/20 bg-background shadow-2xl [&>button.absolute]:hidden">

        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-4 border-b border-border/60 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-headline text-xl font-bold tracking-tight">Add New Component</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Fill in the details or use Buildbot AI to autofill.</p>
            </div>
            <div className="ml-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGetAiDetails}
                disabled={isAiPending}
                className="border-primary/30 hover:border-primary hover:bg-primary/10 text-primary gap-1.5"
              >
                {isAiPending ? <Loader2 className="animate-spin h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                AI Autofill
              </Button>
            </div>
          </div>
          {isAiPending && (
            <div className="flex items-center gap-2 mt-3 text-xs text-primary animate-pulse">
              <BrainCircuit className="h-3.5 w-3.5 shrink-0" />
              <span>Buildbot is Prefilling the Specifications…</span>
            </div>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">

            {/* ── Scrollable Body ── */}
            <ScrollArea className="h-[62vh]">
              <div className="px-6 py-5 space-y-7">

                {/* Section: Identity */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70 mb-3 flex items-center gap-2">
                    <span className="inline-block w-5 h-px bg-primary/40" />
                    Component Identity
                    <span className="inline-block flex-1 h-px bg-primary/10" />
                  </p>
                  <div className="grid grid-cols-3 gap-4">

                    {/* Part Name — spans all 3 cols */}
                    <div className="col-span-3">
                      <FormField control={form.control} name="partName" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Part Name</FormLabel>
                          <FormControl>
                            <Input className="bg-muted/40 border-border/60 h-9" placeholder="e.g., AMD Ryzen 7 7700X" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <FormField control={form.control} name="category" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Category</FormLabel>
                        <Select onValueChange={handleCategoryChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-muted/40 border-border/60 h-9">
                              <SelectValue placeholder="Select…" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
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
                        <FormLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Brand</FormLabel>
                        <FormControl>
                          <Input className="bg-muted/40 border-border/60 h-9" placeholder="e.g., AMD" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="performanceScore" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Perf. Score (0–100)</FormLabel>
                        <FormControl>
                          <Input type="number" className="bg-muted/40 border-border/60 h-9" placeholder="e.g., 75" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="price" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Price (PHP ₱)</FormLabel>
                        <FormControl>
                          <Input type="number" className="bg-muted/40 border-border/60 h-9" placeholder="e.g., 17500" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="stockCount" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Stock Count</FormLabel>
                        <FormControl>
                          <Input type="number" className="bg-muted/40 border-border/60 h-9" placeholder="e.g., 10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Image URL — spans all 3 cols */}
                    <div className="col-span-3">
                      <FormField control={form.control} name="imageUrl" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Image URL <span className="normal-case font-normal text-muted-foreground/50">(auto-fills if blank)</span>
                          </FormLabel>
                          <FormControl>
                            <Input className="bg-muted/40 border-border/60 h-9" placeholder="https://..." {...field} />
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
                        <div key={key} className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{key}</label>
                          <Input
                            placeholder={placeholder}
                            value={getSpecValue(key)}
                            onChange={(e) => setSpecValue(key, e.target.value)}
                            className="h-8 text-sm bg-background/60 border-border/50 focus:border-primary/50"
                          />
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
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/60 bg-muted/20">
              <p className="text-xs text-muted-foreground">
                {selectedCategory ? (
                  <><span className="font-semibold text-primary">{CATEGORY_SPECS[selectedCategory]?.length ?? 0}</span> spec fields for <span className="font-semibold">{selectedCategory}</span></>
                ) : (
                  "Select a category to see spec fields."
                )}
              </p>
              <div className="flex gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="ghost" size="sm" disabled={isSubmitting}>Cancel</Button>
                </DialogClose>
                <Button type="submit" size="sm" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 font-headline tracking-wide px-6">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Part
                </Button>
              </div>
            </div>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
