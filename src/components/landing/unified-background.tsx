'use client';

import { useTheme } from '@/context/theme-provider';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function UnifiedBackground() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden select-none">
      {/* Base Layer */}
      <div className={cn(
        "absolute inset-0 transition-colors duration-1000",
        isDark ? "bg-background" : "bg-slate-50"
      )} />

      {/* Primary Neural Blob */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={cn(
          "absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-20 transition-colors duration-1000",
          isDark ? "bg-primary" : "bg-primary/40"
        )}
      />

      {/* Secondary Neural Blob */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -40, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        className={cn(
          "absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-20 transition-colors duration-1000",
          isDark ? "bg-purple-600" : "bg-purple-400/40"
        )}
      />

      {/* Global Grid Pattern */}
      <div 
        className={cn(
          "absolute inset-0 opacity-[0.03] transition-opacity duration-1000",
          isDark ? "invert-0" : "invert-[0.1]"
        )} 
        style={{ 
          backgroundImage: `radial-gradient(circle at 1px 1px, ${isDark ? '#fff' : '#000'} 1.5px, transparent 0px)`, 
          backgroundSize: '48px 48px' 
        }} 
      />

      {/* Subtle Noise Texture */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      {/* Vertical Scanline Effect (Very subtle) */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent h-[200%] animate-[scanline_10s_linear_infinite] pointer-events-none" />
    </div>
  );
}
