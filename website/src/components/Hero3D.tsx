"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMotionValueEvent, useReducedMotion, type MotionValue } from "framer-motion";
import * as THREE from "three";

const INK = "#161210";
const GOLD = "#d9ae74";
const GOLD_DEEP = "#a9834f";
const GOLD_PALE = "#f3d9ad";

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

interface Edge {
  mid: THREE.Vector3;
  length: number;
  quaternion: THREE.Quaternion;
}

// Extrae cada arista de una geometría como un segmento (punto medio,
// longitud, orientación) — cada uno se convierte luego en un fragmento
// metálico que "vuela" hasta su sitio, igual que la referencia (cintas que
// se ensamblan), pero aplicado al contorno de nuestra casa.
function edgesFromGeometry(geometry: THREE.BufferGeometry): Edge[] {
  const edgesGeom = new THREE.EdgesGeometry(geometry);
  const pos = edgesGeom.attributes.position;
  const up = new THREE.Vector3(0, 1, 0);
  const edges: Edge[] = [];
  for (let i = 0; i < pos.count; i += 2) {
    const a = new THREE.Vector3().fromBufferAttribute(pos, i);
    const b = new THREE.Vector3().fromBufferAttribute(pos, i + 1);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const dir = b.clone().sub(a);
    const length = dir.length();
    dir.normalize();
    edges.push({ mid, length, quaternion: new THREE.Quaternion().setFromUnitVectors(up, dir) });
  }
  return edges;
}

function Shards({ edges, reduceMotion, startDelay }: { edges: Edge[]; reduceMotion: boolean; startDelay: number }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  const scatter = useMemo(
    () =>
      edges.map((_, i) => {
        const seed = i * 7.13 + startDelay * 91.7;
        const dir = new THREE.Vector3(
          pseudoRandom(seed) - 0.5,
          pseudoRandom(seed + 1) - 0.5,
          pseudoRandom(seed + 2) - 0.5,
        ).normalize();
        const dist = 2.6 + pseudoRandom(seed + 3) * 2.4;
        return {
          offset: dir.multiplyScalar(dist),
          scatterQ: new THREE.Quaternion().setFromEuler(
            new THREE.Euler(
              (pseudoRandom(seed + 4) - 0.5) * Math.PI,
              (pseudoRandom(seed + 5) - 0.5) * Math.PI,
              (pseudoRandom(seed + 6) - 0.5) * Math.PI,
            ),
          ),
          delay: startDelay + pseudoRandom(seed + 7) * 0.5,
          duration: 0.6 + pseudoRandom(seed + 8) * 0.5,
        };
      }),
    [edges, startDelay],
  );

  useFrame(({ clock }) => {
    const t = reduceMotion ? 999 : clock.elapsedTime;
    edges.forEach((edge, i) => {
      const mesh = refs.current[i];
      if (!mesh) return;
      const s = scatter[i];
      const raw = Math.min(1, Math.max(0, (t - s.delay) / s.duration));
      const p = 1 - Math.pow(1 - raw, 3);

      mesh.position.set(
        edge.mid.x + s.offset.x * (1 - p),
        edge.mid.y + s.offset.y * (1 - p),
        edge.mid.z + s.offset.z * (1 - p),
      );
      mesh.quaternion.copy(edge.quaternion);
      if (p < 1) mesh.quaternion.slerp(s.scatterQ, 1 - p);

      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.3 + 0.7 * p;
    });
  });

  return (
    <>
      {edges.map((edge, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }}>
          <cylinderGeometry args={[0.026, 0.026, edge.length, 6]} />
          <meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.25} emissive={GOLD_DEEP} emissiveIntensity={0.2} transparent />
        </mesh>
      ))}
    </>
  );
}

function Faces({ reduceMotion, revealAt }: { reduceMotion: boolean; revealAt: number }) {
  const bodyRef = useRef<THREE.Mesh>(null);
  const roofRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = reduceMotion ? 999 : clock.elapsedTime;
    const p = Math.min(1, Math.max(0, (t - revealAt) / 0.7));
    if (bodyRef.current) (bodyRef.current.material as THREE.MeshStandardMaterial).opacity = p;
    if (roofRef.current) (roofRef.current.material as THREE.MeshStandardMaterial).opacity = p;
  });

  return (
    <>
      <mesh ref={bodyRef} position={[0, -0.15, 0]}>
        <boxGeometry args={[1.9, 1.3, 1.9]} />
        <meshStandardMaterial color={INK} metalness={0.4} roughness={0.6} transparent opacity={0} />
      </mesh>
      <mesh ref={roofRef} position={[0, 1.06, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.55, 1.15, 4]} />
        <meshStandardMaterial color={INK} metalness={0.4} roughness={0.6} transparent opacity={0} />
      </mesh>
    </>
  );
}

// Una sola figura, grande y reconocible (un tejado a dos aguas sobre un
// volumen). En vez de aparecer ya formada, se ensambla a partir de
// fragmentos metálicos que vuelan hasta su sitio — mismo recurso que la
// referencia (cintas que se ensamblan), aplicado a nuestra silueta de casa.
function House({ progress, reduceMotion }: { progress: MotionValue<number>; reduceMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  const scrollRef = useRef(0);

  useMotionValueEvent(progress, "change", (v) => {
    scrollRef.current = v;
  });

  const bodyEdges = useMemo(
    () => edgesFromGeometry(new THREE.BoxGeometry(1.9, 1.3, 1.9).translate(0, -0.15, 0)),
    [],
  );
  const roofEdges = useMemo(
    () => edgesFromGeometry(new THREE.ConeGeometry(1.55, 1.15, 4).rotateY(Math.PI / 4).translate(0, 1.06, 0)),
    [],
  );

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
      <Shards edges={bodyEdges} reduceMotion={reduceMotion} startDelay={0} />
      <Shards edges={roofEdges} reduceMotion={reduceMotion} startDelay={0.4} />
      <Faces reduceMotion={reduceMotion} revealAt={1.3} />
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
