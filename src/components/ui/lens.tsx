"use client";
import React, { useRef, useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LensProps {
  children: React.ReactNode;
  hovering: boolean;
  setHovering: (hovering: boolean) => void;
  zoomFactor?: number;
  lensSize?: number;
  isStatic?: boolean;
  position?: { x: number; y: number };
}

export const Lens = ({
  children,
  hovering,
  setHovering,
  zoomFactor = 2.0,
  lensSize = 200,
  isStatic = false,
  position = { x: 0, y: 0 },
}: LensProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [localMousePosition, setLocalMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setLocalMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, []);

  const mousePosition = isStatic ? position : localMousePosition;

  // Use useMemo to avoid recalculating dimensions on every render if possible
  // but we need current dimensions for the scale to work correctly
  const containerWidth = containerRef.current?.offsetWidth || 0;
  const containerHeight = containerRef.current?.offsetHeight || 0;

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onMouseMove={handleMouseMove}
      className={cn(
        "relative overflow-hidden rounded-lg transition-all duration-300",
        hovering ? "cursor-none" : "cursor-default"
      )}
    >
      {children}
      <AnimatePresence mode="wait">
        {hovering && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute z-50 pointer-events-none"
            style={{
              left: mousePosition.x - lensSize / 2,
              top: mousePosition.y - lensSize / 2,
              width: lensSize,
              height: lensSize,
            }}
          >
            <div className="relative w-full h-full overflow-hidden rounded-full border-2 border-white/40 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-sm bg-black/10">
              <div
                className="absolute"
                style={{
                  width: containerWidth,
                  height: containerHeight,
                  left: -(mousePosition.x - lensSize / 2),
                  top: -(mousePosition.y - lensSize / 2),
                  transform: `scale(${zoomFactor})`,
                  transformOrigin: `${mousePosition.x}px ${mousePosition.y}px`,
                }}
              >
                {children}
              </div>
              {/* Internal Lens Decoration */}
              <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(255,255,255,0.3)] rounded-full" />
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


