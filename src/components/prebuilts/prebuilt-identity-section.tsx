"use client";

import { UseFormReturn } from "react-hook-form";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Italic,
  List,
} from "lucide-react";
import { ActionIcon, Paper, Text } from "@mantine/core";
import {
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
import { MultiImageUpload } from "@/components/parts/multi-image-upload";
import { cn } from "@/lib/utils";
import type { AddPrebuiltFormSchema } from "@/hooks/use-prebuilt-form";

interface PrebuiltIdentitySectionProps {
  form: UseFormReturn<AddPrebuiltFormSchema>;
  justAutofilled: boolean;
  flat?: boolean;
}

export function PrebuiltIdentitySection({
  form,
  justAutofilled,
  flat = false,
}: PrebuiltIdentitySectionProps) {
  const highlightClass = justAutofilled
    ? "ring-2 ring-cyan-500/50 bg-cyan-500/10 dark:bg-cyan-500/10 transition-all duration-700"
    : "";
  const watchedImages = form.watch("images");
  const watchedImageUrl = form.watch("imageUrl");
  const images = watchedImages?.length
    ? watchedImages
    : watchedImageUrl
      ? [watchedImageUrl]
      : [];

  return (
    <div className="grid grid-cols-12 gap-8 items-start">
      <div className={cn("col-span-12 md:col-span-4 md:sticky", flat ? "md:top-16" : "md:top-0")}>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-400 mb-4 flex items-center gap-2.5">
          <span className="inline-block w-3.5 h-0.5 bg-cyan-500/60 rounded-full" />
          Visual Identity
        </p>
        {(() => {
          const uploadControl = (
            <MultiImageUpload
              images={images}
              coverImage={watchedImageUrl || ""}
              onImagesChange={(updatedImages) => {
                form.setValue("images", updatedImages, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                const currentCover = form.getValues("imageUrl") || "";
                if (!currentCover || !updatedImages.includes(currentCover)) {
                  form.setValue("imageUrl", updatedImages[0] || "", {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }
              }}
              onCoverImageChange={(coverImage) => {
                form.setValue("imageUrl", coverImage, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            />
          );
          return flat ? (
            uploadControl
          ) : (
            <Paper
              withBorder
              radius="xl"
              p="xs"
              className="bg-slate-50/70 dark:bg-[#111722]/60 border-slate-200 dark:border-white/10 shadow-sm"
            >
              {uploadControl}
            </Paper>
          );
        })()}
      </div>

      <div className="col-span-12 md:col-span-8 space-y-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-400 mb-4 flex items-center gap-2.5">
          <span className="inline-block w-3.5 h-0.5 bg-cyan-500/60 rounded-full" />
          System Details
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    System Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      className={cn(
                        "bg-slate-50 dark:bg-[#141a23] border-slate-200 dark:border-white/10 h-10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all shadow-sm",
                        highlightClass
                      )}
                      placeholder="e.g., Ultimate Gamer V1"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="tier"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Tier
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger
                      className={cn(
                        "bg-slate-50 dark:bg-[#141a23] border-slate-200 dark:border-white/10 h-10 rounded-xl text-slate-900 dark:text-white",
                        highlightClass
                      )}
                    >
                      <SelectValue placeholder="Select tier…" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl bg-white dark:bg-[#141a23] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-xl">
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

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Price (PHP ₱)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    readOnly
                    aria-readonly="true"
                    className={cn(
                      "cursor-default bg-slate-100 dark:bg-white/[0.04] border-slate-200 dark:border-white/10 h-10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all shadow-sm font-mono",
                      highlightClass
                    )}
                    placeholder="e.g., 125000"
                    {...field}
                    onKeyDown={(e) => {
                      if (["e", "E", "+", "-", "."].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </FormControl>
                <Text size="xs" c="dimmed" mt={4}>
                  Calculated from selected components.
                </Text>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="pt-2">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between mb-2.5">
                  <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Description
                  </FormLabel>
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 shadow-sm">
                    {[
                      { title: "Bold", Icon: Bold, apply: (v: string) => `**${v}**` },
                      { title: "Italic", Icon: Italic, apply: (v: string) => `*${v}*` },
                      { title: "Heading 1", Icon: Heading1, apply: (v: string) => `# ${v}` },
                      { title: "Heading 2", Icon: Heading2, apply: (v: string) => `## ${v}` },
                      {
                        title: "Bullet List",
                        Icon: List,
                        apply: (v: string) =>
                          v.split("\n").map((l) => (l.startsWith("- ") ? l : `- ${l}`)).join("\n"),
                      },
                      { title: "Code", Icon: Code, apply: (v: string) => `\`${v}\`` },
                    ].map(({ title: btnTitle, Icon, apply }) => (
                      <ActionIcon
                        key={btnTitle}
                        type="button"
                        variant="subtle"
                        color="gray"
                        size="sm"
                        className="hover:text-cyan-600 dark:hover:text-cyan-400"
                        onClick={() => field.onChange(apply(field.value || ""))}
                        title={btnTitle}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </ActionIcon>
                    ))}
                  </div>
                </div>
                <FormControl>
                  <textarea
                    className={cn(
                      "flex min-h-[130px] w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#141a23] p-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 focus-visible:outline-none transition-all duration-300 font-mono leading-relaxed",
                      highlightClass
                    )}
                    placeholder={`Use Markdown for formatting...
- The Midnight Apex
- 4K Gaming Beast

**System Overview:** A high-end capable build...`}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
