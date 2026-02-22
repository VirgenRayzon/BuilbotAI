"use client";

import { useState, useTransition, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Loader2, Sparkles, Info, Zap } from "lucide-react";
import { getAiPrebuiltSuggestions } from "@/app/actions";
import type { Part } from "@/lib/types";

const formSchema = z.object({
  name: z.string().min(1, "System name is required."),
  tier: z.string().min(1, "Please select a tier."),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  imageUrl: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
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

export function AddPrebuiltDialog({ children, onAddPrebuilt, parts }: AddPrebuiltDialogProps) {
  const [open, setOpen] = useState(false);
  const [isAiPending, startAiTransition] = useTransition();
  const [aiResult, setAiResult] = useState<{wattage: string; summary: string} | null>(null);
  const { toast } = useToast();
  
  const inventory = useMemo(() => {
    return (parts || []).reduce((acc, part) => {
        const category = part.category;
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(part);
        return acc;
    }, {} as Record<Part['category'], Part[]>);
  }, [parts]);

  const componentCategories = Object.keys(inventory) as (keyof typeof inventory)[];

  const form = useForm<AddPrebuiltFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      tier: "",
      description: "",
      price: 0,
      imageUrl: "",
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

    if (Object.values(selectedComponents).every(c => !c)) {
        toast({
            variant: "destructive",
            title: "Select Components",
            description: "Please select at least one component to use the AI assistant.",
        });
        return;
    }

    startAiTransition(async () => {
        setAiResult(null);
        const result = await getAiPrebuiltSuggestions({
            components: selectedComponents,
            tier: form.getValues("tier") || undefined,
        });
        
        if (result && 'systemName' in result) {
            form.setValue("name", result.systemName, { shouldValidate: true });
            form.setValue("description", result.description, { shouldValidate: true });
            form.setValue("price", result.price, { shouldValidate: true });
            if (!form.getValues("imageUrl")) {
                const seed = result.systemName.replace(/\s+/g, '').toLowerCase();
                form.setValue("imageUrl", `https://picsum.photos/seed/${seed}/800/600`);
            }
            setAiResult({ wattage: result.estimatedWattage, summary: result.compatibilitySummary });
            toast({
                title: "AI Suggestions Applied",
                description: "The AI has filled in the details for your pre-built system.",
            });
        } else {
            toast({
              variant: "destructive",
              title: "AI Error",
              description: (result as any).error || "Could not fetch suggestions for this build.",
            });
        }
    });
  };

  const onSubmit = (values: AddPrebuiltFormSchema) => {
    onAddPrebuilt(values);
    toast({
      title: "Prebuilt System Added!",
      description: `${values.name} has been added.`,
    });
    form.reset();
    setAiResult(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
            form.reset();
            setAiResult(null);
        }
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Add New Prebuilt System</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="max-h-[70vh] p-1 pr-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>System Name</FormLabel>
                            <div className="flex gap-2">
                            <FormControl>
                                <Input placeholder="e.g., Ultimate Gamer V1" {...field} />
                            </FormControl>
                            <Button type="button" variant="outline" size="icon" onClick={handleAiAssist} disabled={isAiPending}>
                                {isAiPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
                            </Button>
                            </div>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="tier"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Tier</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a tier" />
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
                        )}
                    />
                    <div className="md:col-span-2">
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Brief description of the system..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Price (PHP)</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="e.g., 125000" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Image URL</FormLabel>
                            <FormControl>
                                <Input placeholder="https://..." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                
                <div className="space-y-4">
                    <FormLabel>Select Components</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6 pt-2">
                        {componentCategories.map(cat => (
                            <FormField
                                key={cat}
                                control={form.control}
                                name={cat.toLowerCase() as keyof AddPrebuiltFormSchema}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-muted-foreground font-semibold">{cat}</FormLabel>
                                         <Select onValueChange={field.onChange} value={field.value || ""}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={`Select ${cat}`} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {(inventory[cat] || []).map(item => (
                                                    <SelectItem key={item.id} value={item.name}>{item.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ))}
                    </div>
                </div>

                {isAiPending && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
                    <Loader2 className="animate-spin w-4 h-4" />
                    <span>AI is analyzing your build...</span>
                  </div>
                )}

                {aiResult && (
                    <div className="space-y-2 pt-4">
                        <Alert>
                            <Zap className="h-4 w-4" />
                            <AlertTitle className="font-headline">Estimated Wattage</AlertTitle>
                            <AlertDescription>{aiResult.wattage}</AlertDescription>
                        </Alert>
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle className="font-headline">Compatibility Check</AlertTitle>
                            <AlertDescription>{aiResult.summary}</AlertDescription>
                        </Alert>
                    </div>
                )}

              </div>
            </ScrollArea>
            <DialogFooter className="pt-6">
              <DialogClose asChild>
                <Button type="button" variant="ghost">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isAiPending}>Add Prebuilt System</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
