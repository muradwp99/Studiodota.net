"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";

type Tower = { x: number; z: number; w: number; d: number; h: number };

function useTowers(): Tower[] {
  return useMemo(() => {
    const towers: Tower[] = [];
    const grid = 6;
    let seed = 11;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = -grid; i <= grid; i++) {
      for (let j = -grid; j <= grid; j++) {
        const dist = Math.hypot(i, j);
        if (rand() < 0.3 && dist > 0.6) {
          const h = 0.8 + rand() * 5 * (1 - dist / (grid * 1.7));
          if (h < 0.7) continue;
          towers.push({
            x: i * 1.5 + (rand() - 0.5) * 0.35,
            z: j * 1.5 + (rand() - 0.5) * 0.35,
            w: 0.7 + rand() * 0.55,
            d: 0.7 + rand() * 0.55,
            h: Math.max(0.8, h),
          });
        }
      }
    }
    return towers;
  }, []);
}

function City({ progress }: { progress: RefObject<number> }) {
  const towers = useTowers();
  const group = useRef<THREE.Group>(null);
  const grid = useRef<THREE.GridHelper>(null);
  const { camera } = useThree();

  const solidMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#cfc8ba",
        roughness: 0.9,
        metalness: 0.0,
        transparent: true,
        opacity: 1,
      }),
    []
  );
  const lineMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#c17a5b",
        transparent: true,
        opacity: 0,
      }),
    []
  );

  useFrame((state) => {
    const p = progress.current ?? 0;
    const t = state.clock.elapsedTime;

    const radius = 15 - p * 5.5;
    const angle = -0.6 + p * 1.0 + Math.sin(t * 0.06) * 0.03;
    camera.position.set(
      Math.sin(angle) * radius,
      3.2 + p * 4.5,
      Math.cos(angle) * radius
    );
    camera.lookAt(0, 1.3 + p * 0.6, 0);

    if (group.current) group.current.rotation.y = p * 0.25;

    solidMat.opacity = Math.max(0.0, 1 - p * 1.25);
    lineMat.opacity = Math.min(1, Math.max(0, (p - 0.15) * 1.5));
    if (grid.current) {
      (grid.current.material as THREE.Material).opacity = Math.min(
        0.5,
        Math.max(0, (p - 0.2) * 0.9)
      );
    }
  });

  return (
    <group ref={group}>
      {towers.map((tw, i) => {
        const geo = new THREE.BoxGeometry(tw.w, tw.h, tw.d);
        return (
          <group key={i} position={[tw.x, tw.h / 2, tw.z]}>
            <mesh geometry={geo} material={solidMat} castShadow receiveShadow />
            <lineSegments material={lineMat}>
              <edgesGeometry args={[geo]} />
            </lineSegments>
          </group>
        );
      })}
      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#0d0d0f" roughness={1} metalness={0} />
      </mesh>
      <gridHelper
        ref={grid}
        args={[80, 80, "#c17a5b", "#3a2a22"]}
        position={[0, 0.01, 0]}
      >
        <lineBasicMaterial transparent opacity={0} />
      </gridHelper>
    </group>
  );
}

export default function Hero3D({ progress }: { progress: RefObject<number> }) {
  return (
    <Canvas
      dpr={[1, 1.8]}
      shadows
      resize={{ scroll: false, debounce: 0 }}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      camera={{ fov: 42, position: [10, 4, 10], near: 0.1, far: 100 }}
      onCreated={({ scene }) => {
        scene.fog = new THREE.Fog("#0b0b0c", 14, 46);
      }}
    >
      <ambientLight intensity={0.35} color="#b9c4d6" />
      <directionalLight
        position={[-8, 12, 6]}
        intensity={2.1}
        color="#e9c98a"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[10, 6, -8]} intensity={0.5} color="#4ea1ff" />
      <City progress={progress} />
    </Canvas>
  );
}
