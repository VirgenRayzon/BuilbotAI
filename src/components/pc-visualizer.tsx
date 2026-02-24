"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from "@react-three/drei";
import { ComponentData } from "@/lib/types";

interface PCVisualizerProps {
    build: Record<string, ComponentData | ComponentData[] | null>;
}

function PartMesh({ position, size, color, label, visible }: { position: [number, number, number], size: [number, number, number], color: string, label: string, visible: boolean }) {
    if (!visible) return null;
    return (
        <mesh position={position}>
            <boxGeometry args={size} />
            <meshStandardMaterial color={color} metalness={0.5} roughness={0.2} />
        </mesh>
    );
}

function Case() {
    return (
        <group>
            {/* Bottom */}
            <mesh position={[0, -1.5, 0]}>
                <boxGeometry args={[3, 0.1, 4]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            {/* Back */}
            <mesh position={[0, 0, -2]}>
                <boxGeometry args={[3, 3, 0.1]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            {/* Bottom Side (Motherboard tray) */}
            <mesh position={[-1.4, 0, 0]}>
                <boxGeometry args={[0.1, 3, 4]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            {/* Top */}
            <mesh position={[0, 1.5, 0]}>
                <boxGeometry args={[3, 0.1, 4]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            {/* Front (Transparent-ish) */}
            <mesh position={[0, 0, 2]}>
                <boxGeometry args={[3, 3, 0.05]} />
                <meshStandardMaterial color="#333" transparent opacity={0.3} />
            </mesh>
            {/* Glass Side */}
            <mesh position={[1.5, 0, 0]}>
                <boxGeometry args={[0.05, 3, 4]} />
                <meshStandardMaterial color="#88aaff" transparent opacity={0.2} />
            </mesh>
        </group>
    );
}

export function PCVisualizer({ build }: PCVisualizerProps) {
    const hasCPU = !!build["CPU"];
    const hasGPU = !!build["GPU"];
    const hasMobo = !!build["Motherboard"];
    const hasRAM = !!build["RAM"];
    const hasPSU = !!build["PSU"];
    const hasCooler = !!build["Cooler"];
    const hasStorage = Array.isArray(build["Storage"]) ? build["Storage"].length > 0 : !!build["Storage"];
    const hasCase = !!build["Case"];

    return (
        <div className="w-full h-[400px] bg-black/5 rounded-xl border border-primary/10 relative overflow-hidden group">
            <div className="absolute top-4 left-4 z-10">
                <h3 className="text-sm font-headline font-bold text-muted-foreground uppercase tracking-widest">3D Build Preview</h3>
            </div>

            <Canvas shadows dpr={[1, 2]}>
                <PerspectiveCamera makeDefault position={[5, 3, 5]} fov={50} />
                <OrbitControls enablePan={false} minDistance={4} maxDistance={10} />

                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} castShadow />
                <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

                <Suspense fallback={null}>
                    <group position={[0, 0, 0]}>
                        <Case />

                        {/* Motherboard */}
                        <PartMesh
                            position={[-1.3, 0, 0]}
                            size={[0.1, 2.5, 2]}
                            color="#1b4332"
                            label="Motherboard"
                            visible={hasMobo}
                        />

                        {/* CPU (on top of Mobo) */}
                        <PartMesh
                            position={[-1.2, 0.5, 0]}
                            size={[0.15, 0.4, 0.4]}
                            color="#555"
                            label="CPU"
                            visible={hasCPU}
                        />

                        {/* RAM (on top of Mobo) */}
                        <PartMesh
                            position={[-1.2, 0.5, 0.6]}
                            size={[0.15, 0.8, 0.05]}
                            color="#333"
                            label="RAM"
                            visible={hasRAM}
                        />

                        {/* GPU (connected to Mobo) */}
                        <PartMesh
                            position={[-0.8, -0.2, 0]}
                            size={[0.8, 0.4, 2]}
                            color="#b91c1c"
                            label="GPU"
                            visible={hasGPU}
                        />

                        {/* PSU (at bottom) */}
                        <PartMesh
                            position={[0, -1.2, -1]}
                            size={[1.5, 0.6, 1.5]}
                            color="#111"
                            label="PSU"
                            visible={hasPSU}
                        />

                        {/* Storage (SSD/HDD) */}
                        <PartMesh
                            position={[0, -1.2, 1]}
                            size={[1, 0.1, 1.5]}
                            color="#222"
                            label="Storage"
                            visible={hasStorage}
                        />

                        {/* Cooler (on CPU) */}
                        <PartMesh
                            position={[-0.9, 0.5, 0]}
                            size={[0.5, 0.6, 0.6]}
                            color="#3b82f6"
                            label="Cooler"
                            visible={hasCooler}
                        />
                    </group>

                    <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2} far={4} />
                    <Environment preset="city" />
                </Suspense>
            </Canvas>

            {!hasMobo && !hasGPU && !hasCPU && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-sm text-muted-foreground bg-background/80 px-4 py-2 rounded-full border border-border shadow-sm">
                        Add parts to see your build in 3D
                    </p>
                </div>
            )}
        </div>
    );
}
