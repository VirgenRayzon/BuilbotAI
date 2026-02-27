"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

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
    zoomLevel = 2.5,
    lensSize = 150
}: SmartImageMagnifierProps) {
    const [showMagnifier, setShowMagnifier] = useState(false);
    const [[x, y], setXY] = useState([0, 0]);
    const [[imgWidth, imgHeight], setSize] = useState([0, 0]);
    const imgRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = (e: React.MouseEvent) => {
        const elem = e.currentTarget;
        const { width, height } = elem.getBoundingClientRect();
        setSize([width, height]);
        setShowMagnifier(true);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const elem = e.currentTarget;
        const { top, left } = elem.getBoundingClientRect();
        const x = e.pageX - left - window.pageXOffset;
        const y = e.pageY - top - window.pageYOffset;
        setXY([x, y]);
    };

    const handleMouseLeave = () => {
        setShowMagnifier(false);
    };

    return (
        <div
            ref={imgRef}
            className={`relative overflow-hidden cursor-crosshair ${className}`}
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <Image
                src={src}
                alt={alt}
                fill
                priority
                className="object-cover transition-opacity duration-300"
                style={{ opacity: showMagnifier ? 0.8 : 1 }}
            />

            <AnimatePresence>
                {showMagnifier && (
                    <>
                        {/* The Lens */}
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="pointer-events-none absolute z-50 rounded-full border-2 border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.3)] backdrop-blur-[2px] overflow-hidden bg-background/10"
                            style={{
                                width: `${lensSize}px`,
                                height: `${lensSize}px`,
                                left: `${x - lensSize / 2}px`,
                                top: `${y - lensSize / 2}px`,
                            }}
                        >
                            {/* Zoomed Image Container */}
                            <div
                                className="absolute inset-0"
                                style={{
                                    backgroundImage: `url('${src}')`,
                                    backgroundSize: `${imgWidth * zoomLevel}px ${imgHeight * zoomLevel}px`,
                                    backgroundPosition: `${-x * zoomLevel + lensSize / 2}px ${-y * zoomLevel + lensSize / 2}px`,
                                    backgroundRepeat: 'no-repeat',
                                }}
                            >
                                {/* Buildbot AI Scanline Improvement */}
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent h-[1px] w-full animate-scanline pointer-events-none" />
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.1)_100%)] pointer-events-none" />
                            </div>

                            {/* Crosshair UI Improvement */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-40">
                                <div className="w-4 h-[1px] bg-primary" />
                                <div className="h-4 w-[1px] bg-primary" />
                            </div>
                        </motion.div>

                        {/* Premium Focus Ring Improvement */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1.2, opacity: 0.2 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="pointer-events-none absolute z-40 rounded-full border border-primary/20"
                            style={{
                                width: `${lensSize * 1.5}px`,
                                height: `${lensSize * 1.5}px`,
                                left: `${x - (lensSize * 1.5) / 2}px`,
                                top: `${y - (lensSize * 1.5) / 2}px`,
                            }}
                        />
                    </>
                )}
            </AnimatePresence>

            {/* Modern Tooltip Hint */}
            {!showMagnifier && (
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-background/60 backdrop-blur-md rounded border border-primary/10 text-[10px] text-primary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-300">
                    HOVER TO TARGET
                </div>
            )}
        </div>
    );
}
