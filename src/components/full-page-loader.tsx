
"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FullPageLoaderProps {
  label?: string;
  subtitle?: string;
}

export function FullPageLoader({ 
  label = "Initializing", 
  subtitle = "Masterpiece Architect" 
}: FullPageLoaderProps) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#0c0f14] overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.08),transparent_70%)] animate-pulse" />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#fff 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }} />
      </div>
      
      <div className="relative flex flex-col items-center gap-10">
        <div className="relative">
          {/* Main Visual Core */}
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-primary/30 rounded-full blur-3xl"
          />
          
          <div className="relative w-32 h-32">
            {/* Outer Tech Ring */}
            <svg className="w-full h-full rotate-[-90deg]">
              <circle
                cx="64"
                cy="64"
                r="60"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-primary/10"
              />
              <motion.circle
                cx="64"
                cy="64"
                r="60"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="100 300"
                className="text-primary"
                animate={{ strokeDashoffset: [0, -400] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            </svg>

            {/* Middle Rotating Hexagon-ish shape */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-4 border border-primary/20 rounded-2xl"
            />

            {/* Inner Glowing Point */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div 
                animate={{ 
                  scale: [1, 1.5, 1],
                  boxShadow: [
                    "0 0 20px rgba(34,211,238,0.5)",
                    "0 0 40px rgba(34,211,238,0.8)",
                    "0 0 20px rgba(34,211,238,0.5)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-4 h-4 bg-primary rounded-full shadow-[0_0_20px_rgba(34,211,238,0.5)]"
              />
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1"
          >
            <h2 className="text-primary font-headline font-black text-3xl uppercase tracking-[0.4em] drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              {label}
            </h2>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.6em] ml-1">
              {subtitle}
            </p>
          </motion.div>

          {/* Precision Loading Bar */}
          <div className="w-64 h-[2px] bg-white/5 rounded-full overflow-hidden relative">
            <motion.div 
              animate={{ 
                x: ["-100%", "100%"],
                width: ["20%", "40%", "20%"]
              }}
              transition={{ 
                duration: 2.5, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="absolute h-full bg-gradient-to-r from-transparent via-primary to-transparent"
            />
          </div>
          
          <motion.p 
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-[9px] font-mono text-primary/60 uppercase tracking-widest mt-2"
          >
            Stabilizing Neural Link...
          </motion.p>
        </div>
      </div>

      {/* Edge Accents */}
      <div className="absolute top-0 left-0 w-32 h-32 border-t border-l border-primary/10 rounded-tl-3xl m-8" />
      <div className="absolute top-0 right-0 w-32 h-32 border-t border-r border-primary/10 rounded-tr-3xl m-8" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-b border-l border-primary/10 rounded-bl-3xl m-8" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-b border-r border-primary/10 rounded-br-3xl m-8" />
    </div>
  );
}
