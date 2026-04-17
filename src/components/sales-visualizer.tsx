"use client";

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
    Float, 
    MeshDistortMaterial, 
    MeshWobbleMaterial, 
    Sphere, 
    PerspectiveCamera,
    Environment,
    ContactShadows
} from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '@/context/theme-provider';
import { cn } from '@/lib/utils';

interface SalesVisualizerProps {
    orderCount: number;
}

function SalesCore({ orderCount }: { orderCount: number }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const wireRef = useRef<THREE.Mesh>(null);
    const pulseSpeed = useMemo(() => Math.min(0.5 + orderCount * 0.1, 3), [orderCount]);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (meshRef.current) {
            meshRef.current.rotation.y = t * 0.4;
            meshRef.current.rotation.z = t * 0.2;
            const s = 1 + Math.sin(t * pulseSpeed) * 0.05;
            meshRef.current.scale.set(s, s, s);
        }
        if (wireRef.current) {
            wireRef.current.rotation.y = -t * 0.2;
            wireRef.current.rotation.x = t * 0.1;
        }
    });

    return (
        <group>
            {/* Inner Glowing Core */}
            <Float speed={2} rotationIntensity={1} floatIntensity={2}>
                <mesh ref={meshRef}>
                    <octahedronGeometry args={[1, 0]} />
                    <MeshDistortMaterial 
                        color="#22d3ee" 
                        speed={3} 
                        distort={0.4} 
                        radius={1}
                        emissive="#22d3ee"
                        emissiveIntensity={2}
                    />
                </mesh>
            </Float>

            {/* Outer Wireframe Cage */}
            <mesh ref={wireRef}>
                <octahedronGeometry args={[1.5, 0]} />
                <meshBasicMaterial 
                    color="#22d3ee" 
                    wireframe 
                    transparent 
                    opacity={0.2} 
                />
            </mesh>

            {/* Ambient Particles / Dust */}
            <Particles count={50} />
        </group>
    );
}

function Particles({ count }: { count: number }) {
    const points = useMemo(() => {
        const p = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            p[i * 3] = (Math.random() - 0.5) * 10;
            p[i * 3 + 1] = (Math.random() - 0.5) * 10;
            p[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }
        return p;
    }, [count]);

    return (
        <points>
            <bufferGeometry>
                <bufferAttribute 
                    attach="attributes-position" 
                    count={count} 
                    array={points} 
                    itemSize={3} 
                />
            </bufferGeometry>
            <pointsMaterial size={0.05} color="#22d3ee" transparent opacity={0.4} />
        </points>
    );
}

export function SalesVisualizer({ orderCount }: SalesVisualizerProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className={cn(
            "w-full h-[400px] relative rounded-3xl overflow-hidden border backdrop-blur-sm transition-colors",
            isDark ? "bg-slate-950/20 border-white/5" : "bg-slate-100/50 border-black/5"
        )}>
            <div className="absolute top-6 left-6 z-10">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-1">Neural Core Status</h4>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#22d3ee]" />
                    <span className={cn(
                        "text-sm font-headline font-bold uppercase tracking-tighter",
                        isDark ? "text-white" : "text-slate-900"
                    )}>Syncing Sales Data...</span>
                </div>
            </div>

            <Canvas shadows dpr={[1, 2]}>
                <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#22d3ee" />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#818cf8" />
                
                <SalesCore orderCount={orderCount} />
                
                <Environment preset="city" />
                <ContactShadows 
                    position={[0, -2.5, 0]} 
                    opacity={0.4} 
                    scale={10} 
                    blur={2} 
                    far={4.5} 
                />
            </Canvas>

            <div className="absolute bottom-6 right-6 text-right z-10">
                <p className={cn(
                    "text-[40px] font-headline font-bold leading-none tracking-tighter",
                    isDark ? "text-white" : "text-slate-900"
                )}>{orderCount}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Active Cycles</p>
            </div>
        </div>
    );
}
