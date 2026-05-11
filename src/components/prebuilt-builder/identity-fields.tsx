"use client";

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Bold, Italic, Heading1, Heading2, List, Type } from "lucide-react";
import { ImageUpload } from "../image-upload";
import { UseFormReturn } from "react-hook-form";
import { PrebuiltBuilderAddFormSchema } from "./use-prebuilt-form";

interface IdentityFieldsProps {
    form: UseFormReturn<PrebuiltBuilderAddFormSchema>;
}

export function IdentityFields({ form }: IdentityFieldsProps) {
    return (
        <div className="grid grid-cols-12 gap-8 items-start">
            {/* Left Column: Image Preview */}
            <div className="col-span-12 md:col-span-4 sticky top-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70 mb-4 flex items-center gap-3">
                    <span className="inline-block w-4 h-px bg-primary/40" />
                    Visual Identity
                </p>
                <div className="p-6 rounded-3xl border border-primary/10 bg-primary/5 shadow-inner">
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
                    System Details
                </p>

                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">System Name</FormLabel>
                                <FormControl>
                                    <Input className="bg-muted/30 border-border/40 h-10 rounded-xl focus:bg-background transition-colors shadow-sm" placeholder="e.g., Ultimate Gamer V1" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>

                    <FormField control={form.control} name="tier" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Performance Tier</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className="bg-muted/30 border-border/40 h-10 rounded-xl">
                                        <SelectValue placeholder="Select tier…" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="Entry">Entry</SelectItem>
                                    <SelectItem value="Mid-Range">Mid-Range</SelectItem>
                                    <SelectItem value="High-End">High-End</SelectItem>
                                    <SelectItem value="Workstation">Workstation</SelectItem>
                                </SelectContent>
                            </Select>
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
                                    placeholder="e.g., 125000" 
                                    {...field} 
                                    onKeyDown={(e) => {
                                        if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
                                    }}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <div className="col-span-2 space-y-3">
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem>
                                <div className="flex items-center justify-between mb-3">
                                    <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70 flex items-center gap-2">
                                        <Type className="h-3 w-3" /> System Overview
                                    </FormLabel>
                                    <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border/40 shadow-sm">
                                        <FormattingButtons field={field} />
                                    </div>
                                </div>
                                <FormControl>
                                    <textarea
                                        className="flex min-h-[140px] w-full rounded-2xl border border-border/40 bg-muted/20 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground/50 focus:bg-background focus:border-primary/40 focus:ring-1 focus:ring-primary/20 focus-visible:outline-none transition-all duration-300 font-mono leading-relaxed"
                                        placeholder="Craft a compelling system story..."
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function FormattingButtons({ field }: { field: any }) {
    const applyFormat = (prefix: string, suffix: string = "") => {
        const val = field.value || "";
        field.onChange(`${prefix}${val}${suffix}`);
    };

    const applyList = () => {
        const val = field.value || "";
        const lines = val.split('\n');
        const listVal = lines.map((line: string) => line.startsWith('- ') ? line : `- ${line}`).join('\n');
        field.onChange(listVal);
    };

    return (
        <>
            <FormatButton onClick={() => applyFormat("**", "**")} icon={<Bold className="h-4 w-4" />} title="Bold" />
            <FormatButton onClick={() => applyFormat("*", "*")} icon={<Italic className="h-4 w-4" />} title="Italic" />
            <div className="w-px h-5 bg-border/60 mx-1" />
            <FormatButton onClick={() => applyFormat("# ")} icon={<Heading1 className="h-4 w-4" />} title="Heading 1" />
            <FormatButton onClick={() => applyFormat("## ")} icon={<Heading2 className="h-4 w-4" />} title="Heading 2" />
            <div className="w-px h-5 bg-border/60 mx-1" />
            <FormatButton onClick={applyList} icon={<List className="h-4 w-4" />} title="Bullet List" />
        </>
    );
}

function FormatButton({ onClick, icon, title }: { onClick: () => void, icon: React.ReactNode, title: string }) {
    return (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200"
            onClick={onClick}
            title={title}
        >
            {icon}
        </Button>
    );
}
