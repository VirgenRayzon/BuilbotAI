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
    const glowRef = useRef<THREE.Mesh>(null);
    
    // Increased base speed and sensitivity
    const pulseSpeed = useMemo(() => 1.5 + Math.min(orderCount * 0.2, 5), [orderCount]);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        
        // Heartbeat-style pulse (exponential sine for sharper "beat")
        const pulse = Math.pow(Math.sin(t * pulseSpeed), 2);
        const s = 1 + pulse * 0.2; // 20% scale change
        
        if (meshRef.current) {
            meshRef.current.rotation.y = t * 0.8;
            meshRef.current.rotation.z = t * 0.4;
            meshRef.current.scale.set(s, s, s);
        }
        
        if (wireRef.current) {
            wireRef.current.rotation.y = -t * 0.4;
            wireRef.current.rotation.x = t * 0.2;
            const wireScale = 1.5 + pulse * 0.1;
            wireRef.current.scale.set(wireScale, wireScale, wireScale);
        }

        if (glowRef.current) {
            glowRef.current.scale.set(s * 1.2, s * 1.2, s * 1.2);
            if (glowRef.current.material instanceof THREE.MeshBasicMaterial) {
                glowRef.current.material.opacity = 0.1 + pulse * 0.2;
            }
        }
    });

    return (
        <group>
            {/* Inner Glowing Core */}
            <Float speed={3} rotationIntensity={1.5} floatIntensity={2}>
                <mesh ref={meshRef}>
                    <octahedronGeometry args={[1, 0]} />
                    <MeshDistortMaterial 
                        color="#22d3ee" 
                        speed={4} 
                        distort={0.5} 
                        radius={1}
                        emissive="#22d3ee"
                        emissiveIntensity={3}
                    />
                </mesh>
            </Float>

            {/* Core Glow Aura */}
            <mesh ref={glowRef}>
                <octahedronGeometry args={[1.1, 0]} />
                <meshBasicMaterial 
                    color="#22d3ee" 
                    transparent 
                    opacity={0.2} 
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* Outer Wireframe Cage */}
            <mesh ref={wireRef}>
                <octahedronGeometry args={[1.5, 0]} />
                <meshBasicMaterial 
                    color="#22d3ee" 
                    wireframe 
                    transparent 
                    opacity={0.3} 
                />
            </mesh>

            <Particles count={80} />
        </group>
    );
}

function Particles({ count }: { count: number }) {
    const points = useMemo(() => {
        const p = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            p[i * 3] = (Math.random() - 0.5) * 12;
            p[i * 3 + 1] = (Math.random() - 0.5) * 12;
            p[i * 3 + 2] = (Math.random() - 0.5) * 12;
        }
        return p;
    }, [count]);

    return (
        <points>
            <bufferGeometry>
                <bufferAttribute 
                    attach="attributes-position" 
                    count={count} 
                    args={[points, 3]} 
                />
            </bufferGeometry>
            <pointsMaterial 
                size={0.06} 
                color="#22d3ee" 
                transparent 
                opacity={0.5} 
                sizeAttenuation 
            />
        </points>
    );
}

export function SalesVisualizer({ orderCount }: SalesVisualizerProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className="w-full h-[400px] relative rounded-3xl overflow-hidden border border-border bg-card/20 backdrop-blur-sm transition-all duration-700 group hover:border-primary/30">
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-primary/20 rounded-tl-3xl group-hover:border-primary/50 transition-colors" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-primary/20 rounded-br-3xl group-hover:border-primary/50 transition-colors" />

            <div className="absolute top-6 left-6 z-10">
                <div className="flex flex-col gap-1">
                    <h4 className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Neural Core Status</h4>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_15px_#22d3ee]" />
                            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-primary/40 animate-ping" />
                        </div>
                        <span className="text-sm font-headline font-bold uppercase tracking-tight text-foreground/90">
                            Syncing <span className="text-primary">Live</span> Sales Stream
                        </span>
                    </div>
                </div>
            </div>

            <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 5], fov: 45 }}>
                <React.Suspense fallback={null}>
                    <ambientLight intensity={0.6} />
                    <pointLight position={[10, 10, 10]} intensity={1.5} color="#22d3ee" />
                    <pointLight position={[-10, -10, -10]} intensity={0.8} color="#818cf8" />
                    <spotLight position={[0, 5, 0]} intensity={2} color="#22d3ee" angle={0.3} penumbra={1} />
                    
                    <SalesCore orderCount={orderCount || 0} />
                    
                    <Environment preset="city" />
                    <ContactShadows 
                        position={[0, -2.5, 0]} 
                        opacity={0.6} 
                        scale={12} 
                        blur={2.5} 
                        far={4.5} 
                    />
                </React.Suspense>
            </Canvas>

            <div className="absolute bottom-6 right-8 text-right z-10 flex flex-col items-end">
                <div className="relative">
                    <p className="text-[56px] font-headline font-black leading-none tracking-tighter text-foreground group-hover:text-primary transition-colors duration-500">
                        {orderCount ?? 0}
                    </p>
                    <div className="absolute -top-1 -right-4 w-2 h-2 rounded-full bg-primary animate-ping opacity-75" />
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60 mt-1">
                    Active Growth Cycles
                </p>
            </div>
            
            {/* Dynamic Scanning Line */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-[scan_4s_linear_infinite]" />
            </div>
        </div>
    );
}
