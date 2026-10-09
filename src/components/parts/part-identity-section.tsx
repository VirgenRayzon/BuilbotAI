"use client";

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge, Paper, ActionIcon, Group, Tooltip } from "@mantine/core";
import { Bold, Italic, List, Heading1, Heading2, Code, Type } from "lucide-react";
import { MultiImageUpload } from "./multi-image-upload";
import { componentCategories } from "@/lib/constants/category-specs";
import { UseFormReturn } from "react-hook-form";
import { AddPartFormSchema } from "@/hooks/use-part-form";
import { cn } from "@/lib/utils";

interface PartIdentitySectionProps {
  form: UseFormReturn<AddPartFormSchema>;
  onCategoryChange: (category: string) => void;
  justAutofilled?: boolean;
}

export function PartIdentitySection({ form, onCategoryChange, justAutofilled }: PartIdentitySectionProps) {
  const selectedCategory = form.watch("category");
  const watchedImages = form.watch("images");
  const watchedImageUrl = form.watch("imageUrl");
  const images: string[] = (watchedImages && watchedImages.length > 0)
    ? watchedImages.filter((img): img is string => typeof img === "string" && img.length > 0)
    : (watchedImageUrl ? [watchedImageUrl] : []);
  const coverImage = watchedImageUrl || "";

  const highlightClass = justAutofilled
    ? "ring-2 ring-cyan-500/50 bg-cyan-500/10 dark:bg-cyan-500/10 transition-all duration-700"
    : "";

  return (
    <div className="grid grid-cols-12 gap-8 items-start">
      {/* Left Column: Image Preview */}
      <div className="col-span-12 md:col-span-4 sticky top-0">
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
            coverImage={coverImage}
            onImagesChange={(imgs) => {
              form.setValue("images", imgs, { shouldValidate: true });
              const currentCover = form.getValues("imageUrl");
              if (!currentCover || !imgs.includes(currentCover)) {
                form.setValue("imageUrl", imgs[0] || "", { shouldValidate: true });
              }
            }}
            onCoverImageChange={(cover) => {
              form.setValue("imageUrl", cover, { shouldValidate: true });
            }}
          />
        </Paper>
      </div>

      {/* Right Column: Fields */}
      <div className="col-span-12 md:col-span-8 space-y-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-400 mb-4 flex items-center gap-2.5">
          <span className="inline-block w-3.5 h-0.5 bg-cyan-500/60 rounded-full" />
          Core Details
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FormField control={form.control} name="partName" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Part Name
                </FormLabel>
                <FormControl>
                  <Input 
                    className={cn(
                      "bg-slate-50 dark:bg-[#141a23] border-slate-200 dark:border-white/10 h-10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all shadow-sm",
                      highlightClass
                    )} 
                    placeholder="e.g., AMD Ryzen 7 7700X" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Category
              </FormLabel>
              <Select onValueChange={onCategoryChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className={cn(
                    "bg-slate-50 dark:bg-[#141a23] border-slate-200 dark:border-white/10 h-10 rounded-xl text-slate-900 dark:text-white",
                    highlightClass
                  )}>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="rounded-xl bg-white dark:bg-[#141a23] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-xl">
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
              <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Brand
              </FormLabel>
              <FormControl>
                <Input 
                  className={cn(
                    "bg-slate-50 dark:bg-[#141a23] border-slate-200 dark:border-white/10 h-10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all shadow-sm",
                    highlightClass
                  )} 
                  placeholder="e.g., AMD" 
                  {...field} 
                />
              </FormControl>
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
                  className={cn(
                    "bg-slate-50 dark:bg-[#141a23] border-slate-200 dark:border-white/10 h-10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all shadow-sm font-mono",
                    highlightClass
                  )}
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
              <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Inventory Stock
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  className="bg-slate-50 dark:bg-[#141a23] border-slate-200 dark:border-white/10 h-10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all shadow-sm font-mono"
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
              <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Performance Rank (0–100)
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  className={cn(
                    "bg-slate-50 dark:bg-[#141a23] border-slate-200 dark:border-white/10 h-10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all shadow-sm font-mono",
                    highlightClass
                  )}
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
                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  Package
                  <Badge size="xs" color="cyan" variant="light" className="font-bold">CPU</Badge>
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className={cn(
                      "bg-slate-50 dark:bg-[#141a23] border-slate-200 dark:border-white/10 h-10 rounded-xl text-slate-900 dark:text-white",
                      highlightClass
                    )}>
                      <SelectValue placeholder="BOX / TRAY" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl bg-white dark:bg-[#141a23] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-xl">
                    <SelectItem value="BOX">BOX (Retail)</SelectItem>
                    <SelectItem value="TRAY">TRAY (OEM)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          )}
        </div>

        <div className="pt-2">
          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between mb-2.5">
                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Type className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" /> Description
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
  );
}
