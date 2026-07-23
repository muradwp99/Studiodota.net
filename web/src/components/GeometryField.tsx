"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Ambient architectural "geometry field" — a thin-line plan-grid lattice with
 * sparse posts and nodes, drifting slowly with a gentle pointer parallax.
 * Studiodota's counterpart to largo.studio's canvas logo-module background.
 *
 * Guards: loaded lazily (next/dynamic at the call site), DPR capped at 1.5,
 * renders only while on screen (IntersectionObserver), static under
 * prefers-reduced-motion, and never intercepts the pointer.
 */

const N = 12; // grid cells per side
const S = 1.1; // cell size
const HALF = (N * S) / 2;
const POST_H = 1.7;

function buildGeometry() {
  const lines: number[] = [];
  for (let i = 0; i <= N; i++) {
    const a = -HALF + i * S;
    lines.push(-HALF, 0, a, HALF, 0, a); // X-parallel floor lines
    lines.push(a, 0, -HALF, a, 0, HALF); // Z-parallel floor lines
  }
  // Sparse columns + top beams at deterministic pseudo-random intersections.
  for (let i = 0; i <= N; i += 3) {
    for (let j = 0; j <= N; j += 3) {
      if (Math.abs(Math.sin(i * 12.9898 + j * 78.233)) > 0.55) {
        const x = -HALF + i * S;
        const z = -HALF + j * S;
        lines.push(x, 0, z, x, POST_H, z);
        lines.push(x, POST_H, z, Math.min(x + 3 * S, HALF), POST_H, z);
      }
    }
  }
  const pts: number[] = [];
  for (let i = 0; i <= N; i += 2) {
    for (let j = 0; j <= N; j += 2) {
      pts.push(-HALF + i * S, 0, -HALF + j * S);
    }
  }
  return { linePos: new Float32Array(lines), pointPos: new Float32Array(pts) };
}

function Lattice({ color, opacity, animate }: { color: string; opacity: number; animate: boolean }) {
  const group = useRef<Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const { linePos, pointPos } = useMemo(() => buildGeometry(), []);

  useEffect(() => {
    if (!animate) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [animate]);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g || !animate) return;
    const d = Math.min(dt, 0.05); // clamp tab-switch jumps
    g.rotation.y += d * 0.04;
    const tx = 0.12 + pointer.current.y * 0.05;
    const tz = pointer.current.x * 0.04;
    g.rotation.x += (tx - g.rotation.x) * 0.03;
    g.rotation.z += (tz - g.rotation.z) * 0.03;
  });

  return (
    <group ref={group} rotation={[0.12, 0.6, 0]} position={[0, -0.4, 0]}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePos, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={opacity} />
      </lineSegments>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pointPos, 3]} />
        </bufferGeometry>
        <pointsMaterial color={color} transparent opacity={Math.min(1, opacity * 2.4)} size={0.05} sizeAttenuation />
      </points>
    </group>
  );
}

export default function GeometryField({
  className = "",
  color = "#a87f3f",
  opacity = 0.2,
}: {
  className?: string;
  color?: string;
  opacity?: number;
}) {
  const reduced = useReducedMotion();
  const host = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: "10%" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const animate = onScreen && !reduced;
  return (
    <div ref={host} className={`pointer-events-none ${className}`} aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        frameloop={animate ? "always" : "demand"}
        camera={{ position: [0, 2.6, 7.6], fov: 38 }}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        onCreated={({ camera }) => camera.lookAt(0, 0.3, 0)}
      >
        <Lattice color={color} opacity={opacity} animate={animate} />
      </Canvas>
    </div>
  );
}
