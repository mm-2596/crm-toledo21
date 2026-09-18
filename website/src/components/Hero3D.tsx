"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMotionValueEvent, useReducedMotion, type MotionValue } from "framer-motion";
import * as THREE from "three";

const GOLD = "#c9a06a";
const GOLD_DEEP = "#a9834f";

interface NodeSpec {
  position: [number, number, number];
  radius: number;
  detail: 0 | 1;
}

// Un pequeño "sistema" de nodos dorados flotando en profundidad real, unidos
// por algunas líneas — sugiere red/conexión (propiedades, agentes, clientes)
// sin ser literal ni fotorrealista.
const NODES: NodeSpec[] = [
  { position: [-2.3, 0.6, 0], radius: 0.85, detail: 1 },
  { position: [2.1, -0.5, -1.2], radius: 0.55, detail: 0 },
  { position: [0.5, 1.5, -0.6], radius: 0.38, detail: 0 },
  { position: [-1.1, -1.4, -0.9], radius: 0.5, detail: 1 },
  { position: [2.6, 1.2, -2.1], radius: 0.3, detail: 0 },
  { position: [-2.7, -0.9, -1.7], radius: 0.32, detail: 0 },
];

const LINKS: [number, number][] = [
  [0, 2],
  [0, 3],
  [1, 2],
  [1, 4],
  [3, 5],
  [2, 4],
];

function Nodes() {
  return (
    <>
      {NODES.map((n, i) => (
        <mesh key={i} position={n.position}>
          <icosahedronGeometry args={[n.radius, n.detail]} />
          <meshStandardMaterial color={GOLD} metalness={0.75} roughness={0.32} emissive={GOLD_DEEP} emissiveIntensity={0.12} />
        </mesh>
      ))}
      {LINKS.map(([a, b], i) => (
        <Link key={i} start={NODES[a].position} end={NODES[b].position} />
      ))}
    </>
  );
}

function Link({ start, end }: { start: [number, number, number]; end: [number, number, number] }) {
  const geometry = useRef<THREE.BufferGeometry>(null);
  return (
    <line>
      <bufferGeometry
        ref={geometry}
        onUpdate={(g) => g.setFromPoints([new THREE.Vector3(...start), new THREE.Vector3(...end)])}
      />
      <lineBasicMaterial color={GOLD} transparent opacity={0.25} />
    </line>
  );
}

function Scene({ progress, reduceMotion }: { progress: MotionValue<number>; reduceMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  const scrollRef = useRef(0);
  const clock = useRef(0);

  useMotionValueEvent(progress, "change", (v) => {
    scrollRef.current = v;
  });

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    if (!reduceMotion) {
      clock.current += delta;
      g.rotation.y = clock.current * 0.06;
      g.rotation.x = Math.sin(clock.current * 0.15) * 0.08;
    }
    // Mismo efecto de acercamiento que antes tenía el fondo 2D al hacer scroll.
    g.scale.setScalar(1 + scrollRef.current * 0.35);
    g.rotation.z = scrollRef.current * 0.25;
  });

  return (
    <group ref={group}>
      <Nodes />
    </group>
  );
}

export function Hero3D({ progress }: { progress: MotionValue<number> }) {
  const reduceMotion = useReducedMotion();

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 6], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      className="!absolute inset-0"
    >
      <ambientLight intensity={0.55} />
      <pointLight position={[5, 5, 5]} intensity={80} color="#f3d9ad" />
      <pointLight position={[-5, -3, -2]} intensity={25} color={GOLD_DEEP} />
      <Scene progress={progress} reduceMotion={!!reduceMotion} />
    </Canvas>
  );
}
