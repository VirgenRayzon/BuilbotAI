"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

function Cube() {
  const meshRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.x = t * 0.2;
      meshRef.current.rotation.y = t * 0.3;
    }
    if (coreRef.current) {
      coreRef.current.rotation.x = -t * 0.4;
      coreRef.current.rotation.y = -t * 0.5;
      const s = 1 + Math.sin(t * 2) * 0.1;
      coreRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        {/* Outer Tech Shell */}
        <mesh ref={meshRef}>
          <boxGeometry args={[1.8, 1.8, 1.8]} />
          <meshPhysicalMaterial
            transparent
            opacity={0.3}
            color="#448FC4"
            metalness={0.9}
            roughness={0.1}
            transmission={0.8}
            thickness={1}
            ior={1.5}
          />
          {/* Wireframe for tech look */}
          <mesh>
            <boxGeometry args={[1.81, 1.81, 1.81]} />
            <meshBasicMaterial color="#22D3EE" wireframe transparent opacity={0.2} />
          </mesh>
        </mesh>

        {/* Inner AI Core */}
        <mesh ref={coreRef}>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial
            color="#22D3EE"
            emissive="#22D3EE"
            emissiveIntensity={4}
            metalness={1}
            roughness={0}
          />
        </mesh>

        {/* Core Glow Point Light */}
        <pointLight color="#22D3EE" intensity={4} distance={5} />
      </Float>
    </group>
  );
}

export function AnimatedCubeLogo({ className }: { className?: string }) {
  return (
    <div className={className} style={{ width: '40px', height: '40px' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <ambientLight intensity={1} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#A855F7" />
        <Cube />
      </Canvas>
    </div>
  );
}
