'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { ImageProps } from 'next/image';
import { OptimizedImage } from './optimized-image';

interface SlidingImageProps extends Omit<ImageProps, 'src'> {
  src: ImageProps['src'];
  imageKey: string | number;
  direction: -1 | 1;
}

/** Direction-aware gallery image transition with the shared card-image loader. */
export function SlidingImage({ imageKey, direction, ...imageProps }: SlidingImageProps) {
  const reduceMotion = useReducedMotion();
  const offset = reduceMotion ? 0 : direction * 64;

  return (
    <AnimatePresence initial={false} custom={direction} mode="popLayout">
      <motion.div
        key={imageKey}
        custom={direction}
        initial={{ x: offset, opacity: reduceMotion ? 1 : 0.25 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -offset, opacity: reduceMotion ? 1 : 0.15 }}
        transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0"
      >
        <OptimizedImage {...imageProps} />
      </motion.div>
    </AnimatePresence>
  );
}
