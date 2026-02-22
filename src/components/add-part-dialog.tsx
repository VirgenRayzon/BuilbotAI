
"use client";

import { useState, useTransition } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Sparkles, X } from "lucide-react";
import { getAiPartDetails } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "./ui/scroll-area";

const componentCategories = [
  "CPU", "GPU", "Motherboard", "RAM", "Storage", "PSU", "Case", "Cooler"
];

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
  imageUrl: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
  wattage: z.coerce.number().min(0, "Wattage must be a positive number.").optional(),
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

  const [specKey, setSpecKey] = useState("");
  const [specValue, setSpecValue] = useState("");

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
      specifications: [],
    },
  });

  const specifications = form.watch("specifications");

  const handleGetAiDetails = () => {
    const partName = form.getValues("partName");
    if (!partName) {
      form.setError("partName", { message: "Please enter a part name first." });
      return;
    }
    startAiTransition(async () => {
      const result = await getAiPartDetails({ partName });
      if (result) {
        form.setValue("partName", result.partName, { shouldValidate: true });
        form.setValue("category", result.category, { shouldValidate: true });
        form.setValue("brand", result.brand, { shouldValidate: true });
        form.setValue("price", result.price, { shouldValidate: true });
        form.setValue("wattage", result.wattage, { shouldValidate: true });
        form.setValue("specifications", result.specifications, { shouldValidate: true });
        if (!form.getValues('imageUrl')) {
            const seed = result.partName.replace(/\s+/g, '').toLowerCase();
            form.setValue('imageUrl', `https://picsum.photos/seed/${seed}/800/600`);
        }
      } else {
        toast({
          variant: "destructive",
          title: "AI Error",
          description: "Could not fetch details for this part.",
        });
      }
    });
  };

  const addSpecification = () => {
    if (specKey && specValue) {
      form.setValue("specifications", [...specifications, { key: specKey, value: specValue }]);
      setSpecKey("");
      setSpecValue("");
    }
  };

  const removeSpecification = (index: number) => {
    form.setValue("specifications", specifications.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: AddPartFormSchema) => {
    setIsSubmitting(true);
    try {
        await onAddPart(values);
        toast({
          title: "Part Added!",
          description: `${values.partName} has been added to the inventory.`,
        });
        form.reset();
        setOpen(false);
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error adding part",
            description: error.message || "An unexpected error occurred.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Add New Component</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="max-h-[70vh] -mx-6 px-6">
              <div className="space-y-6 py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                    <div className="md:col-span-2">
                        <FormField
                        control={form.control}
                        name="partName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Part Name</FormLabel>
                            <div className="flex gap-2">
                                <FormControl>
                                <Input placeholder="e.g., NVIDIA GeForce RTX 3060" {...field} />
                                </FormControl>
                                <Button type="button" variant="outline" size="icon" onClick={handleGetAiDetails} disabled={isAiPending}>
                                {isAiPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                </Button>
                            </div>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {componentCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="brand"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Brand</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., NVIDIA" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Price (PHP)</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="e.g., 17500" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="stockCount"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Stock Count</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="e.g., 10" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="wattage"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Wattage (W)</FormLabel>
                            <FormControl>
                            <Input
                                type="number"
                                placeholder="e.g., 170"
                                {...field}
                                value={field.value ?? ''}
                                onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                             />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <div className="md:col-span-2">
                        <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Image URL (Auto-populates if blank)</FormLabel>
                            <FormControl>
                                <Input placeholder="https://..." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                  <FormLabel>Specifications</FormLabel>
                  <div className="flex gap-2">
                      <Input
                      placeholder="Key (e.g., Socket)"
                      value={specKey}
                      onChange={(e) => setSpecKey(e.target.value)}
                      />
                      <Input
                      placeholder="Value (e.g., AM5)"
                      value={specValue}
                      onChange={(e) => setSpecValue(e.target.value)}
                      />
                      <Button type="button" size="icon" onClick={addSpecification}>
                      <Plus />
                      </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                      {specifications.map((spec, index) => (
                      <Badge key={index} variant="secondary" className="gap-1.5 pr-1.5">
                          <span className="font-normal">{spec.key}:</span>
                          <span>{spec.value}</span>
                          <button
                          type="button"
                          onClick={() => removeSpecification(index)}
                          className="rounded-full bg-background/50 hover:bg-background"
                          >
                          <X className="w-3 h-3" />
                          </button>
                      </Badge>
                      ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-6">
              <DialogClose asChild>
                <Button type="button" variant="ghost" disabled={isSubmitting}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Part
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
