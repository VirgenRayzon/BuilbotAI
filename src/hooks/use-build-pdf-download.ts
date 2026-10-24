"use client";

import { useState } from 'react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { BUILD_PDF_CATEGORIES, BUILD_PDF_REQUIRED } from '@/lib/build-pdf-categories';
import type { ComponentData } from '@/lib/types';

type CurrentBuild = Record<string, ComponentData | ComponentData[] | null>;

export function useBuildPdfDownload(build: CurrentBuild) {
  const user = useUser();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const isComplete = BUILD_PDF_REQUIRED.every(category => {
    const value = build[category];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  });

  const download = async () => {
    if (isDownloading || !isComplete) return;
    if (!user) {
      toast({ title: 'Sign in to download your build', variant: 'destructive' });
      return;
    }
    setIsDownloading(true);
    try {
      const parts = BUILD_PDF_CATEGORIES.flatMap(category => {
        const value = build[category];
        const selected = Array.isArray(value) ? value : value ? [value] : [];
        return selected.map(part => ({ category, id: part.id }));
      });
      const response = await fetch('/api/builder/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
        body: JSON.stringify({ parts }),
      });
      if (!response.ok) {
        const result: unknown = await response.json();
        const message = result && typeof result === 'object' && 'error' in result && typeof result.error === 'string'
          ? result.error : 'Could not create your build PDF.';
        throw new Error(message);
      }
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'netcodex-your-build.pdf';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      toast({
        title: 'Could not download your build',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return { download, isDownloading, isComplete };
}
