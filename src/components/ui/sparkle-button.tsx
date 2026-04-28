"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface SparkleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  sparkleColor?: string;
  baseColor?: string;
  pill?: boolean;
  icon?: React.ReactNode;
}

export function SparkleButton({
  children,
  className,
  isLoading,
  sparkleColor = "#06b6d4",
  baseColor = "#09090b",
  pill = false,
  icon,
  ...props
}: SparkleButtonProps) {
  const [active, setActive] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number; duration: number; size: number }[]>([]);

  // Generate particles on client side
  useEffect(() => {
    const newParticles = Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      size: 2 + Math.random() * 3,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div 
      className={cn("relative group inline-block", className?.includes("w-full") && "w-full")}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
    >
      <button
        className={cn(
          "sparkle-button relative inline-flex items-center justify-center px-8 py-4 font-bold transition-all duration-300 overflow-hidden shadow-2xl",
          pill ? "rounded-full" : "rounded-xl",
          "bg-zinc-950 border border-white/10",
          isLoading && "opacity-80 cursor-wait",
          active && "scale-[1.02] shadow-[0_0_30px_rgba(6,182,212,0.4)]",
          className
        )}
        {...props}
      >
        {/* Shimmering Border Light */}
        <div 
          className={cn(
            "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
            pill ? "rounded-full" : "rounded-xl",
            "after:content-[''] after:absolute after:inset-[-200%] after:animate-[spin_3s_linear_infinite]",
            "after:bg-[conic-gradient(from_0deg,transparent_0%,transparent_30%,#fff_50%,transparent_70%,transparent_100%)]"
          )}
          style={{ 
            maskImage: 'linear-gradient(black, black), linear-gradient(black, black)',
            maskClip: 'content-box, border-box',
            maskComposite: 'exclude',
            padding: '1.5px'
          }}
        />

        {/* Backdrop Glow */}
        <div className={cn(
          "absolute inset-0 transition-opacity duration-500",
          "bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.2)_0%,transparent_75%)]",
          active ? "opacity-100" : "opacity-0"
        )} />

        {/* Inner Stars/Sparkles */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          <AnimatePresence>
            {active && [0, 1, 2].map((i) => (
              <motion.svg
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1.2, 1], 
                  opacity: [0, 1, 0],
                  y: [0, -15, -20],
                  x: i === 0 ? [0, -10] : i === 1 ? [0, 10] : [0, 0]
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ 
                  duration: 0.8, 
                  delay: i * 0.15, 
                  repeat: Infinity, 
                  repeatDelay: 0.5 
                }}
                className="absolute w-3 h-3 text-cyan-400 fill-current"
                style={{
                  top: i === 2 ? '20%' : '50%',
                  left: i === 0 ? '15%' : i === 1 ? '80%' : '48%',
                }}
                viewBox="0 0 24 24"
              >
                <path d="M12 1L14.39 8.26L22 9.27L16.5 14.14L18.18 21.02L12 17.77L5.82 21.02L7.5 14.14L2 9.27L9.61 8.26L12 1Z" />
              </motion.svg>
            ))}
          </AnimatePresence>
        </div>

        {/* Content */}
        <span className="relative z-50 flex items-center gap-3 tracking-[0.2em] uppercase text-[10px] font-black text-white">
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            <>
              {icon && (
                <motion.span
                  className="flex items-center justify-center"
                  animate={active ? { scale: [1, 1.2, 1], rotate: [0, 5, 0] } : {}}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  {icon}
                </motion.span>
              )}
              <motion.span
                className="flex items-center leading-none mt-[1px]"
                animate={active ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                {children}
              </motion.span>
            </>
          )}
        </span>
      </button>

      {/* Floating Outside Particles */}
      <div className="absolute inset-[-40px] pointer-events-none z-0">
        <AnimatePresence>
          {active && particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
                x: (p.x - 50) * 1.8,
                y: (p.y - 50) * 1.8,
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: "easeOut"
              }}
              className="absolute rounded-full bg-cyan-400/60 blur-[1px]"
              style={{
                width: p.size,
                height: p.size,
                left: '50%',
                top: '50%',
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
