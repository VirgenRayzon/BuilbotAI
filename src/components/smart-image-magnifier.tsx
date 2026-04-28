"use client";

import React, { useState } from 'react';
import { Lens } from './ui/lens';
import { motion } from 'framer-motion';

interface SmartImageMagnifierProps {
    src: string;
    alt: string;
    className?: string;
    zoomLevel?: number;
    lensSize?: number;
}

export function SmartImageMagnifier({
    src,
    alt,
    className = "",
    zoomLevel = 2.0,
    lensSize = 200
}: SmartImageMagnifierProps) {
    const [hovering, setHovering] = useState(false);

    return (
        <div className={`relative overflow-hidden ${className}`}>
            <Lens 
                hovering={hovering} 
                setHovering={setHovering} 
                zoomFactor={zoomLevel} 
                lensSize={lensSize}
            >
                <div className="relative aspect-square w-full h-full">
                    <img
                        src={src}
                        alt={alt}
                        className="w-full h-full object-cover transition-opacity duration-300"
                        style={{ opacity: hovering ? 0.8 : 1 }}
                    />
                    
                    {/* Buildbot AI Scanline Overlay */}
                    {hovering && (
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent h-[1px] w-full animate-scanline pointer-events-none z-10" />
                    )}
                </div>
            </Lens>

            {/* Modern Tooltip Hint */}
            {!hovering && (
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-background/60 backdrop-blur-md rounded border border-primary/10 text-[10px] text-primary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-300 pointer-events-none">
                    HOVER TO TARGET
                </div>
            )}
        </div>
    );
}

