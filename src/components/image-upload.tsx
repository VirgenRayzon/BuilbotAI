"use client";

import React, { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Upload, X, FileText } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
    const [fileName, setFileName] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                onChange(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleClear = () => {
        setFileName("");
        onChange("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const isPreviewReady = value && (value.startsWith("data:image") || value.startsWith("http"));

    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex items-center gap-3">
                <div className="relative flex-1 group">
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                            "flex items-center gap-3 px-3 h-10 rounded-md border border-border/60 bg-muted/40 hover:bg-muted/60 hover:border-primary/50 cursor-pointer transition-all overflow-hidden",
                            fileName ? "ring-1 ring-primary/20" : ""
                        )}
                    >
                        <div className="p-1.5 rounded bg-primary/10 border border-primary/20">
                            <Upload className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className={cn(
                            "text-xs truncate flex-1",
                            fileName ? "text-foreground font-medium" : "text-muted-foreground"
                        )}>
                            {fileName || "No file chosen"}
                        </span>
                        {fileName && (
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive shrink-0"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClear();
                                }}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>

                {isPreviewReady && (
                    <div className="relative h-10 w-10 shrink-0 rounded overflow-hidden border border-border/60 bg-muted/40 shadow-sm animate-in fade-in zoom-in duration-300">
                        <Image src={value} alt="Preview" fill className="object-cover" />
                    </div>
                )}
            </div>
            
            {fileName && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-primary/5 border border-primary/10 w-fit animate-in slide-in-from-top-1 duration-300">
                    <FileText className="h-3 w-3 text-primary/60" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-tight font-bold">New image selected</span>
                </div>
            )}
        </div>
    );
}
