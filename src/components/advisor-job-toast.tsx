"use client";

import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function AdvisorElapsedTime({ startedAt }: { startedAt: number }) {
  const [seconds, setSeconds] = useState(() => Math.floor((Date.now() - startedAt) / 1000));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [startedAt]);

  return <span className="tabular-nums text-amber-200">Elapsed {formatDuration(seconds)}</span>;
}

export function showAdvisorProgressToast(title: string, startedAt: number) {
  return toast({
    title,
    description: <AdvisorElapsedTime startedAt={startedAt} />,
    variant: 'advisor',
    duration: Infinity,
  });
}

export function showAdvisorReadyToast(title: string, startedAt: number, onOpen: () => void) {
  const seconds = Math.round((Date.now() - startedAt) / 1000);
  toast({
    title,
    description: `Finished in ${formatDuration(seconds)}.`,
    variant: 'advisor',
    duration: 12000,
    action: (
      <ToastAction
        altText="Open Build Advisor"
        onClick={onOpen}
        className="h-11 border-amber-400/60 text-amber-100 hover:bg-amber-400/15 hover:text-amber-50 focus:ring-amber-400"
      >
        Open advisor
      </ToastAction>
    ),
  });
}
