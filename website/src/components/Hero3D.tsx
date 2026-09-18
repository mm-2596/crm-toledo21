"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMotionValueEvent, useReducedMotion, type MotionValue } from "framer-motion";
import * as THREE from "three";

const INK = "#161210";
const GOLD = "#d9ae74";
const GOLD_PALE = "#f3d9ad";

// Una sola figura, grande y reconocible (un tejado a dos aguas sobre un
// volumen), en vez de muchos objetos pequeños dispersos — el mismo recurso
// que usan sitios como Vercel con su triángulo: una silueta, un halo de luz
// detrás, y ya. Menos elementos, más impacto.
function House({ progress, reduceMotion }: { progress: MotionValue<number>; reduceMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  const scrollRef = useRef(0);

  useMotionValueEvent(progress, "change", (v) => {
    scrollRef.current = v;
  });

  const bodyEdges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1.9, 1.3, 1.9)), []);
  const roofEdges = useMemo(() => new THREE.EdgesGeometry(new THREE.ConeGeometry(1.55, 1.15, 4)), []);

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const t = reduceMotion ? 0 : clock.elapsedTime;
    const s = scrollRef.current;
    g.rotation.y = t * 0.05 + s * 0.9;
    g.position.y = 0.75 + Math.sin(t * 0.4) * 0.05;
    g.scale.setScalar(0.82 + s * 0.4);
  });

  return (
    <group ref={group}>
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[1.9, 1.3, 1.9]} />
        <meshStandardMaterial color={INK} metalness={0.4} roughness={0.6} />
      </mesh>
      <lineSegments geometry={bodyEdges} position={[0, -0.15, 0]}>
        <lineBasicMaterial color={GOLD} transparent opacity={0.9} />
      </lineSegments>

      <mesh position={[0, 1.06, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.55, 1.15, 4]} />
        <meshStandardMaterial color={INK} metalness={0.4} roughness={0.6} />
      </mesh>
      <lineSegments geometry={roofEdges} position={[0, 1.06, 0]} rotation={[0, Math.PI / 4, 0]}>
        <lineBasicMaterial color={GOLD} transparent opacity={0.95} />
      </lineSegments>
    </group>
  );
}

function HaloLight() {
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (!light.current) return;
    const t = clock.elapsedTime * 0.3;
    light.current.intensity = 55 + Math.sin(t) * 10;
  });
  return <pointLight ref={light} position={[0, 0.4, 3]} intensity={55} color={GOLD_PALE} />;
}

function CameraRig({ progress, reduceMotion }: { progress: MotionValue<number>; reduceMotion: boolean }) {
  const { camera } = useThree();
  const scrollRef = useRef(0);

  useMotionValueEvent(progress, "change", (v) => {
    scrollRef.current = v;
  });

  useFrame(({ clock }) => {
    const t = reduceMotion ? 0 : clock.elapsedTime;
    const s = scrollRef.current;
    camera.position.set(Math.sin(t * 0.1) * 0.2, 0.2, 6.5 - s * 2.4);
    camera.lookAt(0, 0.3, 0);
  });

  return null;
}

export function Hero3D({ progress }: { progress: MotionValue<number> }) {
  const reduceMotion = !!useReducedMotion();

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.2, 6.5], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      className="!absolute inset-0"
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 4]} intensity={1} color={GOLD_PALE} />
      <HaloLight />
      <CameraRig progress={progress} reduceMotion={reduceMotion} />
      <House progress={progress} reduceMotion={reduceMotion} />
    </Canvas>
  );
}
