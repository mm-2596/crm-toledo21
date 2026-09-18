"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMotionValueEvent, useReducedMotion, type MotionValue } from "framer-motion";
import * as THREE from "three";

const GOLD = "#d9ae74";
const GOLD_DEEP = "#a9834f";
const GOLD_PALE = "#f3d9ad";

// Un satélite orbitando alrededor de la gema central — pequeños, con su
// propio radio y velocidad de órbita, dan sensación de sistema en movimiento
// en vez de un solo objeto estático.
interface Satellite {
  orbitRadius: number;
  orbitSpeed: number;
  orbitOffset: number;
  tilt: number;
  size: number;
}

const SATELLITES: Satellite[] = [
  { orbitRadius: 2.6, orbitSpeed: 0.35, orbitOffset: 0, tilt: 0.25, size: 0.22 },
  { orbitRadius: 3.1, orbitSpeed: -0.24, orbitOffset: 2.1, tilt: -0.4, size: 0.16 },
  { orbitRadius: 2.2, orbitSpeed: 0.5, orbitOffset: 4.2, tilt: 0.55, size: 0.13 },
  { orbitRadius: 3.6, orbitSpeed: -0.18, orbitOffset: 1.2, tilt: -0.15, size: 0.19 },
];

function Satellites({ clock }: { clock: React.MutableRefObject<number> }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(() => {
    const t = clock.current;
    SATELLITES.forEach((s, i) => {
      const mesh = refs.current[i];
      if (!mesh) return;
      const angle = t * s.orbitSpeed + s.orbitOffset;
      mesh.position.set(
        Math.cos(angle) * s.orbitRadius,
        Math.sin(angle * 0.6) * s.orbitRadius * Math.sin(s.tilt),
        Math.sin(angle) * s.orbitRadius * Math.cos(s.tilt),
      );
    });
  });

  return (
    <>
      {SATELLITES.map((s, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }}>
          <octahedronGeometry args={[s.size, 0]} />
          <meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.25} emissive={GOLD_DEEP} emissiveIntensity={0.2} />
        </mesh>
      ))}
    </>
  );
}

// La gema central: un núcleo sólido facetado envuelto en una segunda capa
// de alambre (wireframe) más grande que gira al revés — ese contraste de
// capas es lo que le da un aire "tecnológico/joya" distinto a una simple
// figura sólida.
function Gem({ clock, reduceMotion }: { clock: React.MutableRefObject<number>; reduceMotion: boolean }) {
  const core = useRef<THREE.Mesh>(null);
  const shell = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const t = clock.current;
    if (core.current) {
      core.current.rotation.y = reduceMotion ? 0 : t * 0.22;
      core.current.rotation.x = reduceMotion ? 0 : Math.sin(t * 0.3) * 0.15;
    }
    if (shell.current) {
      shell.current.rotation.y = reduceMotion ? 0 : -t * 0.12;
      shell.current.rotation.x = reduceMotion ? 0 : Math.cos(t * 0.2) * 0.1;
    }
  });

  return (
    <>
      <mesh ref={core}>
        <icosahedronGeometry args={[1.35, 1]} />
        <meshPhysicalMaterial
          color={GOLD}
          metalness={0.9}
          roughness={0.18}
          emissive={GOLD_DEEP}
          emissiveIntensity={0.15}
          clearcoat={0.6}
          clearcoatRoughness={0.25}
        />
      </mesh>
      <mesh ref={shell}>
        <icosahedronGeometry args={[1.95, 1]} />
        <meshBasicMaterial color={GOLD_PALE} wireframe transparent opacity={0.22} />
      </mesh>
    </>
  );
}

// La luz principal recorre una órbita propia — un facetado dorado solo
// "brilla" de verdad cuando la luz se mueve sobre él, así que el
// movimiento de la luz hace más por la sensación de joya que el giro solo.
function OrbitingLight({ clock }: { clock: React.MutableRefObject<number> }) {
  const light = useRef<THREE.PointLight>(null);
  useFrame(() => {
    if (!light.current) return;
    const t = clock.current * 0.4;
    light.current.position.set(Math.cos(t) * 4, Math.sin(t * 0.7) * 2.5, Math.sin(t) * 4);
  });
  return <pointLight ref={light} intensity={90} color={GOLD_PALE} />;
}

function Scene({ progress, reduceMotion }: { progress: MotionValue<number>; reduceMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  const scrollRef = useRef(0);
  const clock = useRef(0);

  useMotionValueEvent(progress, "change", (v) => {
    scrollRef.current = v;
  });

  useFrame((_, delta) => {
    if (!reduceMotion) clock.current += delta;
    const g = group.current;
    if (!g) return;
    g.scale.setScalar(1 + scrollRef.current * 0.4);
    g.rotation.y = scrollRef.current * 0.6;
  });

  return (
    <group ref={group}>
      <Gem clock={clock} reduceMotion={reduceMotion} />
      <Satellites clock={clock} />
      <OrbitingLight clock={clock} />
    </group>
  );
}

// Pseudoaleatorio determinista (sin Math.random) para que la nube de puntos
// sea estable entre renders sin depender de una función impura.
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function Sparks() {
  const positions = useMemo(() => {
    const arr = new Float32Array(90 * 3);
    for (let i = 0; i < 90; i++) {
      const r = 3.5 + pseudoRandom(i * 3.1) * 3;
      const theta = pseudoRandom(i * 7.7 + 1) * Math.PI * 2;
      const phi = Math.acos(2 * pseudoRandom(i * 5.3 + 2) - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  const points = useRef<THREE.Points>(null);
  useFrame((_, delta) => {
    if (points.current) points.current.rotation.y += delta * 0.015;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={GOLD_PALE} size={0.035} transparent opacity={0.55} sizeAttenuation />
    </points>
  );
}

export function Hero3D({ progress }: { progress: MotionValue<number> }) {
  const reduceMotion = useReducedMotion();

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 6.5], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      className="!absolute inset-0"
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[-5, -3, -2]} intensity={20} color={GOLD_DEEP} />
      <Scene progress={progress} reduceMotion={!!reduceMotion} />
      <Sparks />
    </Canvas>
  );
}
