"use client";

import React, { useState, useRef, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Upload, X, FileText } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    variant?: "default" | "large";
}

export function ImageUpload({ value, onChange, className, variant = "default" }: ImageUploadProps) {
    const [fileName, setFileName] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new (window as any).Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Max dimensions for About page images to keep them small
                    const MAX_SIZE = 1200; 
                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    
                    // Compress to 0.7 quality to save space
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                    onChange(compressedBase64);
                };
                img.src = reader.result as string;
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

    const displayName = useMemo(() => {
        if (fileName) return fileName;
        if (!value) return "No file chosen";
        
        if (value.startsWith("data:")) return "Uploaded Image File";
        
        try {
            // Check if it's a URL
            if (value.startsWith("http")) {
                const url = new URL(value);
                const pathParts = url.pathname.split('/');
                const lastPart = decodeURIComponent(pathParts[pathParts.length - 1]);
                
                // Firebase storage format: .../o/folder%2Ffilename?alt=...
                if (lastPart.includes('/')) {
                    const fileNameFromPath = lastPart.split('/').pop();
                    return fileNameFromPath || "Stored Image";
                }
                
                // Decode possible %2F in filename
                const decodedFileName = lastPart.split('%2F').pop();
                return decodedFileName || "Stored Image";
            }
            return "Stored Image";
        } catch (e) {
            return "Stored Image";
        }
    }, [fileName, value]);

    const isPreviewReady = value && (value.startsWith("data:image") || value.startsWith("http"));

    if (variant === "large") {
        return (
            <div className={cn("space-y-4", className)}>
                <div className="relative group mx-auto">
                    <div 
                        className={cn(
                            "relative aspect-square w-full rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 flex flex-col items-center justify-center gap-3 transition-all duration-300 overflow-hidden group-hover:border-primary/50 group-hover:bg-primary/5 shadow-inner",
                            isPreviewReady && "border-solid border-primary/30"
                        )}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {isPreviewReady ? (
                            <div className="absolute inset-0 animate-in fade-in zoom-in duration-500">
                                <Image src={value} alt="Preview" fill className="object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                    <div className="p-2 rounded-full bg-white/20 border border-white/30 text-white">
                                        <Upload className="h-5 w-5" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary group-hover:scale-110 transition-transform duration-300">
                                    <ImageIcon className="h-8 w-8" />
                                </div>
                                <div className="text-center px-4">
                                    <p className="text-xs font-bold uppercase tracking-widest text-primary/80">Upload Photo</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG or WebP</p>
                                </div>
                            </>
                        )}
                    </div>
                    
                    {isPreviewReady && (
                        <Button 
                            type="button" 
                            variant="destructive" 
                            size="icon" 
                            className="absolute -top-2 -right-2 h-7 w-7 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClear();
                            }}
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>

                <div className="flex flex-col items-center gap-1.5 pt-1">
                    <p className={cn(
                        "text-[10px] uppercase tracking-widest font-bold text-center break-all line-clamp-2",
                        (fileName || value) ? "text-primary" : "text-muted-foreground/60"
                    )}>
                        {displayName}
                    </p>
                    {fileName && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 animate-in slide-in-from-top-1">
                            <FileText className="h-3 w-3 text-primary" />
                            <span className="text-[9px] text-primary font-bold uppercase">Ready to save</span>
                        </div>
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
        );
    }

    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex items-center gap-3">
                <div className="relative flex-1 group">
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                            "flex items-center gap-3 px-3 h-10 rounded-md border border-border/60 bg-muted/40 hover:bg-muted/60 hover:border-primary/50 cursor-pointer transition-all overflow-hidden",
                            (fileName || (value && !fileName)) ? "ring-1 ring-primary/20" : ""
                        )}
                    >
                        <div className="p-1.5 rounded bg-primary/10 border border-primary/20">
                            <Upload className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className={cn(
                            "text-xs truncate flex-1",
                            (fileName || value) ? "text-foreground font-medium" : "text-muted-foreground"
                        )}>
                            {displayName}
                        </span>
                        {(fileName || value) && (
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
