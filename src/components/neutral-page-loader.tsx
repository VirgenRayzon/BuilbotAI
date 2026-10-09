'use client';

import { Loader, Text } from '@mantine/core';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function NeutralPageLoader({
  message = 'Verifying your account...',
  isOverlay = false,
  className,
}: {
  message?: string;
  isOverlay?: boolean;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeInOut' } }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'flex items-center justify-center bg-slate-50 text-slate-900 dark:bg-[#0c0f14] dark:text-slate-100',
        isOverlay ? 'fixed inset-0 z-[9999]' : 'min-h-screen w-full',
        className
      )}
    >
      <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
        <Loader color="cyan" size="md" />
        <Text size="sm" c="dimmed" className="font-medium tracking-wide">
          {message}
        </Text>
      </div>
    </motion.div>
  );
}
