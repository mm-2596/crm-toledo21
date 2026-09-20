"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment } from "@react-three/drei";
import { useMotionValueEvent, useReducedMotion, type MotionValue } from "framer-motion";
import * as THREE from "three";

const GOLD = "#d9ae74";
const GOLD_PALE = "#f3d9ad";

// Una llave dorada y pulida, tipo objeto de producto de lujo — apoyada en
// reflejos de estudio reales (Environment de drei) en vez de una figura
// plana, que es lo que de verdad da sensación "premium". Metáfora directa
// del negocio: entregar las llaves de un hogar.
function Key({ progress, reduceMotion }: { progress: MotionValue<number>; reduceMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  const scrollRef = useRef(0);
  const mountTime = useRef<number | null>(null);

  useMotionValueEvent(progress, "change", (v) => {
    scrollRef.current = v;
  });

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    if (mountTime.current === null) mountTime.current = clock.elapsedTime;
    const since = clock.elapsedTime - mountTime.current;
    const s = scrollRef.current;

    // Entrada: gira y crece con un ligero rebote, como una pieza de
    // joyería presentándose — no fragmentos, un solo movimiento elegante.
    const introRaw = reduceMotion ? 1 : Math.min(1, since / 1.3);
    const introEase = 1 - Math.pow(1 - introRaw, 3);
    const overshoot = reduceMotion ? 1 : 1 + Math.sin(introRaw * Math.PI) * 0.12 * (1 - introRaw);
    const scale = introEase * overshoot * (0.95 + s * 0.35);

    const idleSpin = reduceMotion ? 0 : clock.elapsedTime * 0.35;
    const introSpin = reduceMotion ? 0 : (1 - introEase) * Math.PI * 1.4;

    g.scale.setScalar(Math.max(scale, 0.001));
    g.rotation.y = idleSpin + introSpin + s * 1.1;
    g.rotation.z = reduceMotion ? 0 : Math.sin(clock.elapsedTime * 0.5) * 0.05;
    g.position.y = 0.1 + (reduceMotion ? 0 : Math.sin(clock.elapsedTime * 0.6) * 0.05);
  });

  const material = { color: GOLD, metalness: 1, roughness: 0.22, envMapIntensity: 1.4 } as const;

  return (
    <group ref={group}>
      {/* Inclinada a horizontal — así es como se presenta una llave de
          verdad (entregada en la mano), y aprovecha mejor el ancho del hero. */}
      <group rotation={[0, 0, Math.PI / 2]}>
        {/* Cabeza (bow): un anillo ovalado */}
        <mesh position={[0, 0.62, 0]} scale={[1, 1.15, 0.55]}>
          <torusGeometry args={[0.4, 0.1, 24, 48]} />
          <meshStandardMaterial {...material} />
        </mesh>
        {/* Cuello: une la cabeza con el tallo */}
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.1, 0.11, 0.3, 20]} />
          <meshStandardMaterial {...material} />
        </mesh>
        {/* Tallo */}
        <mesh position={[0, -0.45, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 0.9, 20]} />
          <meshStandardMaterial {...material} />
        </mesh>
        {/* Guarda (bit): el tope antes de los dientes */}
        <mesh position={[0, -0.92, 0]}>
          <boxGeometry args={[0.28, 0.09, 0.16]} />
          <meshStandardMaterial {...material} />
        </mesh>
        {/* Dientes */}
        <mesh position={[0.16, -1.02, 0]}>
          <boxGeometry args={[0.12, 0.1, 0.14]} />
          <meshStandardMaterial {...material} />
        </mesh>
        <mesh position={[0.05, -1.12, 0]}>
          <boxGeometry args={[0.11, 0.09, 0.14]} />
          <meshStandardMaterial {...material} />
        </mesh>
        <mesh position={[-0.08, -1.2, 0]}>
          <boxGeometry args={[0.14, 0.08, 0.14]} />
          <meshStandardMaterial {...material} />
        </mesh>
      </group>
    </group>
  );
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
    camera.position.set(Math.sin(t * 0.1) * 0.15, 0.1, 4.6 - s * 1.8);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export function Hero3D({ progress }: { progress: MotionValue<number> }) {
  const reduceMotion = !!useReducedMotion();

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.1, 4.6], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      className="!absolute inset-0"
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 4, 4]} intensity={1.6} color={GOLD_PALE} />
      <directionalLight position={[-4, 1, -3]} intensity={0.5} color={GOLD} />
      <spotLight position={[0, 3, 2]} angle={0.4} penumbra={1} intensity={30} color={GOLD_PALE} />
      <Suspense fallback={null}>
        <Environment preset="studio" environmentIntensity={1.1} />
      </Suspense>
      <CameraRig progress={progress} reduceMotion={reduceMotion} />
      <Key progress={progress} reduceMotion={reduceMotion} />
      <ContactShadows position={[0, -1.5, 0]} opacity={0.55} scale={6} blur={2.4} far={2} color="#000000" />
    </Canvas>
  );
}
