"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial } from "@react-three/drei";
import type { Mesh } from "three";
import { useReducedMotion } from "@/lib/useReducedMotion";

function Gem() {
  const ref = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += delta * 0.16;
    ref.current.rotation.y += delta * 0.24;
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1, 8]} />
      <MeshDistortMaterial
        color="#d9a24a"
        metalness={0.35}
        roughness={0.22}
        clearcoat={1}
        clearcoatRoughness={0.08}
        distort={0.3}
        speed={1.6}
      />
    </mesh>
  );
}

/** Decorative bronze-glass gem — floats over the About stats band. Static under reduced motion. */
export default function GlossyObject() {
  const reduced = useReducedMotion();
  return (
    <Canvas
      camera={{ position: [0, 0, 3.2], fov: 40 }}
      dpr={[1, 1.75]}
      frameloop={reduced ? "demand" : "always"}
      gl={{ antialias: true, alpha: true }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 4, 2]} intensity={2} />
        <directionalLight position={[-3, -1, 1]} intensity={0.5} color="#a87f3f" />
        <pointLight position={[0, 2, 3]} intensity={0.8} color="#fff4dd" />
        <Gem />
      </Suspense>
    </Canvas>
  );
}
