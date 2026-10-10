"use client";

import React, { useState, useRef, useCallback } from "react";
import { Upload, X, Star, Check, Link2 } from "lucide-react";
import { Button as MantineButton, Textarea } from "@mantine/core";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OptimizedImage } from "../ui/optimized-image";
import { cn } from "@/lib/utils";

interface MultiImageUploadProps {
  images: string[];
  coverImage: string;
  onImagesChange: (images: string[]) => void;
  onCoverImageChange: (coverUrl: string) => void;
  className?: string;
}

/**
 * Compresses an image file to a max dimension of 1200px and returns base64.
 */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 1200;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL("image/jpeg", 0.75);
        resolve(compressed);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function MultiImageUpload({
  images = [],
  coverImage = "",
  onImagesChange,
  onCoverImageChange,
  className,
}: MultiImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageLinks, setImageLinks] = useState("");
  const [linkError, setLinkError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const validFiles = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
      if (validFiles.length === 0) return;

      setIsProcessing(true);
      try {
        const compressedList = await Promise.all(validFiles.map((file) => compressImage(file)));
        const updatedImages = [...images, ...compressedList];
        onImagesChange(updatedImages);

        // If no cover image yet, set the first newly added image as cover
        if (!coverImage && updatedImages.length > 0) {
          onCoverImageChange(updatedImages[0]);
        }
      } catch (err) {
        console.error("Error compressing images:", err);
      } finally {
        setIsProcessing(false);
      }
    },
    [images, coverImage, onImagesChange, onCoverImageChange]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const removedImage = images[indexToRemove];
    const updatedImages = images.filter((_, idx) => idx !== indexToRemove);
    onImagesChange(updatedImages);

    // If the removed image was the cover, reassign to first available
    if (coverImage === removedImage) {
      onCoverImageChange(updatedImages[0] || "");
    }
  };

  const handleSetCover = (imgUrl: string) => {
    onCoverImageChange(imgUrl);
  };

  const addImageLinks = () => {
    const links = imageLinks.split(/\r?\n/).map((link) => link.trim()).filter(Boolean);
    if (links.length === 0) return;
    for (const link of links) {
      try {
        const parsed = new URL(link);
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
      } catch {
        setLinkError("Enter a valid HTTP or HTTPS image link on each line.");
        return;
      }
    }
    const updatedImages = [...images, ...links.filter((link) => !images.includes(link))];
    onImagesChange(updatedImages);
    if (!coverImage && updatedImages.length > 0) onCoverImageChange(updatedImages[0]);
    setImageLinks("");
    setLinkError("");
  };

  // Determine effective cover
  const effectiveCover = coverImage || images[0] || "";

  return (
    <div className={cn("space-y-4", className)}>
      {/* Hidden File Input supporting multiple files */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Main Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative rounded-2xl border-2 border-dashed p-6 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center gap-2.5",
          isDragging
            ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_25px_rgba(6,182,212,0.25)] scale-[1.01]"
            : "border-slate-300 dark:border-white/15 bg-slate-50/60 dark:bg-white/[0.02] hover:border-cyan-500/60 hover:bg-cyan-500/5",
          images.length > 0 ? "py-4" : "aspect-square"
        )}
      >
        <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
          <Upload className={cn("h-6 w-6 transition-transform duration-300", isDragging && "-translate-y-1")} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200">
            {isProcessing ? "Optimizing Photos…" : "Drag & Drop Photos Here"}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            or click to browse multiple files (PNG, JPG, WebP)
          </p>
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-slate-200 dark:border-white/10 p-3 bg-white/85 dark:bg-[#141a23]/90">
        <Textarea
          label="Import from image links"
          description="Paste one or more direct image links, one per line. Images move to Firebase Storage when you save."
          placeholder={"https://example.com/photo-1.jpg\nhttps://example.com/photo-2.jpg"}
          minRows={2}
          autosize
          value={imageLinks}
          onChange={(event) => { setImageLinks(event.currentTarget.value); setLinkError(""); }}
          error={linkError || undefined}
        />
        <MantineButton type="button" size="xs" variant="light" leftSection={<Link2 size={14} />} onClick={addImageLinks} disabled={!imageLinks.trim()}>
          Add links
        </MantineButton>
      </div>

      {/* Uploaded Photos Gallery */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            <span>Selected Photos ({images.length})</span>
            <span className="text-primary font-semibold">Click star to choose Cover</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
            {images.map((imgUrl, index) => {
              const isCover = imgUrl === effectiveCover;

              return (
                <div
                  key={`${imgUrl.substring(0, 30)}-${index}`}
                  className={cn(
                    "group relative aspect-square rounded-xl overflow-hidden border transition-all duration-200 bg-muted/30",
                    isCover
                      ? "border-emerald-500 ring-2 ring-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                      : "border-border/60 hover:border-primary/40"
                  )}
                >
                  <OptimizedImage
                    src={imgUrl}
                    alt={`Product photo ${index + 1}`}
                    fill
                    className="object-contain p-1.5"
                  />

                  {/* Cover Photo Badge */}
                  {isCover && (
                    <div className="absolute top-1.5 left-1.5 z-10">
                      <Badge className="bg-emerald-600 hover:bg-emerald-600 text-[8px] font-bold uppercase tracking-wider py-0 px-1.5 h-4 flex items-center gap-1 shadow-sm">
                        <Check className="h-2.5 w-2.5" />
                        Cover
                      </Badge>
                    </div>
                  )}

                  {/* Overlay Controls */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-1">
                    {!isCover && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetCover(imgUrl);
                        }}
                        title="Set as Cover Photo"
                        className="h-7 w-7 rounded-full bg-white/20 hover:bg-emerald-600 text-white transition-colors"
                      >
                        <Star className="h-3.5 w-3.5" />
                      </Button>
                    )}

                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(index);
                      }}
                      title="Remove Photo"
                      className="h-7 w-7 rounded-full bg-white/20 hover:bg-rose-600 text-white transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
