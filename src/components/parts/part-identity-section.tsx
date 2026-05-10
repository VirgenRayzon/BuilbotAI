"use client";

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, Heading1, Heading2, Code, Type } from "lucide-react";
import { ImageUpload } from "../image-upload";
import { componentCategories } from "@/lib/constants/category-specs";
import { UseFormReturn } from "react-hook-form";
import { AddPartFormSchema } from "@/hooks/use-part-form";

interface PartIdentitySectionProps {
  form: UseFormReturn<AddPartFormSchema>;
  onCategoryChange: (category: string) => void;
}

export function PartIdentitySection({ form, onCategoryChange }: PartIdentitySectionProps) {
  const selectedCategory = form.watch("category");

  return (
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
              <Select onValueChange={onCategoryChange} value={field.value}>
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
  );
}
